import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, increment, serverTimestamp, arrayUnion, Timestamp, deleteDoc } from 'firebase/firestore';
import { projectService } from './projectService';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION = 'testSuites';

export const testSuiteService = {
  async createTestSuite(suiteData) {
    try {
      console.log('Criando suite de teste:', suiteData);
      
      // Validar se o projeto existe
      const { data: project, error: projectError } = await projectService.getProjectById(suiteData.projectId);
      if (projectError) throw new Error(projectError);

      const docRef = await addDoc(collection(db, COLLECTION), {
        ...suiteData,
        status: 'active',
        testCases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        statistics: {
          totalTests: 0,
          passRate: 0,
          lastExecution: null,
          automationRate: 0
        }
      });

      const newSuite = {
        id: docRef.id,
        ...suiteData,
        status: 'active',
        testCases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        statistics: {
          totalTests: 0,
          passRate: 0,
          lastExecution: null,
          automationRate: 0
        }
      };

      console.log('Suite criada:', newSuite);

      // Atualizar a lista de suítes no projeto
      await projectService.updateProject(suiteData.projectId, {
        testSuites: [...(project.testSuites || []), docRef.id]
      });

      return { data: newSuite, error: null };
    } catch (error) {
      console.error('Erro ao criar suite de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async getTestSuiteById(id) {
    try {
      console.log('Buscando suite de teste:', id);
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Suite não encontrada:', id);
        throw new Error('Suite de teste não encontrada');
      }

      const data = docSnap.data();
      console.log('Dados da suite encontrada:', data);

      const suite = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        testCases: data.testCases?.map(tc => ({
          ...tc,
          createdAt: tc.createdAt?.toDate?.() || tc.createdAt,
          updatedAt: tc.updatedAt?.toDate?.() || tc.updatedAt,
          lastExecution: tc.lastExecution?.toDate?.() || tc.lastExecution
        })) || []
      };

      return { data: suite, error: null };
    } catch (error) {
      console.error('Erro ao buscar suite de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async updateTestSuite(id, updates) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });

      return { data: { id, ...updates }, error: null };
    } catch (error) {
      console.error('Erro ao atualizar suite de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async listTestSuites(projectId, filters = {}) {
    try {
      let q = collection(db, COLLECTION);
      
      // Filtrar por projeto
      q = query(q, where('projectId', '==', projectId));
      
      // Aplicar filtros adicionais
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      // Ordenar por data de criação
      q = query(q, orderBy('createdAt', 'desc'));
      
      console.log('Buscando suites com filtros:', { projectId, ...filters });
      console.log('Query Firestore para suites:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('Suites encontradas:', querySnapshot.size);
      
      const suites = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Dados da suite:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          testCases: data.testCases?.map(tc => ({
            ...tc,
            createdAt: tc.createdAt?.toDate?.() || tc.createdAt,
            updatedAt: tc.updatedAt?.toDate?.() || tc.updatedAt,
            lastExecution: tc.lastExecution?.toDate?.() || tc.lastExecution
          })) || []
        };
      });

      return { data: suites, error: null };
    } catch (error) {
      console.error('Erro ao listar suites de teste:', error);
      
      // Erro específico para índices ausentes
      if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
        console.error('ERRO DE ÍNDICE DE SUITES:', error.message);
        
        // Extrair o link do índice, se disponível
        const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s"')]+/);
        const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;
        
        if (indexUrl) {
          console.log('LINK PARA CRIAR ÍNDICE DE SUITES:', indexUrl);
          return { data: [], error: `É necessário criar um índice composto para esta consulta. Link do índice de suites: ${indexUrl}` };
        }
      }
      
      return { data: [], error: error.message };
    }
  },

  async createTestCase(suiteId, testCaseData, userId) {
    try {
      console.log('Criando caso de teste na suite:', suiteId, testCaseData);
      
      // Buscar a suite para garantir que existe e obter o projectId
      const suiteDoc = await getDoc(doc(db, COLLECTION, suiteId));
      if (!suiteDoc.exists()) {
        throw new Error('Suite de teste não encontrada');
      }
      
      const suiteData = suiteDoc.data();
      const projectId = suiteData.projectId;
      
      // Preparar os dados do caso de teste
      const testCase = {
        id: uuidv4(), // Gera um ID único
        name: testCaseData.name,
        description: testCaseData.description,
        priority: testCaseData.priority || 'Média',
        status: 'Não Executado',
        type: testCaseData.type || 'Manual',
        prerequisites: testCaseData.prerequisites || [],
        steps: testCaseData.steps || [],
        expectedResults: testCaseData.expectedResults || '',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastExecution: null,
        executions: []
      };
      
      // Adicionar o caso de teste à suite
      const testCases = suiteData.testCases || [];
      testCases.push(testCase);
      
      // Atualizar a suite com o novo caso de teste
      await updateDoc(doc(db, COLLECTION, suiteId), {
        testCases,
        updatedAt: new Date()
      });
      
      // Atualizar estatísticas do projeto
      try {
        if (projectId) {
          const projectRef = doc(db, 'projects', projectId);
          const projectDoc = await getDoc(projectRef);
          
          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const statistics = projectData.statistics || {
              totalTestCases: 0,
              passRate: 0,
              lastExecution: null
            };
            
            // Incrementar total de casos de teste
            statistics.totalTestCases = (statistics.totalTestCases || 0) + 1;
            
            await updateDoc(projectRef, {
              statistics,
              updatedAt: new Date()
            });
            
            console.log('Estatísticas do projeto atualizadas:', statistics);
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar estatísticas do projeto:', err);
        // Não interrompe o fluxo principal se houver erro
      }
      
      return { data: testCase, error: null };
    } catch (error) {
      console.error('Erro ao criar caso de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async updateTestCase(suiteId, testCaseId, updates) {
    try {
      const { data: suite, error } = await this.getTestSuiteById(suiteId);
      if (error) throw new Error(error);

      const testCaseIndex = suite.testCases.findIndex(tc => tc.id === testCaseId);
      if (testCaseIndex === -1) {
        throw new Error('Caso de teste não encontrado');
      }

      const updatedTestCases = [...suite.testCases];
      updatedTestCases[testCaseIndex] = {
        ...updatedTestCases[testCaseIndex],
        ...updates,
        updatedAt: new Date()
      };

      const updatedStatistics = {
        ...suite.statistics,
        automationRate: calculateAutomationRate(updatedTestCases)
      };

      await updateDoc(doc(db, COLLECTION, suiteId), {
        testCases: updatedTestCases,
        statistics: updatedStatistics,
        updatedAt: new Date()
      });

      return { data: { id: testCaseId, ...updates }, error: null };
    } catch (error) {
      console.error('Erro ao atualizar caso de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async updateStatistics(suiteId, executionResult) {
    try {
      const { data: suite, error } = await this.getTestSuiteById(suiteId);
      if (error) throw new Error(error);

      const updatedStatistics = calculateUpdatedStatistics(suite.statistics, executionResult);

      await updateDoc(doc(db, COLLECTION, suiteId), {
        statistics: updatedStatistics,
        updatedAt: new Date()
      });

      return { data: { id: suiteId, statistics: updatedStatistics }, error: null };
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      return { data: null, error: error.message };
    }
  },

  async getTestSuite(suiteId) {
    try {
      console.log(`Buscando suíte de teste com ID: ${suiteId}`);
      const suiteRef = doc(db, 'testSuites', suiteId);
      const suiteSnap = await getDoc(suiteRef);
      
      if (!suiteSnap.exists()) {
        console.error(`Suíte de teste não encontrada: ${suiteId}`);
        throw new Error('Suíte de teste não encontrada');
      }

      const suiteData = suiteSnap.data();
      
      // Formatar timestamps
      const suite = {
        id: suiteSnap.id,
        ...suiteData,
        createdAt: suiteData.createdAt ? suiteData.createdAt.toDate().toISOString() : null,
        updatedAt: suiteData.updatedAt ? suiteData.updatedAt.toDate().toISOString() : null,
        testCases: suiteData.testCases || []
      };
      
      console.log(`Suíte de teste carregada:`, suite);
      return suite;
    } catch (error) {
      console.error('Erro ao buscar suíte de teste:', error);
      throw error;
    }
  },

  async updateTestSuite(suiteId, suiteData) {
    try {
      console.log(`Atualizando suíte de teste ${suiteId} com dados:`, suiteData);
      const suiteRef = doc(db, 'testSuites', suiteId);
      
      // Obter dados atuais para mesclar
      const currentSuite = await this.getTestSuite(suiteId);
      
      // Preparar dados para atualização
      const updateData = {
        ...suiteData,
        updatedAt: serverTimestamp()
      };
      
      // Remover campos que não devem ser substituídos diretamente
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.createdBy;
      delete updateData.projectId;
      
      if (!updateData.testCases && currentSuite.testCases) {
        delete updateData.testCases;
      }
      
      // Atualizar no Firestore
      await updateDoc(suiteRef, updateData);
      
      // Obter a suíte atualizada
      const updatedSuite = await this.getTestSuite(suiteId);
      console.log(`Suíte de teste atualizada com sucesso:`, updatedSuite);
      
      return updatedSuite;
    } catch (error) {
      console.error('Erro ao atualizar suíte de teste:', error);
      throw error;
    }
  },

  async executeSuite(suiteId, executionData) {
    try {
      console.log(`Registrando execução para suíte ${suiteId}:`, executionData);
      
      // Obter a suíte atual
      const { data: suite, error: suiteError } = await this.getTestSuiteById(suiteId);
      if (suiteError) {
        throw new Error('Suite não encontrada: ' + suiteError);
      }
      
      if (!suite) {
        throw new Error('Suite não encontrada');
      }
      
      // Mapear os resultados para garantir compatibilidade com o status
      const mappedResults = (executionData.testResults || []).map(result => {
        // Corrigir o status do resultado para o formato esperado
        let status = 'skipped';
        if (result.status === 'Passou' || result.status === 'passed') status = 'passed';
        else if (result.status === 'Falhou' || result.status === 'failed') status = 'failed';
        else if (result.status === 'Bloqueado' || result.status === 'blocked') status = 'blocked';
        
        return {
          ...result,
          status
        };
      });
      
      // Calcular resumo da execução
      const summary = {
        total: mappedResults.length,
        passed: mappedResults.filter(t => t.status === 'passed').length,
        failed: mappedResults.filter(t => t.status === 'failed').length,
        blocked: mappedResults.filter(t => t.status === 'blocked').length,
        skipped: mappedResults.filter(t => t.status === 'skipped').length
      };
      
      // Criar um registro de execução
      const execution = {
        suiteId,
        executedAt: serverTimestamp(),
        executedBy: executionData.executedBy,
        environment: executionData.environment || 'Não especificado',
        notes: executionData.notes || '',
        testResults: mappedResults,
        status: executionData.status || 'completed',
        summary: summary,
        passed: summary.passed,
        total: mappedResults.length
      };
      
      // Adicionar à coleção de execuções
      const executionRef = await addDoc(collection(db, 'testExecutions'), execution);
      const executionId = executionRef.id;
      
      // Atualizar estatísticas na suíte
      const stats = suite.statistics || {
        totalExecutions: 0,
        lastExecution: null,
        passRate: 0,
        environments: {}
      };
      
      // Atualizar estatísticas
      stats.totalExecutions = (stats.totalExecutions || 0) + 1;
      stats.lastExecution = Timestamp.now();
      stats.lastExecutionDate = new Date();
      
      // Evitar divisão por zero
      if (execution.summary.total > 0) {
        stats.passRate = (stats.passRate * (stats.totalExecutions - 1) + 
          (execution.summary.passed / execution.summary.total * 100)) / stats.totalExecutions;
      }
      
      // Atualizar ambiente com verificação de segurança
      const env = execution.environment || 'Não especificado';
      if (!stats.environments) {
        stats.environments = {};
      }
      
      if (!stats.environments[env]) {
        stats.environments[env] = 0;
      }
      stats.environments[env]++;
      
      // Verificar se executions já existe na suite, se não, criar um array vazio
      const currentExecutions = Array.isArray(suite.executions) ? suite.executions : [];
      
      // Certificar que estamos usando o executionId, não o objeto de execução completo
      if (!currentExecutions.includes(executionId)) {
        // Atualizar suíte com nova execução e estatísticas
        await updateDoc(doc(db, 'testSuites', suiteId), {
          updatedAt: serverTimestamp(),
          statistics: stats,
          executions: arrayUnion(executionId)
        });
        
        console.log(`Suite atualizada com nova execução: ${executionId}`);
      }
      
      // Atualizar também os casos de teste com os resultados
      const testCases = [...(suite.testCases || [])];
      for (const result of mappedResults) {
        const testCaseIndex = testCases.findIndex(tc => tc.id === result.testId);
        if (testCaseIndex >= 0) {
          testCases[testCaseIndex] = {
            ...testCases[testCaseIndex],
            lastExecution: {
              status: result.status,
              executedAt: new Date(),
              notes: result.notes || ''
            },
            updatedAt: new Date()
          };
        }
      }
      
      // Atualizar os casos de teste
      await updateDoc(doc(db, 'testSuites', suiteId), {
        testCases: testCases,
        updatedAt: serverTimestamp()
      });
      
      // Obter execução com ID para retornar
      const result = {
        id: executionId,
        ...execution,
        executedAt: new Date().toISOString() // Temporariamente usar data atual para exibição imediata
      };
      
      console.log(`Execução registrada com sucesso:`, result);
      return { data: result, error: null };
    } catch (error) {
      console.error('Erro ao registrar execução da suíte de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async addTestCase(suiteId, testCase) {
    try {
      console.log(`Adicionando caso de teste à suíte ${suiteId}:`, testCase);
      const suiteRef = doc(db, 'testSuites', suiteId);
      
      // Validar dados do caso de teste
      if (!testCase.title) {
        throw new Error('O título do caso de teste é obrigatório');
      }
      
      // Preparar caso de teste com campos padrão
      const newTestCase = {
        id: Math.random().toString(36).substring(2, 15),
        title: testCase.title,
        description: testCase.description || '',
        steps: testCase.steps || [],
        expectedResult: testCase.expectedResult || '',
        priority: testCase.priority || 'medium',
        type: testCase.type || 'functional',
        isAutomated: testCase.isAutomated || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Atualizar suíte com novo caso de teste
      await updateDoc(suiteRef, {
        testCases: arrayUnion(newTestCase),
        updatedAt: serverTimestamp()
      });
      
      // Obter suíte atualizada
      const updatedSuite = await this.getTestSuite(suiteId);
      console.log(`Caso de teste adicionado com sucesso:`, updatedSuite);
      
      return updatedSuite;
    } catch (error) {
      console.error('Erro ao adicionar caso de teste:', error);
      throw error;
    }
  },

  async updateTestCase(suiteId, testCaseId, testCaseData) {
    try {
      console.log(`Atualizando caso de teste ${testCaseId} na suíte ${suiteId}:`, testCaseData);
      
      // Obter a suíte atual
      const suite = await this.getTestSuite(suiteId);
      
      // Encontrar e atualizar o caso de teste
      const testCaseIndex = suite.testCases.findIndex(tc => tc.id === testCaseId);
      
      if (testCaseIndex === -1) {
        throw new Error('Caso de teste não encontrado');
      }
      
      // Mesclar dados atualizados com caso de teste existente
      const updatedTestCase = {
        ...suite.testCases[testCaseIndex],
        ...testCaseData,
        updatedAt: Timestamp.now()
      };
      
      // Atualizar o array de casos de teste
      const updatedTestCases = [...suite.testCases];
      updatedTestCases[testCaseIndex] = updatedTestCase;
      
      // Atualizar a suíte
      await updateDoc(doc(db, 'testSuites', suiteId), {
        testCases: updatedTestCases,
        updatedAt: serverTimestamp()
      });
      
      // Obter suíte atualizada
      const updatedSuite = await this.getTestSuite(suiteId);
      console.log(`Caso de teste atualizado com sucesso:`, updatedSuite);
      
      return updatedSuite;
    } catch (error) {
      console.error('Erro ao atualizar caso de teste:', error);
      throw error;
    }
  },

  async removeTestCase(suiteId, testCaseId) {
    try {
      console.log(`Removendo caso de teste ${testCaseId} da suíte ${suiteId}`);
      
      // Obter a suíte atual
      const suiteRef = doc(db, 'testSuites', suiteId);
      const suiteSnap = await getDoc(suiteRef);
      
      if (!suiteSnap.exists()) {
        throw new Error('Suite de teste não encontrada');
      }
      
      const suiteData = suiteSnap.data();
      const testCases = suiteData.testCases || [];
      
      // Filtrar o caso de teste a ser removido
      const updatedTestCases = testCases.filter(tc => tc.id !== testCaseId);
      
      if (updatedTestCases.length === testCases.length) {
        throw new Error('Caso de teste não encontrado');
      }
      
      // Atualizar a suíte
      await updateDoc(suiteRef, {
        testCases: updatedTestCases,
        updatedAt: serverTimestamp()
      });
      
      // Obter suíte atualizada
      const { data } = await this.getTestSuiteById(suiteId);
      console.log(`Caso de teste removido com sucesso:`, data);
      
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao remover caso de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async archiveSuite(suiteId) {
    try {
      console.log(`Arquivando suíte de teste ${suiteId}`);
      
      await updateDoc(doc(db, 'testSuites', suiteId), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      
      console.log(`Suíte de teste arquivada com sucesso`);
    } catch (error) {
      console.error('Erro ao arquivar suíte de teste:', error);
      throw error;
    }
  },

  async restoreSuite(suiteId) {
    try {
      console.log(`Restaurando suíte de teste ${suiteId}`);
      
      await updateDoc(doc(db, 'testSuites', suiteId), {
        status: 'active',
        updatedAt: serverTimestamp()
      });
      
      console.log(`Suíte de teste restaurada com sucesso`);
    } catch (error) {
      console.error('Erro ao restaurar suíte de teste:', error);
      throw error;
    }
  },

  async deleteTestSuite(suiteId, projectId) {
    try {
      console.log(`Excluindo suíte de teste ${suiteId} do projeto ${projectId}`);
      
      // Excluir a suíte de teste
      await deleteDoc(doc(db, 'testSuites', suiteId));
      
      // Atualizar o projeto para remover a referência à suíte
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        const updatedTestSuites = (projectData.testSuites || []).filter(id => id !== suiteId);
        
        await updateDoc(projectRef, {
          testSuites: updatedTestSuites,
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Suíte de teste excluída com sucesso`);
      return { data: { id: suiteId, deleted: true }, error: null };
    } catch (error) {
      console.error('Erro ao excluir suíte de teste:', error);
      return { data: null, error: error.message };
    }
  },

  async deleteExecution(suiteId, executionId) {
    try {
      console.log(`Excluindo execução ${executionId} da suíte ${suiteId}`);
      
      // Verificar se a suíte existe
      const suiteRef = doc(db, 'testSuites', suiteId);
      const suiteDoc = await getDoc(suiteRef);
      
      if (!suiteDoc.exists()) {
        throw new Error('Suíte de teste não encontrada');
      }
      
      // Verificar se a execução existe
      const executionRef = doc(db, 'testExecutions', executionId);
      const executionDoc = await getDoc(executionRef);
      
      if (!executionDoc.exists()) {
        throw new Error('Execução não encontrada');
      }
      
      // Remover a execução da lista na suíte
      const suiteData = suiteDoc.data();
      
      // Verificar se executions é um array válido antes de filtrar
      const executions = Array.isArray(suiteData.executions) ? suiteData.executions : [];
      
      // Verificar se o ID existe na lista
      if (executions.indexOf(executionId) === -1) {
        console.log(`Aviso: Execução ${executionId} não encontrada na lista de execuções da suite ${suiteId}`);
      }
      
      const updatedExecutions = executions.filter(id => id !== executionId);
      
      // Atualizar estatísticas da suíte
      const statistics = suiteData.statistics || {};
      statistics.totalExecutions = Math.max(0, (statistics.totalExecutions || 0) - 1);
      
      // Se foi a última execução, limpar a data da última execução
      if (executions.length === 1 && executions[0] === executionId) {
        statistics.lastExecution = null;
      }
      
      // Atualizar a suíte
      await updateDoc(suiteRef, {
        executions: updatedExecutions,
        statistics: statistics,
        updatedAt: serverTimestamp()
      });
      
      // Excluir o documento da execução
      await deleteDoc(executionRef);
      
      console.log(`Execução ${executionId} excluída com sucesso`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir execução:', error);
      return { data: null, error: error.message };
    }
  },

  // Novo método compatível com a nova interface
  async createTestCase(suiteId, testCaseData) {
    try {
      console.log(`Criando caso de teste na suíte ${suiteId}:`, testCaseData);
      const suiteRef = doc(db, 'testSuites', suiteId);
      
      // Validar dados do caso de teste
      if (!testCaseData.name) {
        throw new Error('O nome do caso de teste é obrigatório');
      }
      
      // Preparar caso de teste com campos padrão
      const newTestCase = {
        id: Math.random().toString(36).substring(2, 15),
        title: testCaseData.name,
        description: testCaseData.description || '',
        steps: testCaseData.steps || [],
        expectedResults: testCaseData.expectedResults || '',
        prerequisites: testCaseData.prerequisites || [],
        priority: testCaseData.priority || 'medium',
        status: testCaseData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Obter a suíte atual
      const suiteSnap = await getDoc(suiteRef);
      
      if (!suiteSnap.exists()) {
        throw new Error('Suite não encontrada');
      }
      
      const suiteData = suiteSnap.data();
      const testCases = suiteData.testCases || [];
      
      // Adicionar o novo caso de teste
      const updatedTestCases = [...testCases, newTestCase];
      
      // Atualizar suíte com novo caso de teste
      await updateDoc(suiteRef, {
        testCases: updatedTestCases,
        updatedAt: serverTimestamp()
      });
      
      // Obter suíte atualizada
      const { data } = await this.getTestSuiteById(suiteId);
      console.log(`Caso de teste criado com sucesso na suíte:`, data);
      
      return { data };
    } catch (error) {
      console.error('Erro ao criar caso de teste:', error);
      return { error: error.message };
    }
  },
};

// Funções auxiliares
function calculateAutomationRate(testCases) {
  if (!testCases.length) return 0;
  const automatedTests = testCases.filter(tc => 
    tc.type === 'Automatizado' || (tc.steps && tc.steps.every(step => step.type === 'automated'))
  ).length;
  return (automatedTests / testCases.length) * 100;
}

function calculateUpdatedStatistics(currentStats, executionResult) {
  const totalExecutions = (currentStats.totalExecutions || 0) + 1;
  const passedExecutions = executionResult.status === 'Passou' 
    ? (currentStats.passedExecutions || 0) + 1 
    : (currentStats.passedExecutions || 0);

  return {
    ...currentStats,
    totalExecutions,
    passedExecutions,
    passRate: (passedExecutions / totalExecutions) * 100,
    lastExecution: new Date()
  };
} 