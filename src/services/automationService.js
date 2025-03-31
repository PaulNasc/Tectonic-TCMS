import { db, storage } from '../config/firebase';
import { 
  collection, 
  doc,
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { nanoid } from 'nanoid';

/**
 * Serviço responsável pelo sistema de automação e integração contínua
 */
class AutomationService {
  constructor() {
    this.automationsCollection = 'automations';
    this.executionsCollection = 'automationExecutions';
    this.integrationsCollection = 'ciIntegrations';
  }

  /**
   * Cria uma nova configuração de automação
   * @param {Object} automationData Dados da automação
   * @returns {Promise<Object>} Resultado da operação
   */
  async createAutomation(automationData) {
    try {
      const id = automationData.id || nanoid();
      const automationRef = doc(db, this.automationsCollection, id);
      
      const newAutomation = {
        ...automationData,
        id,
        status: 'active',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastExecution: null,
        executionCount: 0,
        successCount: 0,
        failureCount: 0
      };
      
      await setDoc(automationRef, newAutomation);
      
      return { 
        data: { id, ...newAutomation },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Obtém uma automação pelo ID
   * @param {string} id ID da automação
   * @returns {Promise<Object>} Resultado da operação
   */
  async getAutomation(id) {
    try {
      const automationRef = doc(db, this.automationsCollection, id);
      const automationSnap = await getDoc(automationRef);
      
      if (!automationSnap.exists()) {
        return { 
          data: null, 
          error: 'Automação não encontrada' 
        };
      }
      
      return { 
        data: automationSnap.data(), 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao obter automação:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Atualiza uma configuração de automação existente
   * @param {string} id ID da automação
   * @param {Object} updateData Dados a serem atualizados
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateAutomation(id, updateData) {
    try {
      const automationRef = doc(db, this.automationsCollection, id);
      
      // Verifica se a automação existe
      const automationSnap = await getDoc(automationRef);
      if (!automationSnap.exists()) {
        return { 
          data: null, 
          error: 'Automação não encontrada' 
        };
      }
      
      // Remove campos que não devem ser alterados diretamente
      const { id: _, createdAt, executionCount, ...safeUpdateData } = updateData;
      
      // Atualiza a automação
      await updateDoc(automationRef, {
        ...safeUpdateData,
        lastUpdated: serverTimestamp()
      });
      
      return { 
        data: { id, ...automationSnap.data(), ...safeUpdateData },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao atualizar automação:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Exclui uma configuração de automação
   * @param {string} id ID da automação
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteAutomation(id) {
    try {
      const automationRef = doc(db, this.automationsCollection, id);
      
      // Verifica se a automação existe
      const automationSnap = await getDoc(automationRef);
      if (!automationSnap.exists()) {
        return { 
          data: null, 
          error: 'Automação não encontrada' 
        };
      }
      
      // Exclui a automação
      await deleteDoc(automationRef);
      
      return { 
        data: { id },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Obtém todas as automações de um projeto
   * @param {string} projectId ID do projeto
   * @returns {Promise<Object>} Resultado da operação
   */
  async getProjectAutomations(projectId) {
    try {
      const automationsQuery = query(
        collection(db, this.automationsCollection),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const automationsSnap = await getDocs(automationsQuery);
      const automations = automationsSnap.docs.map(doc => doc.data());
      
      return { 
        data: automations,
        error: null 
      };
    } catch (error) {
      console.error('Erro ao obter automações do projeto:', error);
      return { 
        data: [], 
        error: error.message 
      };
    }
  }

  /**
   * Registra uma nova execução de automação
   * @param {string} automationId ID da automação
   * @param {Object} executionData Dados da execução
   * @returns {Promise<Object>} Resultado da operação
   */
  async recordExecution(automationId, executionData) {
    try {
      // Obtém a automação
      const { data: automation, error } = await this.getAutomation(automationId);
      if (error) {
        return { data: null, error };
      }
      
      // Cria ID para a execução
      const executionId = nanoid();
      const executionRef = doc(db, this.executionsCollection, executionId);
      
      // Define dados da execução
      const newExecution = {
        id: executionId,
        automationId,
        projectId: automation.projectId,
        status: executionData.status || 'running',
        startTime: serverTimestamp(),
        endTime: null,
        testResults: executionData.testResults || [],
        triggerType: executionData.triggerType || 'manual',
        triggerBy: executionData.triggerBy || null,
        buildNumber: executionData.buildNumber || null,
        gitCommit: executionData.gitCommit || null,
        gitBranch: executionData.gitBranch || null,
        logsUrl: executionData.logsUrl || null,
        environment: executionData.environment || 'test',
        metadata: executionData.metadata || {}
      };
      
      // Salva a nova execução
      await setDoc(executionRef, newExecution);
      
      // Atualiza a automação
      await updateDoc(doc(db, this.automationsCollection, automationId), {
        lastExecution: serverTimestamp(),
        executionCount: (automation.executionCount || 0) + 1,
      });
      
      return { 
        data: { id: executionId, ...newExecution },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao registrar execução:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Atualiza o status de uma execução de automação
   * @param {string} executionId ID da execução
   * @param {Object} updateData Dados a serem atualizados
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateExecutionStatus(executionId, updateData) {
    try {
      const executionRef = doc(db, this.executionsCollection, executionId);
      
      // Verifica se a execução existe
      const executionSnap = await getDoc(executionRef);
      if (!executionSnap.exists()) {
        return { 
          data: null, 
          error: 'Execução não encontrada' 
        };
      }
      
      const executionData = executionSnap.data();
      const automationId = executionData.automationId;
      
      // Verifica se o status está sendo alterado para concluído
      let updateFields = { ...updateData };
      if (updateData.status === 'completed' || updateData.status === 'failed') {
        updateFields.endTime = serverTimestamp();
      }
      
      // Atualiza a execução
      await updateDoc(executionRef, updateFields);
      
      // Se a execução for concluída, atualiza as estatísticas da automação
      if (updateData.status === 'completed' || updateData.status === 'failed') {
        const { data: automation } = await this.getAutomation(automationId);
        
        // Incrementa contador de sucesso ou falha
        const updateAutomationFields = {};
        if (updateData.status === 'completed') {
          updateAutomationFields.successCount = (automation.successCount || 0) + 1;
        } else {
          updateAutomationFields.failureCount = (automation.failureCount || 0) + 1;
        }
        
        await updateDoc(doc(db, this.automationsCollection, automationId), updateAutomationFields);
      }
      
      return { 
        data: { id: executionId, ...executionData, ...updateFields },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao atualizar status da execução:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Obtém o histórico de execuções de uma automação
   * @param {string} automationId ID da automação
   * @param {number} limit Limite de execuções a serem retornadas
   * @returns {Promise<Object>} Resultado da operação
   */
  async getExecutionHistory(automationId, limit = 10) {
    try {
      const executionsQuery = query(
        collection(db, this.executionsCollection),
        where('automationId', '==', automationId),
        orderBy('startTime', 'desc'),
      );
      
      const executionsSnap = await getDocs(executionsQuery);
      const executions = executionsSnap.docs.map(doc => doc.data());
      
      // Limita o número de execuções retornadas
      const limitedExecutions = executions.slice(0, limit);
      
      return { 
        data: limitedExecutions,
        error: null 
      };
    } catch (error) {
      console.error('Erro ao obter histórico de execuções:', error);
      return { 
        data: [], 
        error: error.message 
      };
    }
  }

  /**
   * Configura uma integração CI/CD para um projeto
   * @param {Object} integrationData Dados da integração
   * @returns {Promise<Object>} Resultado da operação
   */
  async setupCIIntegration(integrationData) {
    try {
      const id = integrationData.id || nanoid();
      const integrationRef = doc(db, this.integrationsCollection, id);
      
      const newIntegration = {
        ...integrationData,
        id,
        status: 'active',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        webhookSecret: nanoid(32), // Segredo único para validar webhooks
      };
      
      await setDoc(integrationRef, newIntegration);
      
      return { 
        data: { id, ...newIntegration },
        error: null 
      };
    } catch (error) {
      console.error('Erro ao configurar integração CI/CD:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }

  /**
   * Obtém as integrações CI/CD de um projeto
   * @param {string} projectId ID do projeto
   * @returns {Promise<Object>} Resultado da operação
   */
  async getProjectIntegrations(projectId) {
    try {
      const integrationsQuery = query(
        collection(db, this.integrationsCollection),
        where('projectId', '==', projectId),
      );
      
      const integrationsSnap = await getDocs(integrationsQuery);
      const integrations = integrationsSnap.docs.map(doc => doc.data());
      
      return { 
        data: integrations,
        error: null 
      };
    } catch (error) {
      console.error('Erro ao obter integrações do projeto:', error);
      return { 
        data: [], 
        error: error.message 
      };
    }
  }

  /**
   * Gera um relatório de automação para um projeto
   * @param {string} projectId ID do projeto
   * @returns {Promise<Object>} Resultado da operação
   */
  async generateAutomationReport(projectId) {
    try {
      // Obtém todas as automações do projeto
      const { data: automations, error: automationsError } = await this.getProjectAutomations(projectId);
      if (automationsError) {
        return { data: null, error: automationsError };
      }
      
      // Obtém todas as execuções para o projeto
      const executionsQuery = query(
        collection(db, this.executionsCollection),
        where('projectId', '==', projectId),
        orderBy('startTime', 'desc'),
      );
      
      const executionsSnap = await getDocs(executionsQuery);
      const executions = executionsSnap.docs.map(doc => doc.data());
      
      // Calcula estatísticas
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      
      // Agrupa execuções por automação
      const executionsByAutomation = automations.map(automation => {
        const autoExecutions = executions.filter(e => e.automationId === automation.id);
        const autoSuccessRate = autoExecutions.length > 0 
          ? (autoExecutions.filter(e => e.status === 'completed').length / autoExecutions.length) * 100 
          : 0;
        
        return {
          automationId: automation.id,
          automationName: automation.name,
          executionCount: autoExecutions.length,
          successRate: autoSuccessRate,
          lastExecution: autoExecutions.length > 0 ? autoExecutions[0] : null,
        };
      });
      
      // Gera o relatório
      const report = {
        projectId,
        generatedAt: new Date().toISOString(),
        automationCount: automations.length,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate,
        automations: executionsByAutomation,
        recentExecutions: executions.slice(0, 10),
        trends: {
          // Adicionaria tendências com base no histórico (simplificado nesta implementação)
          lastWeekSuccessRate: successRate, // Simplificado
          lastMonthSuccessRate: successRate, // Simplificado
        }
      };
      
      return { 
        data: report,
        error: null 
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de automação:', error);
      return { 
        data: null, 
        error: error.message 
      };
    }
  }
}

export const automationService = new AutomationService(); 