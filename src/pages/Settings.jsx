import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  Box,
  Typography,
  Card,
  Tabs,
  Tab,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { configService } from '../services/configService';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const StyledCard = styled(Card)`
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
`;

const TabPanel = styled.div`
  padding: 24px;
`;

const StyledTabs = styled(Tabs)`
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  
  & .MuiTabs-indicator {
    background-color: var(--neon-primary);
  }
`;

const StyledTab = styled(Tab)`
  color: var(--text-secondary);
  &.Mui-selected {
    color: var(--neon-primary);
  }
`;

const ConfigItem = styled(ListItem)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  margin-bottom: 8px;
  background-color: var(--item-bg);
  
  &:hover {
    background-color: var(--hover-bg);
  }
`;

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('themeMode') === 'dark');
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dialogType, setDialogType] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isAdminHybex = user?.email === 'admin@hybex';
  
  const [configurations, setConfigurations] = useState({
    testTypes: [],
    priorities: [],
    statuses: []
  });

  // Carregar configurações do banco de dados
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obter configurações globais
        const { data, error } = await configService.getAllGlobalConfigs();
        
        if (error) {
          throw new Error(error);
        }
        
        // Usar dados retornados ou inicializar vazio
        setConfigurations({
          testTypes: data?.testTypes || [],
          priorities: data?.priorities || [],
          statuses: data?.statuses || []
        });
        
        // Se não houver configurações, criar as padrão
        if (!data || Object.keys(data).length === 0 || 
            !data.testTypes || data.testTypes.length === 0) {
          console.log('Criando configurações padrão...');
          await configService.createDefaultConfigurations();
          
          // Recarregar depois de criar as configurações padrão
          const { data: newData } = await configService.getAllGlobalConfigs();
          setConfigurations({
            testTypes: newData?.testTypes || [],
            priorities: newData?.priorities || [],
            statuses: newData?.statuses || []
          });
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadConfigurations();
  }, []);

  const handleThemeChange = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('themeMode', newMode);
    window.location.reload(); // Recarrega a página para aplicar o tema
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAdd = (type) => {
    setDialogType(type);
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (type, item) => {
    setDialogType(type);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (type, id) => {
    try {
      setError(null);
      
      // Chamar o serviço para remover o item
      const { error } = await configService.deleteConfig(id);
      
      if (error) {
        throw new Error(error);
      }
      
      // Atualizar estado local
      setConfigurations(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== id)
      }));
      
      setSnackbar({
        open: true,
        message: 'Item excluído com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Erro ao excluir: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleSave = async (type, data) => {
    try {
      setError(null);
      
      if (editingItem) {
        // Atualizar item existente
        const { data: updatedItem, error } = await configService.updateConfig(
          editingItem.id, 
          data
        );
        
        if (error) {
          throw new Error(error);
        }
        
        // Atualizar estado local
        setConfigurations(prev => ({
          ...prev,
          [type]: prev[type].map(item =>
            item.id === editingItem.id ? { ...item, ...data } : item
          )
        }));
      } else {
        // Criar novo item
        const configData = {
          ...data,
          type,
          isGlobal: true
        };
        
        const { data: newItem, error } = await configService.createConfig(configData);
        
        if (error) {
          throw new Error(error);
        }
        
        // Atualizar estado local
        setConfigurations(prev => ({
          ...prev,
          [type]: [...prev[type], newItem]
        }));
      }
      
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: `Item ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Erro ao salvar: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const ConfigDialog = () => {
    const [formData, setFormData] = useState(
      editingItem || {
        name: '',
        description: '',
        color: '#000000'
      }
    );

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--dialog-bg)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>
          {editingItem ? 'Editar' : 'Adicionar'} {
            dialogType === 'testTypes' ? 'Tipo de Teste' :
            dialogType === 'priorities' ? 'Prioridade' : 'Status'
          }
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
                  '& fieldset': { borderColor: 'var(--border-color)' }
                },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                '& .MuiInputBase-input': { color: 'var(--text-primary)' }
              }}
            />
            {dialogType === 'testTypes' ? (
              <TextField
                name="description"
                label="Descrição"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'var(--border-color)' }
                  },
                  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                  '& .MuiInputBase-input': { color: 'var(--text-primary)' }
                }}
              />
            ) : (
              <TextField
                name="color"
                label="Cor"
                type="color"
                value={formData.color}
                onChange={handleChange}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'var(--border-color)' }
                  },
                  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                  '& .MuiInputBase-input': { 
                    color: 'var(--text-primary)',
                    padding: '12px'
                  }
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleSave(dialogType, formData)}
            variant="contained"
            sx={{
              bgcolor: 'var(--neon-primary)',
              '&:hover': { bgcolor: 'var(--neon-primary-hover)' }
            }}
            disabled={!formData.name}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Renderização condicional para carregamento
  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
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
          <Typography variant="h4" color="var(--text-primary)">
            Configurações
          </Typography>
        </Header>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {isAdminHybex && (
          <Box mb={4}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                bgcolor: 'rgba(25, 118, 210, 0.08)', 
                borderLeft: '4px solid #1976d2',
                display: 'flex',
                flexDirection: {xs: 'column', sm: 'row'},
                alignItems: {xs: 'flex-start', sm: 'center'},
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AdminIcon sx={{ mr: 1 }} />
                  Acesso Administrativo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Como usuário administrador (admin@hybex), você tem acesso à área de gerenciamento do sistema.
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/admin')}
                startIcon={<AdminIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Acessar Área Admin
              </Button>
            </Paper>
          </Box>
        )}

        <StyledCard>
          <StyledTabs value={activeTab} onChange={handleTabChange}>
            <StyledTab label="Tipos de Teste" />
            <StyledTab label="Prioridades" />
            <StyledTab label="Status" />
          </StyledTabs>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd('testTypes')}
                    sx={{
                      color: 'var(--neon-primary)',
                      '&:hover': { bgcolor: 'var(--hover-bg)' }
                    }}
                  >
                    Adicionar Tipo
                  </Button>
                </Box>
                <List>
                  {configurations.testTypes.map((type) => (
                    <ConfigItem key={type.id}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: 'var(--text-primary)' }}>
                          {type.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                          {type.description}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit('testTypes', type)}
                          sx={{ color: 'var(--text-primary)' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete('testTypes', type.id)}
                          sx={{ color: 'var(--error-text)' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ConfigItem>
                  ))}
                  {configurations.testTypes.length === 0 && (
                    <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Nenhum tipo de teste configurado
                    </Typography>
                  )}
                </List>
              </>
            )}

            {activeTab === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd('priorities')}
                    sx={{
                      color: 'var(--neon-primary)',
                      '&:hover': { bgcolor: 'var(--hover-bg)' }
                    }}
                  >
                    Adicionar Prioridade
                  </Button>
                </Box>
                <List>
                  {configurations.priorities.map((priority) => (
                    <ConfigItem key={priority.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={priority.name}
                          sx={{
                            bgcolor: priority.color,
                            color: '#fff'
                          }}
                        />
                        {priority.description && (
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                            {priority.description}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit('priorities', priority)}
                          sx={{ color: 'var(--text-primary)' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete('priorities', priority.id)}
                          sx={{ color: 'var(--error-text)' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ConfigItem>
                  ))}
                  {configurations.priorities.length === 0 && (
                    <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Nenhuma prioridade configurada
                    </Typography>
                  )}
                </List>
              </>
            )}

            {activeTab === 2 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd('statuses')}
                    sx={{
                      color: 'var(--neon-primary)',
                      '&:hover': { bgcolor: 'var(--hover-bg)' }
                    }}
                  >
                    Adicionar Status
                  </Button>
                </Box>
                <List>
                  {configurations.statuses.map((status) => (
                    <ConfigItem key={status.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={status.name}
                          sx={{
                            bgcolor: status.color,
                            color: '#fff'
                          }}
                        />
                        {status.description && (
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                            {status.description}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit('statuses', status)}
                          sx={{ color: 'var(--text-primary)' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete('statuses', status.id)}
                          sx={{ color: 'var(--error-text)' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ConfigItem>
                  ))}
                  {configurations.statuses.length === 0 && (
                    <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Nenhum status configurado
                    </Typography>
                  )}
                </List>
              </>
            )}
          </Box>
        </StyledCard>

        <Box mt={4}>
          <StyledCard>
            <Box p={3}>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Aparência
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                  {isDarkMode ? <DarkModeIcon color="primary" /> : <LightModeIcon color="primary" />}
                  <Typography ml={2} color="var(--text-primary)">
                    Modo Escuro
                  </Typography>
                </Box>
                <Switch
                  checked={isDarkMode}
                  onChange={handleThemeChange}
                  color="primary"
                />
              </Box>
            </Box>
          </StyledCard>
        </Box>

        <Box mt={4}>
          <StyledCard>
            <Box p={3}>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Banco de Dados
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="var(--text-secondary)" paragraph>
                  O sistema usa índices no Firebase para consultas eficientes. Se você encontrar erros relacionados a índices ausentes, 
                  use os links abaixo para criá-los diretamente no Console do Firebase.
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom color="var(--text-primary)">
                Índices Necessários
              </Typography>
              
              <List>
                <ListItem sx={{ border: '1px solid var(--border-color)', borderRadius: 1, mb: 1 }}>
                  <ListItemText 
                    primary="Índice para Configurações Globais" 
                    secondary="Coleção: configurations | Campos: type, isGlobal, order"
                  />
                  <Button 
                    variant="outlined"
                    size="small"
                    component="a"
                    href="https://console.firebase.google.com/project/_/firestore/indexes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Criar Índice
                  </Button>
                </ListItem>
                
                <ListItem sx={{ border: '1px solid var(--border-color)', borderRadius: 1, mb: 1 }}>
                  <ListItemText 
                    primary="Índice para Configurações de Projeto" 
                    secondary="Coleção: configurations | Campos: type, projectId, order"
                  />
                  <Button 
                    variant="outlined"
                    size="small"
                    component="a"
                    href="https://console.firebase.google.com/project/_/firestore/indexes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Criar Índice
                  </Button>
                </ListItem>
                
                <ListItem sx={{ border: '1px solid var(--border-color)', borderRadius: 1, mb: 1 }}>
                  <ListItemText 
                    primary="Índice para Requisitos" 
                    secondary="Coleção: requirements | Campos: projectId, createdAt"
                  />
                  <Button 
                    variant="outlined"
                    size="small"
                    component="a"
                    href="https://console.firebase.google.com/project/_/firestore/indexes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Criar Índice
                  </Button>
                </ListItem>
                
                <ListItem sx={{ border: '1px solid var(--border-color)', borderRadius: 1, mb: 1 }}>
                  <ListItemText 
                    primary="Índice para Projetos por Membro" 
                    secondary="Coleção: projects | Campos: memberIds (array), createdAt"
                  />
                  <Button 
                    variant="outlined"
                    size="small"
                    component="a"
                    href="https://console.firebase.google.com/project/_/firestore/indexes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Criar Índice
                  </Button>
                </ListItem>
              </List>
              
              <Typography variant="subtitle2" gutterBottom color="var(--text-primary)" sx={{ mt: 3 }}>
                Instruções
              </Typography>
              <Typography variant="body2" color="var(--text-secondary)">
                1. Clique no botão "Criar Índice" para abrir o Console do Firebase.
                <br />
                2. No Console, selecione a coleção e os campos conforme indicado acima.
                <br />
                3. Para índices de array (com notation "array" acima), marque como "Array contains" no console.
                <br />
                4. Defina todos os campos como "Ascending" para ordenação.
                <br />
                5. Clique em "Criar Índice" no Console do Firebase.
                <br />
                6. Aguarde alguns minutos para que o índice seja criado.
              </Typography>
            </Box>
          </StyledCard>
        </Box>

        <ConfigDialog />

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
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

export default Settings; 