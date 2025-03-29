import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

export const generateReport = async (testPlanId) => {
  try {
    // Buscar plano de teste
    const testPlanRef = doc(db, 'test_plans', testPlanId);
    const testPlanDoc = await getDoc(testPlanRef);
    
    if (!testPlanDoc.exists()) {
      throw new Error('Plano de teste não encontrado');
    }

    const testPlan = {
      id: testPlanDoc.id,
      ...testPlanDoc.data()
    };

    // Buscar casos de teste
    const testCasesRef = collection(db, 'test_cases');
    const testCasesQuery = query(testCasesRef, where('test_plan_id', '==', testPlanId));
    const testCasesSnapshot = await getDocs(testCasesQuery);
    const testCases = testCasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Buscar execuções
    const executionsRef = collection(db, 'test_executions');
    const executionsQuery = query(executionsRef, where('test_plan_id', '==', testPlanId));
    const executionsSnapshot = await getDocs(executionsQuery);
    const executions = executionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calcular métricas
    const metrics = calculateMetrics(testCases, executions);

    // Criar relatório
    const reportData = {
      test_plan: testPlan,
      test_cases: testCases,
      executions: executions,
      metrics: metrics,
      generated_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, reportData);

    return { 
      data: { 
        id: docRef.id,
        ...reportData
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const getReport = async (reportId) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Relatório não encontrado');
    }

    return { 
      data: { 
        id: reportDoc.id, 
        ...reportDoc.data() 
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const getReports = async (testPlanId = null) => {
  try {
    const reportsRef = collection(db, 'reports');
    let q = reportsRef;
    
    if (testPlanId) {
      q = query(reportsRef, where('test_plan.id', '==', testPlanId));
    }
    
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { data: reports, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

const calculateMetrics = (testCases, executions) => {
  const totalTestCases = testCases.length;
  const totalExecutions = executions.length;
  
  let passedTests = 0;
  let failedTests = 0;
  let blockedTests = 0;
  let inProgressTests = 0;

  executions.forEach(execution => {
    if (execution.testResults) {
      execution.testResults.forEach(result => {
        switch (result.status) {
          case 'passed':
            passedTests++;
            break;
          case 'failed':
            failedTests++;
            break;
          case 'blocked':
            blockedTests++;
            break;
          case 'in_progress':
            inProgressTests++;
            break;
        }
      });
    }
  });

  return {
    total_test_cases: totalTestCases,
    total_executions: totalExecutions,
    passed_tests: passedTests,
    failed_tests: failedTests,
    blocked_tests: blockedTests,
    in_progress_tests: inProgressTests,
    success_rate: totalTestCases > 0 ? (passedTests / totalTestCases) * 100 : 0
  };
}; 