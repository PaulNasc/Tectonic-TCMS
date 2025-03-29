import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showIndexError, setShowIndexError] = useState(false);
  const [indexUrl, setIndexUrl] = useState('');

  useEffect(() => {
    if (user) {
      console.log('Usuário autenticado:', user);
      loadProjects();
    } else {
      console.log('Usuário não autenticado');
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowIndexError(false);
      console.log('Carregando projetos para o usuário:', user?.id);
      
      const { data, error } = await projectService.listProjects({ 
        userId: user.id,
        status: 'active'
      });
      
      if (error) {
        console.error('Erro retornado pelo serviço:', error);
        if (error.includes('índice')) {
          const indexUrl = error.split('Clique aqui: ')[1];
          setIndexUrl(indexUrl);
          setShowIndexError(true);
          setProjects([]);
          return;
        }
        throw new Error(error);
      }

      console.log('Projetos carregados:', data);
      setProjects(data || []);
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
      setError(err.message || 'Erro ao carregar projetos');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      console.log('Criando novo projeto:', newProject);
      console.log('Usuário atual:', user);
      
      const projectData = {
        ...newProject,
        createdBy: {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email
        }
      };

      console.log('Dados do projeto a ser criado:', projectData);
      const { data, error } = await projectService.createProject(projectData);
      
      if (error) {
        console.error('Erro ao criar projeto:', error);
        throw new Error(error);
      }

      console.log('Projeto criado com sucesso:', data);
      setProjects([data, ...projects]);
      setCreateDialogOpen(false);
      setNewProject({ name: '', description: '' });
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
      setError(err.message || 'Erro ao criar projeto');
    }
  };

  const handleProjectMenu = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleArchiveProject = async () => {
    try {
      const { error } = await projectService.updateProject(selectedProject.id, { status: 'archived' });
      if (error) throw new Error(error);
      
      loadProjects();
    } catch (err) {
      setError(err.message);
    }
    handleCloseMenu();
  };

  const handleCardClick = (projectId) => {
    console.log('Navegando para o projeto:', projectId);
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Projetos
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Novo Projeto
            </Button>
          </Box>

          {showIndexError && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  component={Link}
                  href={indexUrl}
                  target="_blank"
                >
                  Criar Índice
                </Button>
              }
            >
              É necessário criar um índice no Firestore para listar os projetos. Clique no botão para criar.
            </Alert>
          )}

          {error && !showIndexError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: (theme) => theme.shadows[4]
                      },
                      position: 'relative'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCardClick(project.id);
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" gutterBottom>
                          {project.name}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleProjectMenu(e, project);
                          }}
                          sx={{ position: 'relative', zIndex: 2 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {project.description}
                      </Typography>

                      <Box display="flex" gap={1} mb={2}>
                        <Tooltip title="Membros">
                          <Chip
                            size="small"
                            icon={<PeopleIcon />}
                            label={`${project.members?.length || 0}`}
                          />
                        </Tooltip>
                        <Tooltip title="Casos de Teste">
                          <Chip
                            size="small"
                            icon={<AssessmentIcon />}
                            label={`${project.statistics?.totalTestCases || 0}`}
                          />
                        </Tooltip>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Criado em: {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                        <Chip
                          size="small"
                          label={project.status === 'active' ? 'Ativo' : 'Arquivado'}
                          color={project.status === 'active' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Menu de Contexto do Projeto */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            onClick={(e) => e.stopPropagation()}
            sx={{ zIndex: 3 }}
          >
            <MenuItem onClick={() => {
              navigate(`/projects/${selectedProject?.id}/settings`);
              handleCloseMenu();
            }}>
              Configurações
            </MenuItem>
            <MenuItem onClick={() => {
              navigate(`/projects/${selectedProject?.id}/members`);
              handleCloseMenu();
            }}>
              Gerenciar Membros
            </MenuItem>
            <MenuItem onClick={handleArchiveProject}>
              {selectedProject?.status === 'active' ? 'Arquivar' : 'Restaurar'}
            </MenuItem>
          </Menu>

          {/* Diálogo de Criação de Projeto */}
          <Dialog 
            open={createDialogOpen} 
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Nome do Projeto"
                fullWidth
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Descrição"
                fullWidth
                multiline
                rows={4}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleCreateProject}
                variant="contained"
                disabled={!newProject.name.trim()}
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

export default Projects; 