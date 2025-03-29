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
  deleteDoc
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
    const { data: requests, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return requests;
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error);
    throw error;
  }
};

// Aprovar solicitação de acesso
export const approveAccessRequest = async (requestId) => {
  try {
    const { data: request, error: requestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: request.email,
      password: request.password,
      email_confirm: true,
      user_metadata: {
        name: request.name,
        role: request.requested_role
      }
    });

    if (authError) throw authError;

    // Criar registro na tabela de usuários
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          name: request.name,
          email: request.email,
          role: request.requested_role,
          is_active: true
        }
      ]);

    if (userError) throw userError;

    // Atualizar status da solicitação
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status: 'approved', processed_at: new Date() })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    throw error;
  }
};

// Rejeitar solicitação de acesso
export const rejectAccessRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'rejected',
        processed_at: new Date()
      })
      .eq('id', requestId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    throw error;
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
    const { error } = await supabase
      .from('access_requests')
      .insert([
        {
          name: userData.name,
          email: userData.email,
          password: userData.password, // Será criptografado pelo Supabase
          requested_role: userData.role,
          status: 'pending'
        }
      ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao criar solicitação de acesso:', error);
    throw error;
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
    console.log('Buscando usuário por ID:', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('Usuário não encontrado:', userId);
      return { data: null, error: 'Usuário não encontrado' };
    }
    
    const userData = userSnap.data();
    console.log('Usuário encontrado:', userData);
    
    return { 
      data: {
        id: userSnap.id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        lastLogin: userData.lastLogin?.toDate?.() || userData.lastLogin
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { data: null, error: error.message };
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

export const getUserByEmail = async (email) => {
  try {
    console.log('Buscando usuário por email:', email);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Usuário não encontrado para o email:', email);
      return { data: null, error: 'Usuário não encontrado' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    console.log('Usuário encontrado:', userData);
    
    return { 
      data: {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        lastLogin: userData.lastLogin?.toDate?.() || userData.lastLogin
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    return { data: null, error: error.message };
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    console.log(`Atualizando perfil do usuário ${userId} para ${role}`);
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
    
    return { data: { id: userId, role }, error: null };
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return { data: null, error: error.message };
  }
};

export const listUsers = async () => {
  try {
    console.log('Listando todos os usuários');
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        lastLogin: data.lastLogin?.toDate?.() || data.lastLogin
      };
    });
    
    console.log(`${users.length} usuários encontrados`);
    return { data: users, error: null };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return { data: [], error: error.message };
  }
};

export const ensureAdminUser = async (email, password) => {
  try {
    console.log('Verificando se o usuário admin existe:', email);
    const { data: existingUser } = await getUserByEmail(email);
    
    if (existingUser) {
      console.log('Usuário admin já existe, atualizando para função admin');
      if (existingUser.role !== 'admin') {
        await updateUserRole(existingUser.id, 'admin');
      }
      return { data: existingUser, error: null };
    }
    
    // Neste ponto, o usuário precisa ser criado no Authentication 
    // e depois adicionado ao Firestore. Como não podemos criar no Firebase Auth
    // diretamente, esta função apenas retornará um erro neste caso.
    return { 
      data: null, 
      error: 'Usuário admin não encontrado. O usuário precisa ser cadastrado primeiro no sistema de autenticação.'
    };
  } catch (error) {
    console.error('Erro ao garantir usuário admin:', error);
    return { data: null, error: error.message };
  }
};

export const resetAllData = async (userId, securityCode) => {
  try {
    console.log('Validando usuário para reset de dados:', userId);
    const { data: user, error: userError } = await getUserById(userId);
    
    if (userError) throw new Error(userError);
    if (!user) throw new Error('Usuário não encontrado');
    if (user.role !== 'admin') throw new Error('Apenas administradores podem resetar dados');
    
    if (securityCode !== 'CONFIRMO_RESETAR_TODOS_OS_DADOS') {
      throw new Error('Código de segurança inválido');
    }
    
    console.log('Iniciando processo de reset completo dos dados...');
    
    // Excluir todas as suítes de teste
    const testSuitesRef = collection(db, 'testSuites');
    const testSuitesSnap = await getDocs(testSuitesRef);
    console.log(`Excluindo ${testSuitesSnap.size} suítes de teste...`);
    
    for (const suiteDoc of testSuitesSnap.docs) {
      await deleteDoc(doc(db, 'testSuites', suiteDoc.id));
    }
    
    // Excluir todas as execuções de teste
    const testExecutionsRef = collection(db, 'testExecutions');
    const testExecutionsSnap = await getDocs(testExecutionsRef);
    console.log(`Excluindo ${testExecutionsSnap.size} execuções de teste...`);
    
    for (const executionDoc of testExecutionsSnap.docs) {
      await deleteDoc(doc(db, 'testExecutions', executionDoc.id));
    }
    
    // Excluir todos os projetos
    const projectsRef = collection(db, 'projects');
    const projectsSnap = await getDocs(projectsRef);
    console.log(`Excluindo ${projectsSnap.size} projetos...`);
    
    for (const projectDoc of projectsSnap.docs) {
      await deleteDoc(doc(db, 'projects', projectDoc.id));
    }
    
    console.log('Reset de dados concluído com sucesso!');
    
    return { 
      data: { 
        success: true, 
        message: 'Todos os dados foram zerados com sucesso',
        timestamp: new Date().toISOString()
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao resetar dados:', error);
    return { data: null, error: error.message };
  }
}; 