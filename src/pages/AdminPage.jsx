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
  ListItemIcon,
  Container,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  SecurityUpdateGood as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import * as userService from '../services/userService';

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
  const [accessRequests, setAccessRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Verificar se o usuário tem permissão de admin
    if (user && user.role !== USER_ROLES.ADMIN && user?.email !== 'admin@hybex') {
      setMessage('Você não tem permissão para acessar esta página');
      setMessageType('error');
    } else {
      loadUsers();
      loadAccessRequests();
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
      
      // Buscar usuários do Firebase
      const { data, error } = await userService.getAllUsers();
      
      if (error) {
        throw new Error(error);
      }
      
      setUsers(data || []);
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

  const loadAccessRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestError(null);
      
      const { data, error } = await userService.getPendingAccessRequests();
      
      if (error) {
        throw new Error(error);
      }
      
      setAccessRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações de acesso:', error);
      setRequestError(error.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setLoadingRequests(true);
      
      const { data, error } = await userService.approveAccessRequest(requestId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Recarregar solicitações
      await loadAccessRequests();
      await loadUsers();
      
      setSnackbar({
        open: true,
        message: 'Solicitação aprovada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      setSnackbar({
        open: true,
        message: `Erro ao aprovar solicitação: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleOpenRejectDialog = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectionDialog(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setLoadingRequests(true);
      
      const { error } = await userService.rejectAccessRequest(
        selectedRequest.id, 
        rejectionReason
      );
      
      if (error) {
        throw new Error(error);
      }
      
      // Recarregar solicitações
      await loadAccessRequests();
      
      setSnackbar({
        open: true,
        message: 'Solicitação rejeitada com sucesso!',
        severity: 'success'
      });
      
      setShowRejectionDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      setSnackbar({
        open: true,
        message: `Erro ao rejeitar solicitação: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (user && user.role !== USER_ROLES.ADMIN && user?.email !== 'admin@hybex') {
    return (
      <Box p={3}>
        <Alert severity="error">
          Você não tem permissão para acessar esta página.
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 0, 
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: theme => `0 6px 16px 0 ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        <Box sx={{ 
          p: 3, 
          background: theme => 
            theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' 
              : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: theme => theme.palette.mode === 'dark' ? '#fff' : '#1E40AF',
            }}
          >
            Painel Administrativo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie usuários, solicitações de acesso e configurações do sistema
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={messageType} 
            sx={{ 
              mx: 3, 
              mt: 3, 
              borderRadius: 1,
              boxShadow: 1
            }}
            onClose={() => setMessage(null)}
          >
            {message}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 600
            }
          }}
        >
          <Tab label="Usuários" />
          <Tab label="Solicitações de Acesso" />
          <Tab label="Configurações do Sistema" />
        </Tabs>

        {/* Tab 1: Gerenciamento de Usuários */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Gerenciamento de Usuários
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenUserDialog()}
              >
                Novo Usuário
              </Button>
            </Box>

            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Último Acesso</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow 
                          key={user.id}
                          hover
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            opacity: user.isActive ? 1 : 0.6
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
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenUserDialog(user)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.isActive ? 'Desativar' : 'Ativar'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleToggleUserStatus(user.id)}
                                color={user.isActive ? 'warning' : 'success'}
                              >
                                {user.isActive ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nenhum usuário encontrado
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Manutenção de Dados
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleMigrateMemberIds}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                Migrar memberIds
              </Button>
              {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            </Box>
          </Box>
        )}

        {/* Tab 2: Solicitações de Acesso */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Solicitações de Acesso Pendentes
            </Typography>

            {loadingRequests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : requestError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {requestError}
              </Alert>
            ) : accessRequests.length === 0 ? (
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Não há solicitações de acesso pendentes
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data da Solicitação</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow 
                        key={request.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.email}</TableCell>
                        <TableCell>
                          {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => handleApproveRequest(request.id)}
                            sx={{ mr: 1 }}
                          >
                            Aprovar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleOpenRejectDialog(request)}
                          >
                            Rejeitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 3: Configurações do Sistema */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Configurações Avançadas
            </Typography>

            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: 2,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(244,63,94,0.1)' : 'rgba(254,226,226,1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                  Zona de Perigo
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                As ações abaixo são irreversíveis e podem afetar permanentemente os dados do sistema. 
                Proceda com extrema cautela.
              </Typography>
              
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleOpenResetDialog}
                sx={{ fontWeight: 'bold' }}
              >
                Resetar Dados do Sistema
              </Button>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Dialog de usuário */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? `Editar Usuário: ${selectedUser.name}` : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Nome"
              name="name"
              value={userFormData.name}
              onChange={handleUserFormChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              value={userFormData.email}
              onChange={handleUserFormChange}
              required
              disabled={Boolean(selectedUser)}
            />
            <FormControl fullWidth margin="normal" required>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de reset de dados */}
      <Dialog open={openResetDialog} onClose={handleCloseResetDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Resetar Todos os Dados
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              ATENÇÃO: Esta ação é permanente e irreversível!
            </Typography>
            <Typography variant="body2">
              Todos os dados serão excluídos, incluindo projetos, testes, usuários e configurações.
            </Typography>
          </Alert>
          
          <Typography variant="body1" paragraph>
            Para confirmar, digite "RESETAR SISTEMA" no campo abaixo:
          </Typography>
          
          <TextField
            fullWidth
            margin="normal"
            label="Confirmação"
            value={resetConfirmation}
            onChange={handleResetConfirmationChange}
            error={resetConfirmation.length > 0 && resetConfirmation !== 'RESETAR SISTEMA'}
            helperText={resetConfirmation.length > 0 && resetConfirmation !== 'RESETAR SISTEMA' ? 'Digite exatamente "RESETAR SISTEMA"' : ''}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Senha de Administrador"
            type="password"
            value={adminPassword}
            onChange={handleAdminPasswordChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancelar</Button>
          <Button 
            onClick={handleResetAllData} 
            variant="contained" 
            color="error"
            disabled={resetConfirmation !== 'RESETAR SISTEMA' || !adminPassword || resetInProgress}
          >
            {resetInProgress ? <CircularProgress size={24} /> : 'Resetar Sistema'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de rejeição de solicitação */}
      <Dialog open={showRejectionDialog} onClose={() => setShowRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeitar Solicitação de Acesso</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Você está rejeitando o acesso para: <strong>{selectedRequest?.email}</strong>
          </Typography>
          <TextField
            label="Motivo da Rejeição"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            margin="normal"
            placeholder="Explique o motivo da rejeição (opcional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectionDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRejectRequest}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPage; 
 
 