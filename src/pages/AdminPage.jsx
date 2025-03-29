import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  SecurityUpdateGood as SecurityIcon
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

const AdminPage = () => {
  const { user, updateUserRole, resetAllData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [userFormData, setUserFormData] = useState({
    email: '',
    name: '',
    role: USER_ROLES.USER,
    isActive: true
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [resetInProgress, setResetInProgress] = useState(false);

  useEffect(() => {
    // Verificar se o usuário tem permissão de admin
    if (user && user.role !== USER_ROLES.ADMIN) {
      setMessage('Você não tem permissão para acessar esta página');
      setMessageType('error');
    } else {
      loadUsers();
    }
  }, [user]);

  const setInfoMessage = (msg) => {
    setMessage(msg);
    setMessageType('info');
  };

  const setSuccessMessage = (msg) => {
    setMessage(msg);
    setMessageType('success');
  };

  const setErrorMessage = (msg) => {
    setMessage(msg);
    setMessageType('error');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMigrateMemberIds = async () => {
    setLoading(true);
    setInfoMessage('Iniciando migração de memberIds...');
    
    try {
      const projectsRef = collection(db, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      
      const total = querySnapshot.docs.length;
      let updated = 0;
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        
        // Verificar se já tem memberIds
        if (data.memberIds && data.memberIds.length > 0) {
          continue;
        }
        
        // Extrair IDs de membros
        const memberIds = Array.isArray(data.members) 
          ? data.members.map(m => m.userId).filter(Boolean)
          : [];
        
        if (memberIds.length > 0) {
          await updateDoc(doc(db, 'projects', docSnap.id), {
            memberIds,
            updatedAt: new Date()
          });
          updated++;
        }
      }
      
      setSuccessMessage(`Migração concluída! Total: ${total}, Atualizados: ${updated}`);
    } catch (error) {
      console.error('Erro na migração:', error);
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Simulação - substituir pela chamada real ao Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados de exemplo
      const mockUsers = [
        { id: '1', email: 'admin@example.com', name: 'Admin User', role: 'admin', isActive: true, lastLogin: new Date() },
        { id: '2', email: 'manager@example.com', name: 'Manager User', role: 'manager', isActive: true, lastLogin: new Date() },
        { id: '3', email: 'user1@example.com', name: 'Regular User 1', role: 'user', isActive: true, lastLogin: new Date() },
        { id: '4', email: 'user2@example.com', name: 'Disabled User', role: 'user', isActive: false, lastLogin: new Date() }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setErrorMessage(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserFormChange = (e) => {
    const { name, value, checked } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: name === 'isActive' ? checked : value
    });
  };

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setUserFormData({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
      setSelectedUser(user);
    } else {
      setUserFormData({
        email: '',
        name: '',
        role: USER_ROLES.USER,
        isActive: true
      });
      setSelectedUser(null);
    }
    setOpenUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      // Validações
      if (!userFormData.email || !userFormData.name || !userFormData.role) {
        throw new Error('Todos os campos são obrigatórios');
      }
      
      // Simulação - substituir pela chamada real ao Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (selectedUser) {
        // Atualizar usuário existente
        const updatedUsers = users.map(u => 
          u.id === selectedUser.id ? { ...u, ...userFormData } : u
        );
        setUsers(updatedUsers);
        setSuccessMessage(`Usuário ${userFormData.name} atualizado com sucesso!`);
      } else {
        // Criar novo usuário
        const newUser = {
          id: Date.now().toString(), // ID temporário
          ...userFormData,
          lastLogin: null
        };
        setUsers([...users, newUser]);
        setSuccessMessage(`Usuário ${userFormData.name} criado com sucesso!`);
      }
      
      handleCloseUserDialog();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      setLoading(true);
      
      // Simulação - substituir pela chamada real ao Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      setSuccessMessage('Status do usuário alterado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const indexLinks = [
    {
      name: 'Índice de Projetos (memberIds + createdAt)',
      url: 'https://console.firebase.google.com/project/teste-3e34f/firestore/indexes/composite?create=Cj9wcm9qZWN0cwobCgltZW1iZXJJZHMYASoGCgR1c2VyEhoKCWNyZWF0ZWRBdBABGgwKCF9fbmFtZV9fEAI'
    },
    {
      name: 'Índice de Suites (projectId + createdAt)',
      url: 'https://console.firebase.google.com/project/teste-3e34f/firestore/indexes/composite?create=Cj90ZXN0U3VpdGVzEhEKCXByb2plY3RJZBABGgkKCWNyZWF0ZWRBdBABGg0KCV9fbmFtZV9fEAI'
    }
  ];

  const getRoleLabel = (role) => {
    const labels = {
      [USER_ROLES.ADMIN]: 'Administrador',
      [USER_ROLES.MANAGER]: 'Gerente',
      [USER_ROLES.USER]: 'Usuário'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      [USER_ROLES.ADMIN]: 'error',
      [USER_ROLES.MANAGER]: 'warning',
      [USER_ROLES.USER]: 'primary'
    };
    return colors[role] || 'default';
  };

  const handleOpenResetDialog = () => {
    setOpenResetDialog(true);
    setResetConfirmation('');
    setAdminPassword('');
    setMessage(null);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
    setResetConfirmation('');
    setAdminPassword('');
  };

  const handleResetConfirmationChange = (e) => {
    setResetConfirmation(e.target.value);
  };

  const handleAdminPasswordChange = (e) => {
    setAdminPassword(e.target.value);
  };

  const handleResetAllData = async () => {
    try {
      setResetInProgress(true);
      setMessage(null);
      
      if (!adminPassword) {
        throw new Error('Senha de administrador é obrigatória');
      }
      
      const expectedText = 'Eu confirmo que desejo zerar todos os dados do sistema';
      if (resetConfirmation !== expectedText) {
        throw new Error('O texto de confirmação está incorreto');
      }
      
      // Verificar a senha do administrador (na vida real, você provavelmente faria isso em uma API segura)
      const { user: authResult, error: authError } = await useAuth().login(user.email, adminPassword);
      
      if (authError) {
        throw new Error('Senha de administrador incorreta');
      }
      
      const result = await resetAllData(adminPassword, resetConfirmation);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      handleCloseResetDialog();
      setSuccessMessage('Todos os dados foram zerados com sucesso! O sistema será recarregado em alguns segundos...');
      
      // Recarregar a página após alguns segundos
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      setErrorMessage(`Erro: ${error.message}`);
    } finally {
      setResetInProgress(false);
    }
  };

  if (user && user.role !== USER_ROLES.ADMIN) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Você não tem permissão para acessar esta página.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Administração do Sistema
      </Typography>
      
      {message && (
        <Alert severity={messageType} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Gerenciamento de Usuários" />
        <Tab label="Ferramentas do Sistema" />
      </Tabs>
      
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Usuários</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenUserDialog()}
            >
              Novo Usuário
            </Button>
          </Box>
          
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Função</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Último Acesso</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: !user.isActive ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                        }}
                      >
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleLabel(user.role)}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Ativo' : 'Inativo'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleString() 
                            : 'Nunca acessou'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenUserDialog(user)}
                            size="small"
                            title="Editar usuário"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => handleToggleUserStatus(user.id)}
                            size="small"
                            title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                          >
                            {user.isActive ? <BlockIcon /> : <CheckIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  name="name"
                  label="Nome"
                  fullWidth
                  required
                  value={userFormData.name}
                  onChange={handleUserFormChange}
                  margin="normal"
                />
                
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={userFormData.email}
                  onChange={handleUserFormChange}
                  margin="normal"
                  disabled={!!selectedUser} // Não permitir alterar email de usuário existente
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Função</InputLabel>
                  <Select
                    name="role"
                    value={userFormData.role}
                    onChange={handleUserFormChange}
                    label="Função"
                  >
                    <MenuItem value={USER_ROLES.ADMIN}>Administrador</MenuItem>
                    <MenuItem value={USER_ROLES.MANAGER}>Gerente</MenuItem>
                    <MenuItem value={USER_ROLES.USER}>Usuário</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isActive"
                    value={userFormData.isActive}
                    onChange={handleUserFormChange}
                    label="Status"
                  >
                    <MenuItem value={true}>Ativo</MenuItem>
                    <MenuItem value={false}>Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseUserDialog}>Cancelar</Button>
              <Button 
                onClick={handleSaveUser} 
                variant="contained" 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                Salvar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Migração de Dados
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleMigrateMemberIds}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Migrar memberIds para Projetos'}
            </Button>
            
            <Typography variant="body2" color="text.secondary">
              Esta operação adiciona o campo memberIds aos projetos existentes, necessário para consultas eficientes.
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Criação de Índices
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Clique nos links abaixo para criar os índices necessários no Firestore:
            </Typography>
            
            <List>
              {indexLinks.map((link, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText 
                      primary={link.name}
                      secondary={
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="primary"
                          href={link.url}
                          target="_blank"
                          sx={{ mt: 1 }}
                        >
                          Criar Índice
                        </Button>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Segurança do Sistema
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => setInfoMessage('Verificação de segurança iniciada')}
              >
                Verificar Configurações de Segurança
              </Button>
              
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setInfoMessage('Auditoria de logs será implementada em breve')}
              >
                Auditoria de Logs
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                onClick={() => setInfoMessage('Limpeza de cache realizada')}
              >
                Limpar Cache do Sistema
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'error.light' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom color="error.contrastText">
                  Zona de Perigo
                </Typography>
                <Typography variant="body2" color="error.contrastText">
                  As ações abaixo são irreversíveis e podem causar perda permanente de dados.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenResetDialog}
              >
                Resetar Todos os Dados
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* Dialog de confirmação para resetar todos os dados */}
      <Dialog
        open={openResetDialog}
        onClose={handleCloseResetDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
          ATENÇÃO: Ação Irreversível
        </DialogTitle>
        <DialogContent>
          <Box mt={2} mb={2}>
            <Typography variant="body1" paragraph color="error" fontWeight="bold">
              Você está prestes a apagar TODOS os dados do sistema. Esta ação não pode ser desfeita!
            </Typography>
            
            <Typography variant="body2" paragraph>
              Todos os seguintes dados serão permanentemente excluídos:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                <ListItemText primary="Todos os projetos" />
              </ListItem>
              <ListItem>
                <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                <ListItemText primary="Todas as suítes de teste" />
              </ListItem>
              <ListItem>
                <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                <ListItemText primary="Todos os casos de teste" />
              </ListItem>
              <ListItem>
                <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                <ListItemText primary="Todas as execuções de teste" />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" paragraph fontWeight="bold">
              Para confirmar que você entende as consequências, digite exatamente o texto a seguir:
            </Typography>
            
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              Eu confirmo que desejo zerar todos os dados do sistema
            </Box>
            
            <TextField
              fullWidth
              label="Digite o texto de confirmação"
              value={resetConfirmation}
              onChange={handleResetConfirmationChange}
              error={resetConfirmation !== '' && resetConfirmation !== 'Eu confirmo que desejo zerar todos os dados do sistema'}
              helperText={resetConfirmation !== '' && resetConfirmation !== 'Eu confirmo que desejo zerar todos os dados do sistema' ? 'O texto não corresponde exatamente' : ''}
              margin="normal"
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Senha de Administrador"
              type="password"
              value={adminPassword}
              onChange={handleAdminPasswordChange}
              margin="normal"
              variant="outlined"
            />
            
            {message && (
              <Alert severity={messageType} sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseResetDialog} 
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleResetAllData}
            variant="contained"
            color="error"
            disabled={
              resetConfirmation !== 'Eu confirmo que desejo zerar todos os dados do sistema' ||
              !adminPassword ||
              resetInProgress
            }
            startIcon={resetInProgress ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {resetInProgress ? 'Processando...' : 'Resetar Todos os Dados'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage; 