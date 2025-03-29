import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { testSuiteService } from '../services/testSuiteService';
import { useAuth } from '../contexts/AuthContext';

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [createSuiteDialog, setCreateSuiteDialog] = useState(false);
  const [newSuite, setNewSuite] = useState({ name: '', description: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSuite, setSelectedSuite] = useState(null);

  useEffect(() => {
    if (user) {
      console.log('Usuário autenticado:', user);
      loadProjectData();
    } else {
      console.log('Usuário não autenticado');
      setError('Usuário não autenticado');
      setLoading(false);
    }
  }, [id, user]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Carregando dados do projeto:', id);
      
      const [projectResponse, suitesResponse] = await Promise.all([
        projectService.getProjectById(id),
        testSuiteService.listTestSuites(id)
      ]);

      console.log('Resposta do projeto:', projectResponse);
      console.log('Resposta das suites:', suitesResponse);

      if (projectResponse.error) throw new Error(projectResponse.error);
      if (suitesResponse.error) throw new Error(suitesResponse.error);

      if (!projectResponse.data) {
        throw new Error('Projeto não encontrado');
      }

      setProject(projectResponse.data);
      setSuites(suitesResponse.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do projeto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuite = async () => {
    try {
      console.log('Criando suite de teste com usuário:', user);
      const suiteData = {
        ...newSuite,
        projectId: id,
        createdBy: {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email
        }
      };

      console.log('Dados da suite a ser criada:', suiteData);
      const { data, error } = await testSuiteService.createTestSuite(suiteData);
      if (error) throw new Error(error);

      console.log('Suite criada com sucesso:', data);
      setSuites([data, ...suites]);
      setCreateSuiteDialog(false);
      setNewSuite({ name: '', description: '' });
    } catch (err) {
      console.error('Erro ao criar suite:', err);
      setError(err.message);
    }
  };

  const handleSuiteMenu = (event, suite) => {
    setAnchorEl(event.currentTarget);
    setSelectedSuite(suite);
  };

  const handleCloseSuiteMenu = () => {
    setAnchorEl(null);
    setSelectedSuite(null);
  };

  const handleArchiveSuite = async (suiteId) => {
    try {
      console.log('Arquivando suite de teste:', suiteId);
      const { data, error } = await testSuiteService.archiveTestSuite(suiteId);
      if (error) throw new Error(error);

      console.log('Suite arquivada com sucesso:', data);
      setSuites(suites.map((suite) =>
        suite.id === suiteId ? { ...suite, status: 'archived' } : suite
      ));
    } catch (err) {
      console.error('Erro ao arquivar suite:', err);
      setError(err.message);
    }
  };

  const handleRestoreSuite = async (suiteId) => {
    try {
      console.log('Restaurando suite de teste:', suiteId);
      const { data, error } = await testSuiteService.restoreTestSuite(suiteId);
      if (error) throw new Error(error);

      console.log('Suite restaurada com sucesso:', data);
      setSuites(suites.map((suite) =>
        suite.id === suiteId ? { ...suite, status: 'active' } : suite
      ));
    } catch (err) {
      console.error('Erro ao restaurar suite:', err);
      setError(err.message);
    }
  };

  const handleDeleteSuite = async (suiteId) => {
    try {
      console.log('Excluindo suite de teste:', suiteId);
      const { data, error } = await testSuiteService.deleteTestSuite(suiteId);
      if (error) throw new Error(error);

      console.log('Suite excluída com sucesso:', data);
      setSuites(suites.filter((suite) => suite.id !== suiteId));
    } catch (err) {
      console.error('Erro ao excluir suite:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/projects')}>
              Voltar para Projetos
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box p={3}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/projects')}>
              Voltar para Projetos
            </Button>
          }
        >
          Projeto não encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Box p={3}>
          {/* Cabeçalho do Projeto */}
          <Box mb={4}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {project.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {project.description}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${project.members?.length || 0} membros`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<AssessmentIcon />}
                    label={`${project.statistics?.totalTestCases || 0} testes`}
                    variant="outlined"
                  />
                  <Chip
                    label={project.status === 'active' ? 'Ativo' : 'Arquivado'}
                    color={project.status === 'active' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate(`/projects/${id}/members`)}
                >
                  Membros
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate(`/projects/${id}/settings`)}
                >
                  Configurações
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Tabs de Navegação */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Suítes de Teste" />
              <Tab label="Execuções" />
              <Tab label="Relatórios" />
            </Tabs>
          </Box>

          {/* Conteúdo das Tabs */}
          <Box>
            {activeTab === 0 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Suítes de Teste</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateSuiteDialog(true)}
                  >
                    Nova Suíte
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {suites.map((suite) => (
                    <Grid item xs={12} sm={6} md={4} key={suite.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: (theme) => theme.shadows[4]
                          }
                        }}
                        onClick={() => navigate(`/projects/${id}/suites/${suite.id}`)}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="h6" gutterBottom>
                              {suite.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSuiteMenu(e, suite);
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>

                          <Typography variant="body2" color="text.secondary" paragraph>
                            {suite.description}
                          </Typography>

                          <Box display="flex" gap={1} mb={2}>
                            <Chip
                              size="small"
                              label={`${suite.testCases?.length || 0} testes`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`${suite.statistics?.passRate?.toFixed(0) || 0}% passou`}
                              color={suite.statistics?.passRate > 80 ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Box>

                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Última execução: {suite.statistics?.lastExecution 
                                ? new Date(suite.statistics.lastExecution).toLocaleDateString()
                                : 'Nunca executado'
                              }
                            </Typography>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${id}/suites/${suite.id}/execute`);
                              }}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {activeTab === 1 && (
              <Typography variant="body1">
                Histórico de execuções em desenvolvimento...
              </Typography>
            )}

            {activeTab === 2 && (
              <Typography variant="body1">
                Relatórios em desenvolvimento...
              </Typography>
            )}
          </Box>

          {/* Menu de Contexto da Suíte */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseSuiteMenu}
          >
            <MenuItem onClick={() => {
              navigate(`/projects/${id}/suites/${selectedSuite?.id}/edit`);
              handleCloseSuiteMenu();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Editar
            </MenuItem>
            <MenuItem onClick={() => {
              navigate(`/projects/${id}/suites/${selectedSuite?.id}/execute`);
              handleCloseSuiteMenu();
            }}>
              <ListItemIcon>
                <PlayArrowIcon fontSize="small" />
              </ListItemIcon>
              Executar
            </MenuItem>
            <Divider />
            {selectedSuite?.status === 'archived' ? (
              <MenuItem onClick={() => {
                handleRestoreSuite(selectedSuite?.id);
                handleCloseSuiteMenu();
              }}>
                <ListItemIcon>
                  <RestoreIcon fontSize="small" />
                </ListItemIcon>
                Restaurar
              </MenuItem>
            ) : (
              <MenuItem onClick={() => {
                handleArchiveSuite(selectedSuite?.id);
                handleCloseSuiteMenu();
              }}>
                <ListItemIcon>
                  <ArchiveIcon fontSize="small" />
                </ListItemIcon>
                Arquivar
              </MenuItem>
            )}
            <Divider />
            <MenuItem 
              onClick={() => {
                handleDeleteSuite(selectedSuite?.id);
                handleCloseSuiteMenu();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              Excluir
            </MenuItem>
          </Menu>

          {/* Diálogo de Criação de Suíte */}
          <Dialog
            open={createSuiteDialog}
            onClose={() => setCreateSuiteDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Nova Suíte de Teste</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Nome da Suíte"
                fullWidth
                value={newSuite.name}
                onChange={(e) => setNewSuite({ ...newSuite, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Descrição"
                fullWidth
                multiline
                rows={4}
                value={newSuite.description}
                onChange={(e) => setNewSuite({ ...newSuite, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateSuiteDialog(false)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleCreateSuite}
                disabled={!newSuite.name.trim()}
              >
                Criar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectView; 