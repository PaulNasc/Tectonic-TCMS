import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';

const REQUIREMENTS_COLLECTION = 'requirements';
const TEST_SUITES_COLLECTION = 'testSuites';

export const traceabilityService = {
  // Criar um novo requisito
  async createRequirement(requirementData) {
    try {
      // Validar projeto
      if (!requirementData.projectId) {
        throw new Error('ID do projeto é obrigatório');
      }
      
      const projectRef = doc(db, 'projects', requirementData.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projeto não encontrado');
      }
      
      // Gerar código sequencial para o requisito
      const reqCount = await this.getRequirementCount(requirementData.projectId);
      const sequentialCode = `REQ-${String(reqCount + 1).padStart(3, '0')}`;
      
      // Criar o requisito
      const requirement = {
        code: sequentialCode,
        name: requirementData.name,
        description: requirementData.description || '',
        status: requirementData.status || 'Pendente',
        priority: requirementData.priority || 'Média',
        tags: requirementData.tags || [],
        projectId: requirementData.projectId,
        testCaseIds: [],
        createdBy: requirementData.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        coverage: 0,
        history: [
          {
            action: 'create',
            timestamp: new Date(),
            user: requirementData.createdBy,
            details: 'Requisito criado'
          }
        ]
      };
      
      const docRef = await addDoc(collection(db, REQUIREMENTS_COLLECTION), requirement);
      
      return { 
        data: { 
          id: docRef.id, 
          ...requirement,
          createdAt: new Date(),
          updatedAt: new Date()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao criar requisito:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Obter contagem de requisitos para geração de código sequencial
  async getRequirementCount(projectId) {
    try {
      const q = query(
        collection(db, REQUIREMENTS_COLLECTION),
        where('projectId', '==', projectId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao obter contagem de requisitos:', error);
      return 0;
    }
  },
  
  // Obter requisitos de um projeto
  async getRequirementsByProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('ID do projeto é obrigatório');
      }
      
      const requirementsRef = collection(db, REQUIREMENTS_COLLECTION);
      const q = query(
        requirementsRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requirements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));
      
      return { data: requirements, error: null };
    } catch (error) {
      console.error('Erro ao obter requisitos do projeto:', error);
      return { data: [], error: error.message };
    }
  },
  
  // Obter um requisito específico
  async getRequirementById(id) {
    try {
      const requirementRef = doc(db, REQUIREMENTS_COLLECTION, id);
      const requirementDoc = await getDoc(requirementRef);
      
      if (!requirementDoc.exists()) {
        throw new Error('Requisito não encontrado');
      }
      
      const requirement = {
        id,
        ...requirementDoc.data(),
        createdAt: requirementDoc.data().createdAt?.toDate?.() || null,
        updatedAt: requirementDoc.data().updatedAt?.toDate?.() || null
      };
      
      return { data: requirement, error: null };
    } catch (error) {
      console.error('Erro ao obter requisito:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Atualizar um requisito
  async updateRequirement(id, requirementData, user) {
    try {
      const requirementRef = doc(db, REQUIREMENTS_COLLECTION, id);
      const requirementDoc = await getDoc(requirementRef);
      
      if (!requirementDoc.exists()) {
        throw new Error('Requisito não encontrado');
      }
      
      const currentRequirement = requirementDoc.data();
      
      // Não permitir alterar projectId ou code
      delete requirementData.projectId;
      delete requirementData.code;
      delete requirementData.createdAt;
      delete requirementData.createdBy;
      
      const updateData = {
        ...requirementData,
        updatedAt: serverTimestamp(),
        history: [
          ...currentRequirement.history || [],
          {
            action: 'update',
            timestamp: new Date(),
            user: user,
            details: 'Requisito atualizado'
          }
        ]
      };
      
      await updateDoc(requirementRef, updateData);
      
      return { 
        data: { 
          id, 
          ...currentRequirement, 
          ...updateData,
          updatedAt: new Date()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Vincular caso de teste a requisito
  async linkTestCaseToRequirement(requirementId, testCaseId, testCaseData, user) {
    try {
      const requirementRef = doc(db, REQUIREMENTS_COLLECTION, requirementId);
      const requirementDoc = await getDoc(requirementRef);
      
      if (!requirementDoc.exists()) {
        throw new Error('Requisito não encontrado');
      }
      
      const requirement = requirementDoc.data();
      
      // Verificar se o caso de teste já está vinculado
      if (requirement.testCaseIds && requirement.testCaseIds.includes(testCaseId)) {
        return { 
          data: { id: requirementId, ...requirement }, 
          error: 'Caso de teste já vinculado a este requisito' 
        };
      }
      
      // Adicionar vínculo
      await updateDoc(requirementRef, {
        testCaseIds: arrayUnion(testCaseId),
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          action: 'link',
          timestamp: new Date(),
          user: user,
          details: `Caso de teste "${testCaseData.name}" vinculado`,
          testCaseId
        })
      });
      
      // Atualizar o caso de teste para incluir o requisito
      if (testCaseData.suiteId) {
        const suiteRef = doc(db, TEST_SUITES_COLLECTION, testCaseData.suiteId);
        const suiteDoc = await getDoc(suiteRef);
        
        if (suiteDoc.exists()) {
          const suite = suiteDoc.data();
          const testCaseIndex = suite.testCases.findIndex(tc => tc.id === testCaseId);
          
          if (testCaseIndex >= 0) {
            const testCase = suite.testCases[testCaseIndex];
            
            // Adicionar requirementId ao caso de teste se não existir
            const requirementIds = testCase.requirementIds || [];
            if (!requirementIds.includes(requirementId)) {
              suite.testCases[testCaseIndex] = {
                ...testCase,
                requirementIds: [...requirementIds, requirementId]
              };
              
              await updateDoc(suiteRef, {
                testCases: suite.testCases,
                updatedAt: serverTimestamp()
              });
            }
          }
        }
      }
      
      return { data: { id: requirementId, ...requirement }, error: null };
    } catch (error) {
      console.error('Erro ao vincular caso de teste a requisito:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Desvincular caso de teste de requisito
  async unlinkTestCaseFromRequirement(requirementId, testCaseId, testCaseData, user) {
    try {
      const requirementRef = doc(db, REQUIREMENTS_COLLECTION, requirementId);
      const requirementDoc = await getDoc(requirementRef);
      
      if (!requirementDoc.exists()) {
        throw new Error('Requisito não encontrado');
      }
      
      const requirement = requirementDoc.data();
      
      // Verificar se o caso de teste está vinculado
      if (!requirement.testCaseIds || !requirement.testCaseIds.includes(testCaseId)) {
        return { 
          data: { id: requirementId, ...requirement }, 
          error: 'Caso de teste não está vinculado a este requisito' 
        };
      }
      
      // Remover vínculo
      await updateDoc(requirementRef, {
        testCaseIds: arrayRemove(testCaseId),
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          action: 'unlink',
          timestamp: new Date(),
          user: user,
          details: `Caso de teste "${testCaseData.name}" desvinculado`,
          testCaseId
        })
      });
      
      // Atualizar o caso de teste para remover o requisito
      if (testCaseData.suiteId) {
        const suiteRef = doc(db, TEST_SUITES_COLLECTION, testCaseData.suiteId);
        const suiteDoc = await getDoc(suiteRef);
        
        if (suiteDoc.exists()) {
          const suite = suiteDoc.data();
          const testCaseIndex = suite.testCases.findIndex(tc => tc.id === testCaseId);
          
          if (testCaseIndex >= 0) {
            const testCase = suite.testCases[testCaseIndex];
            
            // Remover requirementId do caso de teste
            const requirementIds = testCase.requirementIds || [];
            if (requirementIds.includes(requirementId)) {
              suite.testCases[testCaseIndex] = {
                ...testCase,
                requirementIds: requirementIds.filter(id => id !== requirementId)
              };
              
              await updateDoc(suiteRef, {
                testCases: suite.testCases,
                updatedAt: serverTimestamp()
              });
            }
          }
        }
      }
      
      return { data: { id: requirementId, ...requirement }, error: null };
    } catch (error) {
      console.error('Erro ao desvincular caso de teste de requisito:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Construir matriz de rastreabilidade
  async buildTraceabilityMatrix(projectId) {
    try {
      // Buscar todos os requisitos do projeto
      const { data: requirements, error: reqError } = await this.getRequirementsByProject(projectId);
      
      if (reqError) {
        throw new Error(reqError);
      }
      
      // Buscar todas as suítes do projeto
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projeto não encontrado');
      }
      
      const project = projectDoc.data();
      const testSuiteIds = project.testSuites || [];
      
      // Mapeamento de casos de teste por ID
      const testCasesMap = {};
      
      // Buscar casos de teste de cada suíte
      for (const suiteId of testSuiteIds) {
        const suiteRef = doc(db, TEST_SUITES_COLLECTION, suiteId);
        const suiteDoc = await getDoc(suiteRef);
        
        if (suiteDoc.exists()) {
          const suite = suiteDoc.data();
          
          // Mapear casos de teste com informações da suíte
          (suite.testCases || []).forEach(testCase => {
            testCasesMap[testCase.id] = {
              ...testCase,
              suiteName: suite.name,
              suiteId: suiteId
            };
          });
        }
      }
      
      // Construir a matriz
      const matrix = requirements.map(req => {
        // Encontrar casos de teste vinculados a este requisito
        const linkedTestCases = (req.testCaseIds || [])
          .filter(id => testCasesMap[id])
          .map(id => testCasesMap[id]);
        
        // Calcular cobertura
        const totalTestCases = Object.keys(testCasesMap).length;
        const coverage = totalTestCases > 0 
          ? (linkedTestCases.length / totalTestCases) * 100 
          : 0;
        
        // Calcular status agregado
        const executionStatuses = linkedTestCases
          .map(tc => tc.lastExecutionStatus)
          .filter(status => status);
        
        const passCount = executionStatuses.filter(s => s === 'Passou').length;
        const passRate = executionStatuses.length > 0 
          ? (passCount / executionStatuses.length) * 100 
          : 0;
        
        return {
          requirement: req,
          linkedTestCases,
          coverage,
          passRate,
          executionSummary: {
            total: linkedTestCases.length,
            passed: passCount,
            failed: executionStatuses.filter(s => s === 'Falhou').length,
            blocked: executionStatuses.filter(s => s === 'Bloqueado').length,
            notExecuted: linkedTestCases.length - executionStatuses.length
          }
        };
      });
      
      return { data: matrix, error: null };
    } catch (error) {
      console.error('Erro ao construir matriz de rastreabilidade:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Obter cobertura de requisitos para um projeto
  async getRequirementsCoverage(projectId) {
    try {
      const { data: matrix, error } = await this.buildTraceabilityMatrix(projectId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Calcular métricas
      const totalRequirements = matrix.length;
      const coveredRequirements = matrix.filter(item => item.linkedTestCases.length > 0).length;
      const coveragePercent = totalRequirements > 0 
        ? (coveredRequirements / totalRequirements) * 100 
        : 0;
      
      const passedRequirements = matrix.filter(item => item.passRate >= 100).length;
      const passRate = totalRequirements > 0
        ? (passedRequirements / totalRequirements) * 100
        : 0;
      
      // Calcular cobertura por prioridade
      const priorityGroups = matrix.reduce((acc, item) => {
        const priority = item.requirement.priority || 'Indefinida';
        if (!acc[priority]) {
          acc[priority] = {
            total: 0,
            covered: 0,
            passed: 0
          };
        }
        
        acc[priority].total++;
        
        if (item.linkedTestCases.length > 0) {
          acc[priority].covered++;
        }
        
        if (item.passRate >= 100) {
          acc[priority].passed++;
        }
        
        return acc;
      }, {});
      
      // Calcular porcentagens para cada prioridade
      Object.keys(priorityGroups).forEach(priority => {
        const group = priorityGroups[priority];
        group.coveragePercent = group.total > 0 
          ? (group.covered / group.total) * 100 
          : 0;
        
        group.passPercent = group.total > 0
          ? (group.passed / group.total) * 100
          : 0;
      });
      
      return {
        data: {
          totalRequirements,
          coveredRequirements,
          coveragePercent,
          passedRequirements,
          passRate,
          priorityCoverage: priorityGroups
        },
        error: null
      };
    } catch (error) {
      console.error('Erro ao obter cobertura de requisitos:', error);
      return { data: null, error: error.message };
    }
  }
}; 