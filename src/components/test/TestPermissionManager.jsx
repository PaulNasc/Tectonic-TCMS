import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { db } from '../../config/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const PermissionChip = styled(Chip)(({ theme, role }) => ({
  backgroundColor: 
    role === 'admin' ? theme.palette.error.light :
    role === 'manager' ? theme.palette.warning.light :
    role === 'editor' ? theme.palette.info.light :
    theme.palette.success.light,
  color: 
    role === 'admin' ? theme.palette.error.contrastText :
    role === 'manager' ? theme.palette.warning.contrastText :
    role === 'editor' ? theme.palette.info.contrastText :
    theme.palette.success.contrastText,
}));

const permissionLevels = [
  { 
    id: 'viewer', 
    label: 'Visualizador', 
    description: 'Pode visualizar testes e suítes, mas não pode modificar ou executar testes',
    permissions: ['view_tests', 'view_reports']
  },
  { 
    id: 'tester', 
    label: 'Testador', 
    description: 'Pode visualizar e executar testes, mas não pode criar ou modificar testes',
    permissions: ['view_tests', 'view_reports', 'execute_tests']
  },
  { 
    id: 'editor', 
    label: 'Editor', 
    description: 'Pode criar, modificar e executar testes, mas não pode gerenciar usuários',
    permissions: ['view_tests', 'view_reports', 'execute_tests', 'create_tests', 'edit_tests']
  },
  { 
    id: 'manager', 
    label: 'Gerente', 
    description: 'Pode gerenciar testes e usuários, mas não tem acesso administrativo total',
    permissions: ['view_tests', 'view_reports', 'execute_tests', 'create_tests', 'edit_tests', 'manage_users']
  },
  { 
    id: 'admin', 
    label: 'Administrador', 
    description: 'Acesso total ao projeto, incluindo configurações e exclusão',
    permissions: ['view_tests', 'view_reports', 'execute_tests', 'create_tests', 'edit_tests', 'manage_users', 'manage_project']
  }
];

const TestPermissionManager = ({ projectId }) => {
  const { user } = useAuth();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Carregar dados do projeto
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          throw new Error('Projeto não encontrado');
        }
        
        setProjectData({
          id: projectSnap.id,
          ...projectSnap.data(),
          members: projectSnap.data().members?.map(member => ({
            ...member,
            addedAt: member.addedAt?.toDate() || new Date()
          })) || []
        });
      } catch (err) {
        console.error('Erro ao carregar projeto:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);
  
  const handleOpenAddMember = () => {
    setOpenDialog(true);
    setSelectedMember(null);
    setUserSearch('');
    setUserResults([]);
  };
  
  const handleOpenEditMember = (member) => {
    setSelectedMember(member);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };
  
  const searchUsers = async (query) => {
    if (!query || query.length < 3) {
      setUserResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      // Buscar usuários por email ou nome
      const usersRef = collection(db, 'users');
      const emailQuery = query.toLowerCase();
      
      // Usar consulta por email (mais precisa)
      const q = query(usersRef, where('email', '>=', emailQuery), where('email', '<=', emailQuery + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      
      const results = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filtrar usuários que já são membros
        .filter(user => !projectData.members.some(member => member.userId === user.id));
      
      setUserResults(results);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleUserSearch = (e) => {
    const query = e.target.value;
    setUserSearch(query);
    
    // Debounce para evitar muitas consultas
    if (query.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchUsers(query);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setUserResults([]);
    }
  };
  
  const handleSelectUser = (selectedUser) => {
    setSelectedMember({
      userId: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: 'viewer' // Papel padrão
    });
    setUserSearch('');
    setUserResults([]);
  };
  
  const handleRoleChange = (e) => {
    setSelectedMember({
      ...selectedMember,
      role: e.target.value
    });
  };
  
  const handleSaveMember = async () => {
    if (!selectedMember || !selectedMember.role) return;
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Verificar se estamos editando um membro existente
      const isEdit = projectData.members.some(m => m.userId === selectedMember.userId);
      
      if (isEdit) {
        // Atualizar membro existente
        const updatedMembers = projectData.members.map(member => 
          member.userId === selectedMember.userId 
            ? { ...selectedMember, addedAt: member.addedAt } 
            : member
        );
        
        await updateDoc(projectRef, { members: updatedMembers });
      } else {
        // Adicionar novo membro
        const newMember = {
          ...selectedMember,
          addedAt: new Date()
        };
        
        // Atualizar membros e memberIds
        await updateDoc(projectRef, { 
          members: arrayUnion(newMember),
          memberIds: arrayUnion(selectedMember.userId)
        });
      }
      
      // Atualizar estado local
      setProjectData(prevData => {
        if (isEdit) {
          const updatedMembers = prevData.members.map(member => 
            member.userId === selectedMember.userId 
              ? { ...selectedMember, addedAt: member.addedAt } 
              : member
          );
          
          return {
            ...prevData,
            members: updatedMembers
          };
        } else {
          return {
            ...prevData,
            members: [...prevData.members, { ...selectedMember, addedAt: new Date() }],
            memberIds: [...(prevData.memberIds || []), selectedMember.userId]
          };
        }
      });
      
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar membro:', err);
      setError(err.message);
    }
  };
  
  const handleRemoveMember = async (member) => {
    // Impedir a remoção do último administrador
    const admins = projectData.members.filter(m => m.role === 'admin');
    if (admins.length === 1 && admins[0].userId === member.userId) {
      setError('Não é possível remover o único administrador do projeto');
      return;
    }
    
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Remover membro e seu ID da lista
      await updateDoc(projectRef, { 
        members: arrayRemove(member),
        memberIds: arrayRemove(member.userId)
      });
      
      // Atualizar estado local
      setProjectData(prevData => ({
        ...prevData,
        members: prevData.members.filter(m => m.userId !== member.userId),
        memberIds: (prevData.memberIds || []).filter(id => id !== member.userId)
      }));
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      setError(err.message);
    }
  };
  
  // Verificar se o usuário atual tem permissão para gerenciar membros
  const hasManagePermission = () => {
    if (!projectData || !user) return false;
    
    const currentUserMember = projectData.members.find(m => m.userId === user.id);
    return currentUserMember && ['admin', 'manager'].includes(currentUserMember.role);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  const canManageMembers = hasManagePermission();
  
  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Gerenciamento de Permissões
        </Typography>
        
        {canManageMembers && (
          <Button 
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAddMember}
          >
            Adicionar Membro
          </Button>
        )}
      </Box>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nível de Acesso</TableCell>
              <TableCell>Adicionado em</TableCell>
              {canManageMembers && (
                <TableCell align="right">Ações</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {projectData.members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <PermissionChip 
                    label={permissionLevels.find(p => p.id === member.role)?.label || member.role}
                    role={member.role}
                    size="small"
                    icon={
                      <Tooltip title={permissionLevels.find(p => p.id === member.role)?.description || ""}>
                        <InfoIcon fontSize="small" />
                      </Tooltip>
                    }
                  />
                </TableCell>
                <TableCell>
                  {member.addedAt instanceof Date 
                    ? member.addedAt.toLocaleDateString() 
                    : new Date(member.addedAt).toLocaleDateString()}
                </TableCell>
                {canManageMembers && (
                  <TableCell align="right">
                    <IconButton 
                      size="small"
                      onClick={() => handleOpenEditMember(member)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => handleRemoveMember(member)}
                      color="error"
                      disabled={user.id === member.userId} // Não permitir remover a si mesmo
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMember?.userId ? 'Editar Membro' : 'Adicionar Membro'}
        </DialogTitle>
        <DialogContent>
          {!selectedMember?.userId ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Buscar usuário por email"
                fullWidth
                value={userSearch}
                onChange={handleUserSearch}
                variant="outlined"
                placeholder="Digite pelo menos 3 caracteres"
                InputProps={{
                  endAdornment: searchLoading && <CircularProgress size={20} />
                }}
              />
              
              {userResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Resultados:
                  </Typography>
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {userResults.map(user => (
                      <Box 
                        key={user.id}
                        sx={{ 
                          p: 1.5, 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}
                        onClick={() => handleSelectUser(user)}
                      >
                        <Typography variant="body2">{user.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {user.email}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {selectedMember.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedMember.email}
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Nível de Acesso</InputLabel>
                <Select
                  value={selectedMember.role}
                  onChange={handleRoleChange}
                  label="Nível de Acesso"
                >
                  {permissionLevels.map(level => (
                    <MenuItem key={level.id} value={level.id}>
                      <Box>
                        <Typography variant="body2">{level.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {level.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Permissões incluídas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {selectedMember.role && permissionLevels.find(p => p.id === selectedMember.role)?.permissions.map(perm => (
                    <Chip 
                      key={perm} 
                      label={perm.replace(/_/g, ' ')} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveMember}
            variant="contained"
            disabled={!selectedMember?.userId || !selectedMember?.role}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestPermissionManager; 