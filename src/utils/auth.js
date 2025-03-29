// Simulação de banco de dados de usuários para desenvolvimento
const usersDatabase = [
  {
    id: 1,
    email: 'paulo.santos@hybex',
    password: '050200@Pa', // Em produção, NUNCA armazene senhas em texto puro
    name: 'Paulo Santos',
    role: 'admin',
    isActive: true,
    createdAt: '2025-01-15T10:00:00.000Z',
    lastLogin: '2025-03-22T14:30:00.000Z'
  },
  {
    id: 2,
    email: 'maria.silva@hybex',
    password: 'Maria@123',
    name: 'Maria Silva',
    role: 'qa_analyst',
    isActive: true,
    createdAt: '2025-01-20T11:30:00.000Z',
    lastLogin: '2025-03-21T09:15:00.000Z'
  },
  {
    id: 3,
    email: 'pedro.costa@hybex',
    password: 'Pedro@123',
    name: 'Pedro Costa',
    role: 'developer',
    isActive: true,
    createdAt: '2025-02-05T14:45:00.000Z',
    lastLogin: '2025-03-20T16:20:00.000Z'
  },
  {
    id: 4,
    email: 'ana.oliveira@hybex',
    password: 'Ana@123',
    name: 'Ana Oliveira',
    role: 'viewer',
    isActive: false,
    createdAt: '2025-02-12T09:20:00.000Z',
    lastLogin: null
  }
];

// Simulação de solicitações de acesso pendentes
const pendingAccessRequests = [
  {
    id: 1,
    email: 'carlos.mendes@hybex',
    name: 'Carlos Mendes',
    requestedRole: 'qa_analyst',
    message: 'Preciso de acesso para gerenciar os testes do projeto X',
    requestedAt: '2025-03-22T11:10:00.000Z'
  },
  {
    id: 2,
    email: 'julia.santos@hybex',
    name: 'Julia Santos',
    requestedRole: 'developer',
    message: 'Sou desenvolvedora do time Z e preciso acompanhar os testes',
    requestedAt: '2025-03-23T14:25:00.000Z'
  }
];

// Definições de permissões por papel
const rolePermissions = {
  admin: {
    canCreateTests: true,
    canEditTests: true,
    canDeleteTests: true,
    canRunTests: true,
    canManageUsers: true,
    canApproveRequests: true,
    canViewReports: true,
    canExportReports: true,
    canManageSettings: true,
    canCreateQAProcesses: true
  },
  qa_analyst: {
    canCreateTests: true,
    canEditTests: true,
    canDeleteTests: false,
    canRunTests: true,
    canManageUsers: false,
    canApproveRequests: false,
    canViewReports: true,
    canExportReports: true,
    canManageSettings: false,
    canCreateQAProcesses: true
  },
  developer: {
    canCreateTests: false,
    canEditTests: false,
    canDeleteTests: false,
    canRunTests: true,
    canManageUsers: false,
    canApproveRequests: false,
    canViewReports: true,
    canExportReports: false,
    canManageSettings: false,
    canCreateQAProcesses: false
  },
  viewer: {
    canCreateTests: false,
    canEditTests: false,
    canDeleteTests: false,
    canRunTests: false,
    canManageUsers: false,
    canApproveRequests: false,
    canViewReports: true,
    canExportReports: false,
    canManageSettings: false,
    canCreateQAProcesses: false
  }
};

// Simulação de autenticação
const authenticateUser = (email, password) => {
  return new Promise((resolve, reject) => {
    // Simulando uma chamada de API com delay
    setTimeout(() => {
      const user = usersDatabase.find(u => u.email === email && u.password === password);
      
      if (user) {
        if (!user.isActive) {
          reject({ message: 'Sua conta está desativada. Entre em contato com o administrador.' });
          return;
        }
        
        // Clone do usuário sem a senha
        const { password, ...userWithoutPassword } = user;
        
        // Atualizar último login
        user.lastLogin = new Date().toISOString();
        
        resolve({
          user: userWithoutPassword,
          permissions: rolePermissions[user.role],
          token: `mock-jwt-token-${user.id}-${Date.now()}`
        });
      } else {
        reject({ message: 'Email ou senha inválidos.' });
      }
    }, 800); // Delay para simular uma chamada real
  });
};

// Simulação de obtenção de usuário atual
const getCurrentUser = (token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Validar token - em produção, verificaria JWT
      if (!token || !token.startsWith('mock-jwt-token-')) {
        reject({ message: 'Token inválido ou expirado.' });
        return;
      }
      
      // Extrair ID de usuário do token
      const tokenParts = token.split('-');
      const userId = parseInt(tokenParts[3]);
      
      const user = usersDatabase.find(u => u.id === userId);
      
      if (user) {
        // Clone do usuário sem a senha
        const { password, ...userWithoutPassword } = user;
        
        resolve({
          user: userWithoutPassword,
          permissions: rolePermissions[user.role]
        });
      } else {
        reject({ message: 'Usuário não encontrado.' });
      }
    }, 300);
  });
};

// Obter todos os usuários (apenas para admins)
const getAllUsers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Retorna todos os usuários sem as senhas
      const usersWithoutPasswords = usersDatabase.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      resolve(usersWithoutPasswords);
    }, 500);
  });
};

// Obter requisições de acesso pendentes
const getPendingAccessRequests = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(pendingAccessRequests);
    }, 500);
  });
};

// Aprovar requisição de acesso
const approveAccessRequest = (requestId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Encontrar a requisição
      const requestIndex = pendingAccessRequests.findIndex(req => req.id === requestId);
      
      if (requestIndex !== -1) {
        const request = pendingAccessRequests[requestIndex];
        
        // Adicionar usuário ao banco de dados
        const newUser = {
          id: usersDatabase.length + 1,
          email: request.email,
          password: 'TemporaryPass@123', // Senha temporária
          name: request.name,
          role: request.requestedRole,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: null
        };
        
        usersDatabase.push(newUser);
        
        // Remover a requisição da lista
        pendingAccessRequests.splice(requestIndex, 1);
        
        resolve({ success: true, user: newUser });
      } else {
        resolve({ success: false, message: 'Requisição não encontrada.' });
      }
    }, 700);
  });
};

// Rejeitar requisição de acesso
const rejectAccessRequest = (requestId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Encontrar a requisição
      const requestIndex = pendingAccessRequests.findIndex(req => req.id === requestId);
      
      if (requestIndex !== -1) {
        // Remover a requisição da lista
        pendingAccessRequests.splice(requestIndex, 1);
        
        resolve({ success: true });
      } else {
        resolve({ success: false, message: 'Requisição não encontrada.' });
      }
    }, 700);
  });
};

// Atualizar usuário
const updateUser = (userId, userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = usersDatabase.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Atualizar dados do usuário
        const updatedUser = {
          ...usersDatabase[userIndex],
          ...userData,
          // Não permitir atualizar alguns campos sensíveis
          id: usersDatabase[userIndex].id,
          createdAt: usersDatabase[userIndex].createdAt
        };
        
        usersDatabase[userIndex] = updatedUser;
        
        // Clone do usuário sem a senha
        const { password, ...userWithoutPassword } = updatedUser;
        
        resolve({ success: true, user: userWithoutPassword });
      } else {
        reject({ message: 'Usuário não encontrado.' });
      }
    }, 600);
  });
};

// Desativar/ativar usuário
const toggleUserStatus = (userId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = usersDatabase.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Alternar status
        usersDatabase[userIndex].isActive = !usersDatabase[userIndex].isActive;
        
        // Clone do usuário sem a senha
        const { password, ...userWithoutPassword } = usersDatabase[userIndex];
        
        resolve({ success: true, user: userWithoutPassword });
      } else {
        reject({ message: 'Usuário não encontrado.' });
      }
    }, 500);
  });
};

// Alterar papel do usuário
const changeUserRole = (userId, newRole) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Verificar se o papel é válido
      if (!rolePermissions[newRole]) {
        reject({ message: 'Papel inválido.' });
        return;
      }
      
      const userIndex = usersDatabase.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Atualizar papel
        usersDatabase[userIndex].role = newRole;
        
        // Clone do usuário sem a senha
        const { password, ...userWithoutPassword } = usersDatabase[userIndex];
        
        resolve({ 
          success: true, 
          user: userWithoutPassword,
          permissions: rolePermissions[newRole]
        });
      } else {
        reject({ message: 'Usuário não encontrado.' });
      }
    }, 500);
  });
};

export {
  authenticateUser,
  getCurrentUser,
  getAllUsers,
  getPendingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  updateUser,
  toggleUserStatus,
  changeUserRole,
  rolePermissions
}; 