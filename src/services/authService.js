import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw handleAuthError(error);
  }
};

export const signUp = async ({ email, password, ...userData }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: userData.name
    });
    return userCredential.user;
  } catch (error) {
    throw handleAuthError(error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error);
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    if (userData.email) {
      await updateEmail(user, userData.email);
    }
    if (userData.password) {
      await updatePassword(user, userData.password);
    }
    if (userData.name) {
      await updateProfile(user, { displayName: userData.name });
    }
  } catch (error) {
    throw handleAuthError(error);
  }
}; 