import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Menu as MenuIcon,
  Flag as FlagIcon,
  CheckCircle as StatusIcon
} from '@mui/icons-material';
import * as testService from '../services/testService';

const Container = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchField = styled(TextField)`
  width: 300px;
  
  & .MuiOutlinedInput-root {
    background-color: var(--card-bg);
    
    &:hover {
      & fieldset {
        border-color: var(--neon-primary);
      }
    }
  }
`;

const StyledTableContainer = styled(TableContainer)`
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  
  & .MuiTableCell-root {
    border-bottom-color: var(--border-color);
  }
  
  & .MuiTableRow-root:hover {
    background-color: var(--bg-tertiary);
  }
`;

const StatusChip = styled(Chip)`
  &.success {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }
  
  &.error {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }
  
  &.warning {
    background-color: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }
`;

const TestManagement = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    priority: '',
    steps: '',
    expectedResult: '',
    assignedTo: ''
  });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [priorityMenuAnchor, setPriorityMenuAnchor] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);

  useEffect(() => {
    loadTestCases();
  }, []);

  const loadTestCases = async () => {
    try {
      const { data, error } = await testService.getTestCases();
      if (error) throw error;
      setTests(data);
    } catch (error) {
      console.error('Erro ao carregar casos de teste:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar casos de teste',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    try {
      const { data, error } = await testService.createTestCase(formData);
      if (error) throw error;
      
      setTests(prev => [data, ...prev]);
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        type: '',
        priority: '',
        steps: '',
        expectedResult: '',
        assignedTo: ''
      });
      
      setSnackbar({
        open: true,
        message: 'Caso de teste criado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao criar caso de teste:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao criar caso de teste',
        severity: 'error'
      });
    }
  };

  const handleUpdateTest = async () => {
    try {
      const { error } = await testService.updateTestCase(selectedTest.id, formData);
      if (error) throw error;
      
      setTests(prev => prev.map(test => 
        test.id === selectedTest.id ? { ...test, ...formData } : test
      ));
      
      setEditDialogOpen(false);
      setSelectedTest(null);
      setFormData({
        name: '',
        description: '',
        type: '',
        priority: '',
        steps: '',
        expectedResult: '',
        assignedTo: ''
      });
      
      setSnackbar({
        open: true,
        message: 'Caso de teste atualizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao atualizar caso de teste:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar caso de teste',
        severity: 'error'
      });
    }
  };

  const handleDeleteTest = async (id) => {
    try {
      const { error } = await testService.deleteTestCase(id);
      if (error) throw error;
      
      setTests(prev => prev.filter(test => test.id !== id));
      handleMenuClose();
      
      setSnackbar({
        open: true,
        message: 'Caso de teste excluído com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir caso de teste:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir caso de teste',
        severity: 'error'
      });
    }
  };

  const handleMenuClick = (event, test) => {
    setAnchorEl(event.currentTarget);
    setSelectedTest(test);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTest(null);
  };

  const handleEditClick = () => {
    setFormData({
      name: selectedTest.name,
      description: selectedTest.description,
      type: selectedTest.type,
      priority: selectedTest.priority,
      steps: selectedTest.steps,
      expectedResult: selectedTest.expectedResult,
      assignedTo: selectedTest.assignedTo
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircleIcon fontSize="small" />;
      case 'Falhou':
        return <ErrorIcon fontSize="small" />;
      case 'Pendente':
        return <WarningIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'success';
      case 'Falhou':
        return 'error';
      case 'Pendente':
        return 'warning';
      default:
        return '';
    }
  };

  const handleStatusMenuOpen = (event, testId) => {
    event.stopPropagation();
    setSelectedTestId(testId);
    setStatusMenuAnchor(event.currentTarget);
  };

  const handlePriorityMenuOpen = (event, testId) => {
    event.stopPropagation();
    setSelectedTestId(testId);
    setPriorityMenuAnchor(event.currentTarget);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await testService.updateTestCase(selectedTestId, { status: newStatus });
      setStatusMenuAnchor(null);
      loadTestCases();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await testService.updateTestCase(selectedTestId, { priority: newPriority });
      setPriorityMenuAnchor(null);
      loadTestCases();
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  };

  const TestDialog = ({ open, onClose, test, onSave }) => {
    const [formData, setFormData] = useState({
      name: test?.name || '',
      description: test?.description || '',
      type: test?.type || '',
      priority: test?.priority || 'Medium',
      steps: test?.steps || '',
      expectedResult: test?.expectedResult || '',
      assignedTo: test?.assignedTo || ''
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--dialog-bg)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>
          {test ? 'Editar Caso de Teste' : 'Novo Caso de Teste'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              autoFocus
              name="name"
              label="Nome"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'var(--border-color)' },
                  '&:hover fieldset': { borderColor: 'var(--border-color-hover)' },
                  '&.Mui-focused fieldset': { borderColor: 'var(--neon-primary)' }
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                '& .MuiInputBase-input': { color: 'var(--text-primary)' }
              }}
            />
            
            <TextField
              label="Descrição"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--neon-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--neon-primary)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  '&.Mui-focused': {
                    color: 'var(--neon-primary)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary)',
                },
              }}
            />
            
            <FormControl 
              fullWidth 
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--neon-primary)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--neon-primary)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)',
                  '&.Mui-focused': {
                    color: 'var(--neon-primary)',
                  },
                },
                '& .MuiSelect-select': {
                  color: 'var(--text-primary)',
                },
              }}
            >
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Tipo"
              >
                <MenuItem value="Funcional">Funcional</MenuItem>
                <MenuItem value="UI/UX">UI/UX</MenuItem>
                <MenuItem value="Performance">Performance</MenuItem>
                <MenuItem value="Integração">Integração</MenuItem>
                <MenuItem value="Segurança">Segurança</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel>Prioridade</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Prioridade"
              >
                <MenuItem value="Baixa">Baixa</MenuItem>
                <MenuItem value="Média">Média</MenuItem>
                <MenuItem value="Alta">Alta</MenuItem>
                <MenuItem value="Crítica">Crítica</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Passos do Teste"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              required
              placeholder="1. Faça isso&#10;2. Faça aquilo&#10;3. Verifique isso"
            />
            
            <TextField
              label="Resultado Esperado"
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              multiline
              rows={2}
              fullWidth
              required
            />
            
            <TextField
              label="Responsável"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(formData)}
            variant="contained"
            sx={{ 
              bgcolor: 'var(--neon-primary)',
              '&:hover': { bgcolor: 'var(--neon-primary-hover)' }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Typography variant="h4">
            Gerenciamento de Testes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <SearchField
              placeholder="Buscar casos de teste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                bgcolor: 'var(--neon-primary)',
                color: '#000',
                '&:hover': {
                  bgcolor: 'var(--neon-tertiary)',
                }
              }}
            >
              Novo Caso de Teste
            </Button>
          </Box>
        </Header>

        <Card sx={{ bgcolor: 'var(--card-bg)' }}>
          <StyledTableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Última Execução</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests
                  .filter(test => 
                    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    test.id.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.id}</TableCell>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>{test.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={test.priority}
                        size="small"
                        color={test.priority === 'Alta' ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        icon={getStatusIcon(test.status)}
                        label={test.status}
                        size="small"
                        className={getStatusClass(test.status)}
                      />
                    </TableCell>
                      <TableCell>
                        {test.lastRun 
                          ? new Date(test.lastRun).toLocaleDateString()
                          : 'Nunca executado'}
                      </TableCell>
                    <TableCell>{test.assignedTo}</TableCell>
                    <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Alterar Status">
                            <IconButton 
                              size="small"
                              onClick={(e) => handleStatusMenuOpen(e, test.id)}
                            >
                              <StatusIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Alterar Prioridade">
                            <IconButton
                              size="small"
                              onClick={(e) => handlePriorityMenuOpen(e, test.id)}
                            >
                              <FlagIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick()}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                              onClick={() => handleDeleteTest(test.id)}
                      >
                              <DeleteIcon />
                      </IconButton>
                          </Tooltip>
                        </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Card>

        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
        >
          {['Não Iniciado', 'Em Andamento', 'Concluído', 'Bloqueado'].map((status) => (
            <MenuItem key={status} onClick={() => handleStatusChange(status)}>
              {status}
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={priorityMenuAnchor}
          open={Boolean(priorityMenuAnchor)}
          onClose={() => setPriorityMenuAnchor(null)}
        >
          {['Baixa', 'Média', 'Alta', 'Crítica'].map((priority) => (
            <MenuItem key={priority} onClick={() => handlePriorityChange(priority)}>
              {priority}
          </MenuItem>
          ))}
        </Menu>

        <TestDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          test={null}
          onSave={handleCreateTest}
        />

        <TestDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          test={selectedTest}
          onSave={handleUpdateTest}
        />

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
      </motion.div>
    </Container>
  );
};

export default TestManagement; 