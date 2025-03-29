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
  Chip
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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
  
  const [configurations, setConfigurations] = useState({
    testTypes: [
      { id: 1, name: 'Funcional', description: 'Testes de funcionalidade' },
      { id: 2, name: 'Integração', description: 'Testes de integração entre componentes' },
      { id: 3, name: 'Performance', description: 'Testes de desempenho' }
    ],
    priorities: [
      { id: 1, name: 'Baixa', color: '#4CAF50' },
      { id: 2, name: 'Média', color: '#FFC107' },
      { id: 3, name: 'Alta', color: '#F44336' },
      { id: 4, name: 'Crítica', color: '#9C27B0' }
    ],
    statuses: [
      { id: 1, name: 'Não Iniciado', color: '#9E9E9E' },
      { id: 2, name: 'Em Andamento', color: '#2196F3' },
      { id: 3, name: 'Concluído', color: '#4CAF50' },
      { id: 4, name: 'Bloqueado', color: '#F44336' }
    ]
  });

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

  const handleDelete = (type, id) => {
    const newConfigs = {
      ...configurations,
      [type]: configurations[type].filter(item => item.id !== id)
    };
    setConfigurations(newConfigs);
    setSnackbar({
      open: true,
      message: 'Item excluído com sucesso!',
      severity: 'success'
    });
  };

  const handleSave = (type, data) => {
    let newConfigs;
    if (editingItem) {
      newConfigs = {
        ...configurations,
        [type]: configurations[type].map(item =>
          item.id === editingItem.id ? { ...item, ...data } : item
        )
      };
    } else {
      const newId = Math.max(...configurations[type].map(item => item.id)) + 1;
      newConfigs = {
        ...configurations,
        [type]: [...configurations[type], { id: newId, ...data }]
      };
    }
    setConfigurations(newConfigs);
    setDialogOpen(false);
    setSnackbar({
      open: true,
      message: `Item ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
      severity: 'success'
    });
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
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

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
                </List>
              </>
            )}
          </Box>
        </StyledCard>

        <ConfigDialog />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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