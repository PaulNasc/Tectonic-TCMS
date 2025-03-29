import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  Timestamp,
  limit,
  limitToLast,
  limit as firestoreLimit,
  increment
} from 'firebase/firestore';

const TESTS_COLLECTION = 'tests';
const EXECUTIONS_COLLECTION = 'executions';
const COUNTERS_COLLECTION = 'counters';

const getNextTestId = async () => {
  try {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'tests');
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await updateDoc(counterRef, { value: 1 });
      return 'TE/0001';
    }
    
    await updateDoc(counterRef, { value: increment(1) });
    const nextValue = counterDoc.data().value + 1;
    return `TE/${String(nextValue).padStart(4, '0')}`;
  } catch (error) {
    console.error('Erro ao gerar próximo ID:', error);
    throw error;
  }
};

export const createTestCase = async (testData) => {
  try {
    const sequentialId = await getNextTestId();
    const currentUser = auth.currentUser;

    const testCase = {
      sequentialId,
      name: testData.name,
      description: testData.description,
      type: testData.type || 'Manual',
      priority: testData.priority || 'Média',
      status: 'Pendente',
      steps: testData.steps || [],
      expectedResults: testData.expectedResults || [],
      prerequisites: testData.prerequisites || [],
      createdBy: {
        id: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email
      },
      responsibleId: testData.responsibleId || currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastRun: null,
      lastExecutionStatus: null,
      lastExecutedBy: null
    };

    const docRef = await addDoc(collection(db, TESTS_COLLECTION), testCase);

    return {
      data: {
        id: docRef.id,
        ...testCase,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao criar caso de teste:', error);
    return { data: null, error: error.message };
  }
};

export const updateTestCase = async (id, testData) => {
  try {
    const testRef = doc(db, TESTS_COLLECTION, id);
    const currentUser = auth.currentUser;

    const updateData = {
      ...testData,
      updatedAt: serverTimestamp(),
      updatedBy: {
        id: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email
      }
    };

    await updateDoc(testRef, updateData);
    return { error: null };
  } catch (error) {
    console.error('Erro ao atualizar caso de teste:', error);
    return { error: error.message };
  }
};

export const deleteTestCase = async (id) => {
  try {
    const testRef = doc(db, TESTS_COLLECTION, id);
    await deleteDoc(testRef);

    return { error: null };
  } catch (error) {
    console.error('Erro ao excluir caso de teste:', error);
    return { error: error.message };
  }
};

export const getTestCases = async (filters = {}) => {
  try {
    let q = collection(db, TESTS_COLLECTION);

    // Aplicar filtros se houver
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }

    // Ordenar por data de criação
    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const tests = [];

    querySnapshot.forEach((doc) => {
      tests.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
        lastRun: doc.data().lastRun?.toDate?.()?.toISOString() || null
      });
    });

    return { data: tests, error: null };
  } catch (error) {
    console.error('Erro ao buscar casos de teste:', error);
    return { data: null, error: error.message };
  }
};

export const getTestCaseById = async (id) => {
  try {
    const testRef = doc(db, TESTS_COLLECTION, id);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error('Caso de teste não encontrado');
    }

    const test = {
      id: testDoc.id,
      ...testDoc.data(),
      createdAt: testDoc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: testDoc.data().updatedAt?.toDate?.()?.toISOString() || null,
      lastRun: testDoc.data().lastRun?.toDate?.()?.toISOString() || null
    };

    return { data: test, error: null };
  } catch (error) {
    console.error('Erro ao buscar caso de teste:', error);
    return { data: null, error: error.message };
  }
};

// Funções para Execuções de Teste
export const createTestExecution = async (executionData) => {
  try {
    // Adiciona a execução
    const execution = {
      ...executionData,
      executedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const executionRef = await addDoc(collection(db, EXECUTIONS_COLLECTION), execution);

    // Atualiza o caso de teste
    const testRef = doc(db, TESTS_COLLECTION, executionData.testId);
    await updateDoc(testRef, {
      lastRun: serverTimestamp(),
      lastExecutionStatus: executionData.status,
      lastExecutedBy: executionData.executedBy,
      status: executionData.status,
      updatedAt: serverTimestamp()
    });

    // Atualiza as estatísticas do projeto, se houver projectId
    if (executionData.projectId) {
      try {
        const projectRef = doc(db, 'projects', executionData.projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const statistics = projectData.statistics || {
            totalTestCases: 0,
            passRate: 0,
            lastExecution: null,
            executionCount: 0,
            passCount: 0
          };
          
          statistics.lastExecution = serverTimestamp();
          statistics.executionCount = (statistics.executionCount || 0) + 1;
          
          if (executionData.status === 'Passou') {
            statistics.passCount = (statistics.passCount || 0) + 1;
          }
          
          // Recalcula a taxa de aprovação
          if (statistics.executionCount > 0) {
            statistics.passRate = (statistics.passCount / statistics.executionCount) * 100;
          }
          
          await updateDoc(projectRef, {
            statistics,
            updatedAt: serverTimestamp()
          });
          
          console.log('Estatísticas do projeto atualizadas:', statistics);
        }
      } catch (err) {
        console.error('Erro ao atualizar estatísticas do projeto:', err);
        // Não falha a operação principal se a atualização de estatísticas falhar
      }
    }

    return {
      data: {
        id: executionRef.id,
        ...execution,
        executedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao criar execução de teste:', error);
    return { data: null, error: error.message };
  }
};

export const getTestExecutions = async (testId) => {
  try {
    const q = query(
      collection(db, EXECUTIONS_COLLECTION),
      where('testId', '==', testId),
      orderBy('executedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const executions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      executedAt: doc.data().executedAt?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    return { data: executions, error: null };
  } catch (error) {
    console.error('Erro ao buscar execuções:', error);
    return { data: null, error: error.message };
  }
};

export const getTestExecutionById = async (id) => {
  try {
    const docRef = doc(db, EXECUTIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Execução não encontrada');
    }

    const execution = {
      id: docSnap.id,
      ...docSnap.data(),
      executedAt: docSnap.data().executedAt?.toDate().toISOString(),
      createdAt: docSnap.data().createdAt?.toDate().toISOString()
    };

    return { data: execution, error: null };
  } catch (error) {
    console.error('Erro ao buscar execução:', error);
    return { data: null, error: error.message };
  }
};

// Funções para Relatórios
export const getTestStats = async (days = 30) => {
  try {
    // Calcula a data inicial do período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTimestamp = Timestamp.fromDate(startDate);

    // Busca todos os testes
    const testsSnapshot = await getDocs(collection(db, TESTS_COLLECTION));
    const totalTests = testsSnapshot.size;

    // Busca as execuções do período
    const executionsQuery = query(
      collection(db, EXECUTIONS_COLLECTION),
      where('createdAt', '>=', startTimestamp),
      orderBy('createdAt', 'asc')
    );
    const executionsSnapshot = await getDocs(executionsQuery);
    const executions = executionsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate()
    }));

    // Calcula estatísticas
    const executedTests = executions.length;
    const passedTests = executions.filter(exec => exec.status === 'passed').length;
    const failedTests = executions.filter(exec => exec.status === 'failed').length;
    const blockedTests = executions.filter(exec => exec.status === 'blocked').length;
    const successRate = executedTests > 0 ? (passedTests / executedTests) * 100 : 0;

    // Gera histórico de execuções por dia
    const executionHistory = [];
    const dateMap = new Map();

    executions.forEach(execution => {
      const date = execution.createdAt.toLocaleDateString('pt-BR');
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, passed: 0, failed: 0, blocked: 0 });
      }
      const dayStats = dateMap.get(date);
      dayStats[execution.status]++;
    });

    dateMap.forEach(value => {
      executionHistory.push(value);
    });

    return {
      data: {
        totalTests,
        executedTests,
        successRate,
        statusDistribution: {
          passed: passedTests,
          failed: failedTests,
          blocked: blockedTests
        },
        executionHistory
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    return { data: null, error: error.message };
  }
};

export const getRecentExecutions = async (limit = 5) => {
  try {
    const executionsRef = collection(db, EXECUTIONS_COLLECTION);
    const q = query(
      executionsRef,
      orderBy('executedAt', 'desc'),
      firestoreLimit(limit)
    );
    
    const snapshot = await getDocs(q);
    const executions = [];
    
    for (const doc of snapshot.docs) {
      const execution = doc.data();
      const testDoc = await getDoc(doc.ref.parent.parent.collection(TESTS_COLLECTION).doc(execution.testId));
      const testData = testDoc.exists() ? testDoc.data() : null;
      
      executions.push({
        id: doc.id,
        ...execution,
        testName: testData?.name || 'Teste Removido',
        status: execution.status || 'Não Iniciado',
        executedBy: execution.executedBy || 'Sistema',
        executedAt: execution.executedAt?.toDate() || new Date()
      });
    }
    
    return executions;
  } catch (error) {
    console.error('Erro ao buscar execuções recentes:', error);
    throw error;
  }
};

export const getTestStatistics = async () => {
  try {
    const testsSnapshot = await getDocs(collection(db, TESTS_COLLECTION));
    const executionsSnapshot = await getDocs(collection(db, EXECUTIONS_COLLECTION));

    const totalTests = testsSnapshot.size;
    const totalExecutions = executionsSnapshot.size;

    const statusCounts = {
      Passou: 0,
      Falhou: 0,
      Bloqueado: 0,
      'Não Executado': 0,
      Pendente: 0
    };

    const priorityCounts = {
      Alta: 0,
      Média: 0,
      Baixa: 0
    };

    testsSnapshot.forEach(doc => {
      const test = doc.data();
      statusCounts[test.status] = (statusCounts[test.status] || 0) + 1;
      priorityCounts[test.priority] = (priorityCounts[test.priority] || 0) + 1;
    });

    const recentExecutions = executionsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        executedAt: doc.data().executedAt?.toDate().toISOString(),
        createdAt: doc.data().createdAt?.toDate().toISOString()
      }))
      .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
      .slice(0, 5);

    return {
      data: {
        totalTests,
        totalExecutions,
        statusCounts,
        priorityCounts,
        recentExecutions
      },
      error: null
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { data: null, error: error.message };
  }
}; 