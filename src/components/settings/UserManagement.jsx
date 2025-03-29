import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

const Container = styled(Box)`
  padding: 24px;
`;

const StyledPaper = styled(Paper)`
  background-color: rgba(18, 18, 18, 0.8);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 160, 252, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 160, 252, 0.2);
`;

const StyledTableCell = styled(TableCell)`
  color: rgba(255, 255, 255, 0.87);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const StyledTableHeaderCell = styled(StyledTableCell)`
  background-color: rgba(0, 160, 252, 0.1);
  color: #00a0fc;
  font-weight: 600;
`;

const StatusChip = styled(Chip)`
  &.active {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }
  
  &.inactive {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }
  
  &.pending {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ff9800;
    border: 1px solid rgba(255, 152, 0, 0.3);
  }
`;

const ActionButton = styled(Button)`
  margin: 0 8px;
  text-transform: none;
  
  &.approve {
    color: #4caf50;
    border-color: rgba(76, 175, 80, 0.5);
    
    &:hover {
      border-color: #4caf50;
      background-color: rgba(76, 175, 80, 0.1);
    }
  }
  
  &.reject {
    color: #f44336;
    border-color: rgba(244, 67, 54, 0.5);
    
    &:hover {
      border-color: #f44336;
      background-color: rgba(244, 67, 54, 0.1);
    }
  }
`;

const roles = {
  admin: 'Administrador',
  qa_analyst: 'Analista QA',
  developer: 'Desenvolvedor',
  viewer: 'Visualizador'
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({
    open: false,
    user: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar usuários e solicitações pendentes
      const [usersData, requestsData] = await Promise.all([
        getAllUsers(),
        getPendingAccessRequests()
      ]);
      
      setUsers(usersData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar dados. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      setLoading(true);
      await approveAccessRequest(request.id);
      await loadData();
      setSnackbar({
        open: true,
        message: 'Solicitação aprovada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao aprovar solicitação. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      setLoading(true);
      await rejectAccessRequest(request.id);
      await loadData();
      setSnackbar({
        open: true,
        message: 'Solicitação rejeitada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao rejeitar solicitação. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditDialog({
      open: true,
      user: { ...user }
    });
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      await updateUser(editDialog.user.id, editDialog.user);
      await loadData();
      setEditDialog({ open: false, user: null });
      setSnackbar({
        open: true,
        message: 'Usuário atualizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar usuário. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      setLoading(true);
      await toggleUserStatus(userId);
      await loadData();
      setSnackbar({
        open: true,
        message: 'Status do usuário alterado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao alterar status do usuário. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress sx={{ color: '#00a0fc' }} />
      </Box>
    );
  }

  return (
    <Container>
      {/* Solicitações Pendentes */}
      {pendingRequests.length > 0 && (
        <>
          <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
            Solicitações Pendentes
          </Typography>
          <StyledPaper sx={{ mb: 4 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableHeaderCell>Nome</StyledTableHeaderCell>
                    <StyledTableHeaderCell>Email</StyledTableHeaderCell>
                    <StyledTableHeaderCell>Cargo Solicitado</StyledTableHeaderCell>
                    <StyledTableHeaderCell>Data</StyledTableHeaderCell>
                    <StyledTableHeaderCell>Ações</StyledTableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <StyledTableCell>{request.name}</StyledTableCell>
                      <StyledTableCell>{request.email}</StyledTableCell>
                      <StyledTableCell>{roles[request.requestedRole]}</StyledTableCell>
                      <StyledTableCell>
                        {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                      </StyledTableCell>
                      <StyledTableCell>
                        <ActionButton
                          variant="outlined"
                          size="small"
                          className="approve"
                          onClick={() => handleApproveRequest(request)}
                          startIcon={<CheckIcon />}
                        >
                          Aprovar
                        </ActionButton>
                        <ActionButton
                          variant="outlined"
                          size="small"
                          className="reject"
                          onClick={() => handleRejectRequest(request)}
                          startIcon={<CloseIcon />}
                        >
                          Rejeitar
                        </ActionButton>
                      </StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
        </>
      )}

      {/* Lista de Usuários */}
      <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
        Usuários do Sistema
      </Typography>
      <StyledPaper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableHeaderCell>Nome</StyledTableHeaderCell>
                <StyledTableHeaderCell>Email</StyledTableHeaderCell>
                <StyledTableHeaderCell>Cargo</StyledTableHeaderCell>
                <StyledTableHeaderCell>Status</StyledTableHeaderCell>
                <StyledTableHeaderCell>Último Acesso</StyledTableHeaderCell>
                <StyledTableHeaderCell>Ações</StyledTableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <StyledTableCell>{user.name}</StyledTableCell>
                  <StyledTableCell>{user.email}</StyledTableCell>
                  <StyledTableCell>{roles[user.role]}</StyledTableCell>
                  <StyledTableCell>
                    <StatusChip
                      label={user.isActive ? 'Ativo' : 'Inativo'}
                      className={user.isActive ? 'active' : 'inactive'}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Nunca acessou'}
                  </StyledTableCell>
                  <StyledTableCell>
                    <IconButton
                      onClick={() => handleEditUser(user)}
                      sx={{ color: '#00a0fc' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleUserStatus(user.id)}
                      sx={{ color: user.isActive ? '#f44336' : '#4caf50' }}
                    >
                      <BlockIcon />
                    </IconButton>
                  </StyledTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>

      {/* Diálogo de Edição */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 160, 252, 0.2)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Editar Usuário
        </DialogTitle>
        <DialogContent>
          {editDialog.user && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nome"
                value={editDialog.user.name}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  user: { ...prev.user, name: e.target.value }
                }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(18, 18, 18, 0.6)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a0fc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00a0fc',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#ffffff',
                  },
                }}
              />
              <TextField
                fullWidth
                label="Cargo"
                select
                value={editDialog.user.role}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  user: { ...prev.user, role: e.target.value }
                }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(18, 18, 18, 0.6)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a0fc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00a0fc',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#ffffff',
                  },
                }}
              >
                {Object.entries(roles).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => setEditDialog({ open: false, user: null })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #00a0fc 30%, #33b3fd 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #0070b0 30%, #00a0fc 90%)',
              },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement; 