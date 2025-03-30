import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import * as authService from './authService';

// Buscar todos os usuários
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { data: users, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Buscar solicitações de acesso pendentes
export const getPendingAccessRequests = async () => {
  try {
    console.log('Buscando solicitações de acesso pendentes');
    const requestsRef = collection(db, 'accessRequests');
    const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));
    
    console.log(`${requests.length} solicitações pendentes encontradas`);
    return { data: requests, error: null };
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error);
    return { data: [], error: error.message };
  }
};

// Aprovar solicitação de acesso
export const approveAccessRequest = async (requestId) => {
  try {
    console.log('Aprovando solicitação de acesso:', requestId);
    
    // Obter detalhes da solicitação
    const requestRef = doc(db, 'accessRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('Solicitação não encontrada');
    }
    
    const requestData = requestSnap.data();
    
    // Criar usuário no Auth
    const { data: authUser, error: authError } = await authService.signUp({
      email: requestData.email,
      password: requestData.password,
      name: requestData.name
    });
    
    if (authError) {
      throw new Error(`Erro ao criar conta: ${authError}`);
    }
    
    // Criar documento do usuário no Firestore
    const userRef = doc(db, 'users', authUser.uid);
    await setDoc(userRef, {
      name: requestData.name,
      email: requestData.email,
      role: requestData.requestedRole || 'user',
      is_active: true,
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null
    });
    
    // Atualizar status da solicitação
    await updateDoc(requestRef, {
      status: 'approved',
      processedAt: serverTimestamp(),
      processedBy: requestData.approvedBy || 'admin'
    });
    
    console.log('Solicitação aprovada com sucesso');
    return { 
      data: { 
        userId: authUser.uid,
        email: requestData.email,
        name: requestData.name 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return { data: null, error: error.message };
  }
};

// Rejeitar solicitação de acesso
export const rejectAccessRequest = async (requestId, reason) => {
  try {
    console.log('Rejeitando solicitação de acesso:', requestId);
    
    const requestRef = doc(db, 'accessRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectionReason: reason || 'Solicitação rejeitada pelo administrador',
      processedAt: serverTimestamp()
    });
    
    console.log('Solicitação rejeitada com sucesso');
    return { data: { id: requestId }, error: null };
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    return { data: null, error: error.message };
  }
};

// Atualizar usuário
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const updates = {
      ...userData,
      updated_at: serverTimestamp()
    };

    await updateDoc(userRef, updates);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Alternar status do usuário (ativar/desativar)
export const toggleUserStatus = async (userId) => {
  try {
    // Buscar status atual
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Atualizar status no Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { disabled: user.is_active } }
    );

    if (authError) throw authError;

    // Atualizar status na tabela de usuários
    const { error: userError } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', userId);

    if (userError) throw userError;

    return true;
  } catch (error) {
    console.error('Erro ao alternar status do usuário:', error);
    throw error;
  }
};

// Criar solicitação de acesso
export const createAccessRequest = async (userData) => {
  try {
    console.log('Criando solicitação de acesso para:', userData.email);
    
    // Verificar se já existe solicitação pendente com este email
    const existingRequestQuery = query(
      collection(db, 'accessRequests'), 
      where('email', '==', userData.email),
      where('status', '==', 'pending')
    );
    const existingSnapshots = await getDocs(existingRequestQuery);
    
    if (!existingSnapshots.empty) {
      throw new Error('Já existe uma solicitação pendente para este e-mail');
    }
    
    // Verificar se já existe usuário com este email
    const existingUserQuery = query(
      collection(db, 'users'), 
      where('email', '==', userData.email),
      limit(1)
    );
    const existingUserSnapshots = await getDocs(existingUserQuery);
    
    if (!existingUserSnapshots.empty) {
      throw new Error('Este e-mail já está registrado no sistema');
    }
    
    // Criar documento de solicitação
    const accessRequestRef = collection(db, 'accessRequests');
    const docRef = await addDoc(accessRequestRef, {
      name: userData.name,
      email: userData.email,
      password: userData.password, // Nota: idealmente, não armazenar senhas em texto plano
      requestedRole: userData.role || 'user',
      message: userData.message || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log('Solicitação de acesso criada com sucesso:', docRef.id);
    return { data: { id: docRef.id }, error: null };
  } catch (error) {
    console.error('Erro ao criar solicitação de acesso:', error);
    return { data: null, error: error.message };
  }
};

// Verificar se email já está em uso
export const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    // Criar usuário no Firebase Auth
    const { data: authUser, error: authError } = await authService.signUp(userData);
    if (authError) throw authError;

    // Criar documento do usuário no Firestore
    const userRef = doc(db, 'users', authUser.uid);
    await setDoc(userRef, {
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login: serverTimestamp()
    });

    return { data: authUser, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }

    return { 
      data: { id: userDoc.id, ...userDoc.data() }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error };
  }
};

export const deactivateUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      is_active: false,
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const activateUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      is_active: true,
      updated_at: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
}; 