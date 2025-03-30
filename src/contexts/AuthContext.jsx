import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as userService from '../services/userService';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Buscar dados adicionais do usuário no Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData;
          
          if (userDoc.exists()) {
            // Atualizar último login
            userData = userDoc.data();
            await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
          } else {
            // Criar documento de usuário se não existir
            userData = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role: 'user',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            };
            await setDoc(userDocRef, userData);
          }
          
          // Verificar se é o usuário admin@hybex e garantir que seja administrador
          const isAdminEmail = firebaseUser.email === 'admin@hybex';
          if (isAdminEmail) {
            console.log('Usuário admin@hybex detectado');
            if (userData.role !== 'admin') {
              console.log('Atualizando usuário para admin');
              await updateDoc(userDocRef, { role: 'admin' });
              userData.role = 'admin';
            }
          }
          
          const userObj = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            ...userData
          };
          
          // Força a função de admin para o email admin@hybex
          if (isAdminEmail) {
            userObj.role = 'admin';
          }
          
          console.log('Definindo dados do usuário:', userObj);
          setUser(userObj);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          
          // Mesmo com erro, definir usuário base
          const userObj = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: firebaseUser.email === 'admin@hybex' ? 'admin' : 'user'
          };
          
          console.log('Definindo dados básicos do usuário após erro:', userObj);
          setUser(userObj);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const register = async (email, password, userData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar registro do usuário no Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email,
        name: userData.name || email.split('@')[0],
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      
      return { user: userCredential.user, error: null };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { user: null, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('Iniciando processo de login para:', email);
      
      // Fazer login com Firebase Auth
      const userCredential = await authService.signIn(email, password);
      
      if (!userCredential) {
        console.error('Login falhou: credenciais inválidas');
        return { user: null, error: 'Credenciais inválidas' };
      }
      
      // Buscar dados adicionais do usuário
      const userRef = doc(db, 'users', userCredential.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('Usuário não encontrado no banco de dados');
        await authService.logout();
        return { user: null, error: 'Usuário não encontrado. Contate o administrador.' };
      }
      
      const userData = userDoc.data();
      
      // Verificar se o usuário está ativo
      if (userData.is_active === false) {
        console.error('Conta desativada');
        await authService.logout();
        return { user: null, error: 'Esta conta está desativada. Contate o administrador.' };
      }
      
      // Conta especial para admin@hybex
      if (email === 'admin@hybex') {
        userData.role = 'admin';
        console.log('Usuário admin@hybex reconhecido como administrador');
        
        // Atualizar o role no Firestore também para persistir
        await updateDoc(userRef, {
          role: 'admin'
        });
      }
      
      // Atualizar data do último login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      // Construir objeto completo do usuário
      const user = {
        id: userCredential.uid,
        email: userCredential.email,
        ...userData
      };
      
      console.log('Login bem-sucedido, usuário carregado:', user);
      
      // Verificação adicional - garantir que admin@hybex sempre tenha role admin
      if (email === 'admin@hybex') {
        user.role = 'admin';
        console.log('Garantindo que admin@hybex tenha role admin:', user);
      }
      
      // Definir usuário no estado e localStorage
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthenticated(true);
      
      return { user, error: null };
    } catch (error) {
      console.error('Erro durante o login:', error);
      return { user: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return { error: error.message };
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      // Verificar se o usuário atual é admin
      if (!user || user.role !== 'admin') {
        throw new Error('Apenas administradores podem alterar funções de usuários');
      }
      
      const result = await userService.updateUserRole(userId, role);
      return result;
    } catch (error) {
      console.error('Erro ao atualizar função do usuário:', error);
      return { data: null, error: error.message };
    }
  };

  const resetAllData = async (password, confirmationText) => {
    try {
      // Verificar se o usuário atual é admin
      if (!user || user.role !== 'admin') {
        throw new Error('Apenas administradores podem resetar dados');
      }
      
      // Vamos usar o securityCode como código de segurança
      const securityCode = 'CONFIRMO_RESETAR_TODOS_OS_DADOS';
      
      // Confirmar que o texto de confirmação está correto
      if (confirmationText !== 'Eu confirmo que desejo zerar todos os dados do sistema') {
        throw new Error('Texto de confirmação inválido');
      }
      
      const result = await userService.resetAllData(user.id, securityCode);
      return result;
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      return { data: null, error: error.message };
    }
  };

  // Função para reutilizar objeto do usuário do localStorage ao recarregar a página
  useEffect(() => {
    // Verificar se há um usuário no localStorage ao carregar a página
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Verificação adicional - garantir que admin@hybex sempre tenha role admin
        if (parsedUser.email === 'admin@hybex') {
          parsedUser.role = 'admin';
          console.log('Garantindo que admin@hybex tenha role admin após carregar do localStorage:', parsedUser);
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
        
        console.log('Carregando usuário do localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value = {
    currentUser,
    user,
    loading,
    authenticated,
    register,
    login,
    logout,
    resetPassword,
    updateUserRole,
    resetAllData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 