import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

export const createTestExecution = async (testPlanId, executionData) => {
  try {
    const executionsRef = collection(db, 'test_executions');
    const docRef = await addDoc(executionsRef, {
      test_plan_id: testPlanId,
      status: 'in_progress',
      started_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...executionData
    });

    // Criar resultados dos casos de teste
    if (executionData.testResults && executionData.testResults.length > 0) {
      const testResultsRef = collection(db, 'test_results');
      const resultPromises = executionData.testResults.map(result => 
        addDoc(testResultsRef, {
          ...result,
          execution_id: docRef.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
      );
      await Promise.all(resultPromises);
    }

    return { data: { id: docRef.id }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getTestExecutionById = async (executionId) => {
  try {
    // Buscar execução
    const executionRef = doc(db, 'test_executions', executionId);
    const executionDoc = await getDoc(executionRef);
    
    if (!executionDoc.exists()) {
      throw new Error('Execução não encontrada');
    }

    // Buscar resultados dos casos de teste
    const testResultsRef = collection(db, 'test_results');
    const q = query(testResultsRef, where('execution_id', '==', executionId));
    const resultsSnapshot = await getDocs(q);
    const testResults = resultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { 
      data: { 
        id: executionDoc.id, 
        ...executionDoc.data(),
        testResults 
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateTestExecution = async (executionId, executionData) => {
  try {
    const executionRef = doc(db, 'test_executions', executionId);
    
    const updates = {
      ...executionData,
      updated_at: serverTimestamp()
    };

    if (executionData.status === 'completed') {
      updates.completed_at = serverTimestamp();
    }

    await updateDoc(executionRef, updates);

    // Atualizar resultados dos casos de teste
    if (executionData.testResults) {
      const testResultsRef = collection(db, 'test_results');
      const q = query(testResultsRef, where('execution_id', '==', executionId));
      const snapshot = await getDocs(q);
      
      // Atualizar resultados existentes
      const updatePromises = snapshot.docs.map((doc, index) => {
        const result = executionData.testResults[index];
        if (result) {
          return updateDoc(doc.ref, {
            ...result,
            updated_at: serverTimestamp()
          });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getTestExecutions = async (testPlanId = null) => {
  try {
    const executionsRef = collection(db, 'test_executions');
    let q = executionsRef;
    
    if (testPlanId) {
      q = query(executionsRef, where('test_plan_id', '==', testPlanId));
    }
    
    const snapshot = await getDocs(q);
    const executions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { data: executions, error: null };
  } catch (error) {
    return { data: null, error };
  }
}; 