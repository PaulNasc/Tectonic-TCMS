import { db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as authService from './authService';

export const createMasterUser = async () => {
  try {
    // Dados do usuário master
    const masterUserData = {
      email: 'admin@hybex.com',
      password: 'Admin@123',
      name: 'Administrador',
      role: 'admin'
    };

    // Criar usuário no Firebase Auth
    const { data: authUser, error: authError } = await authService.signUp(masterUserData);
    if (authError) throw authError;

    // Criar documento do usuário no Firestore
    const userRef = doc(db, 'users', authUser.uid);
    await setDoc(userRef, {
      name: masterUserData.name,
      email: masterUserData.email,
      role: masterUserData.role,
      is_active: true,
      is_master: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login: serverTimestamp()
    });

    return { 
      data: {
        message: 'Usuário master criado com sucesso',
        credentials: {
          email: masterUserData.email,
          password: masterUserData.password
        }
      }, 
      error: null 
    };
  } catch (error) {
    // Se o erro for de usuário já existente, vamos verificar se é o master
    if (error.code === 'auth/email-already-in-use') {
      try {
        const { data: user } = await authService.signIn(
          'admin@hybex.com',
          'Admin@123'
        );
        
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data().is_master) {
            return {
              data: {
                message: 'Usuário master já existe',
                credentials: {
                  email: 'admin@hybex.com',
                  password: 'Admin@123'
                }
              },
              error: null
            };
          }
        }
      } catch (signInError) {
        // Se não conseguir fazer login, retorna o erro original
        return { data: null, error };
      }
    }
    return { data: null, error };
  }
}; 