import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  getAuth
} from 'firebase/auth';
import { auth } from '../config/firebase';

const handleAuthError = (error) => {
  console.error('Firebase Auth Error:', error);
  
  switch (error.code) {
    case 'auth/invalid-credential':
      throw new Error('Email ou senha inválidos.');
    case 'auth/user-not-found':
      throw new Error('Usuário não encontrado.');
    case 'auth/wrong-password':
      throw new Error('Senha incorreta.');
    case 'auth/email-already-in-use':
      throw new Error('Este email já está em uso.');
    case 'auth/weak-password':
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    case 'auth/invalid-email':
      throw new Error('Email inválido.');
    case 'auth/too-many-requests':
      throw new Error('Muitas tentativas de login. Tente novamente mais tarde.');
    default:
      throw new Error('Ocorreu um erro na autenticação. Tente novamente.');
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('Tentando fazer login com:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login bem-sucedido:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw handleAuthError(error);
  }
};

export const signUp = async ({ email, password, ...userData }) => {
  try {
    console.log('Tentando criar usuário:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: userData.name
    });
    console.log('Usuário criado com sucesso:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw handleAuthError(error);
  }
};

export const logout = async () => {
  try {
    console.log('Realizando logout');
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw handleAuthError(error);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const resetPassword = async (email) => {
  try {
    console.log('Enviando email de recuperação para:', email);
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    console.log('Email de recuperação enviado com sucesso');
    return { error: null };
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    return { error: error.message || 'Erro ao enviar email de recuperação de senha' };
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    console.log('Atualizando perfil do usuário:', user.uid);
    
    if (userData.email) {
      await updateEmail(user, userData.email);
    }
    if (userData.password) {
      await updatePassword(user, userData.password);
    }
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name });
    }
    
    console.log('Perfil atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw handleAuthError(error);
  }
}; 