import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

export const createTestPlan = async (testPlanData) => {
  try {
    const testPlansRef = collection(db, 'test_plans');
    const docRef = await addDoc(testPlansRef, {
      ...testPlanData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    // Criar casos de teste
    if (testPlanData.testCases && testPlanData.testCases.length > 0) {
      const testCasesRef = collection(db, 'test_cases');
      const testCasePromises = testPlanData.testCases.map(testCase => 
        addDoc(testCasesRef, {
          ...testCase,
          test_plan_id: docRef.id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
      );
      await Promise.all(testCasePromises);
    }

    return { data: { id: docRef.id }, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getTestPlans = async () => {
  try {
    const testPlansRef = collection(db, 'test_plans');
    const snapshot = await getDocs(testPlansRef);
    const testPlans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { data: testPlans, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getTestPlanById = async (testPlanId) => {
  try {
    // Buscar plano de teste
    const testPlanRef = doc(db, 'test_plans', testPlanId);
    const testPlanDoc = await getDoc(testPlanRef);
    
    if (!testPlanDoc.exists()) {
      throw new Error('Plano de teste não encontrado');
    }

    // Buscar casos de teste associados
    const testCasesRef = collection(db, 'test_cases');
    const q = query(testCasesRef, where('test_plan_id', '==', testPlanId));
    const testCasesSnapshot = await getDocs(q);
    const testCases = testCasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { 
      data: { 
        id: testPlanDoc.id, 
        ...testPlanDoc.data(),
        testCases 
      }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateTestPlan = async (testPlanId, testPlanData) => {
  try {
    const testPlanRef = doc(db, 'test_plans', testPlanId);
    
    const updates = {
      ...testPlanData,
      updated_at: serverTimestamp()
    };

    await updateDoc(testPlanRef, updates);

    // Atualizar casos de teste se fornecidos
    if (testPlanData.testCases) {
      const testCasesRef = collection(db, 'test_cases');
      const q = query(testCasesRef, where('test_plan_id', '==', testPlanId));
      const snapshot = await getDocs(q);
      
      // Deletar casos de teste existentes
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Criar novos casos de teste
      const createPromises = testPlanData.testCases.map(testCase =>
        addDoc(testCasesRef, {
          ...testCase,
          test_plan_id: testPlanId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
      );
      await Promise.all(createPromises);
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const deleteTestPlan = async (testPlanId) => {
  try {
    // Deletar casos de teste associados
    const testCasesRef = collection(db, 'test_cases');
    const q = query(testCasesRef, where('test_plan_id', '==', testPlanId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Deletar plano de teste
    const testPlanRef = doc(db, 'test_plans', testPlanId);
    await deleteDoc(testPlanRef);

    return { error: null };
  } catch (error) {
    return { error };
  }
}; 