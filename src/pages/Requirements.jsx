import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  GridView as MatrixIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { traceabilityService } from '../services/traceabilityService';
import { projectService } from '../services/projectService';
import { configService } from '../services/configService';
import TraceabilityMatrix from '../components/TraceabilityMatrix';
import CoverageDashboard from '../components/CoverageDashboard';

// Componente TabPanel - para exibir conteúdo das abas
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`requirements-tabpanel-${index}`}
      aria-labelledby={`requirements-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Requirements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useParams();
  
  // Estados principais
  const [requirements, setRequirements] = useState([]);
  const [project, setProject] = useState(null);
  const [configurations, setConfigurations] = useState({
    priorities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState(null);
  
  // Estado para navegação em abas
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: '',
    source: ''
  });
  
  // Funções para o formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Carregar dados do projeto e requisitos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar o projeto
        const projectResponse = await projectService.getProjectById(projectId);
        if (!projectResponse) {
          throw new Error('Projeto não encontrado');
        }
        setProject(projectResponse);
        
        // Carregar requisitos
        const requirementsResponse = await traceabilityService.getRequirementsByProject(projectId);
        setRequirements(requirementsResponse || []);
        
        // Carregar configurações aplicáveis
        const configs = await configService.getApplicableConfigs('priority', projectId);
        setConfigurations({
          priorities: configs || []
        });
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadData();
    }
  }, [projectId]);
  
  // Abrir o diálogo para adicionar ou editar requisito
  const handleOpenDialog = (requirement = null) => {
    if (requirement) {
      setCurrentRequirement(requirement);
      setFormData({
        name: requirement.name,
        description: requirement.description || '',
        priority: requirement.priority,
        source: requirement.source || ''
      });
    } else {
      setCurrentRequirement(null);
      setFormData({
        name: '',
        description: '',
        priority: configurations.priorities.length > 0 ? configurations.priorities[0].value : 'Média',
        source: ''
      });
    }
    setDialogOpen(true);
  };
  
  // Fechar o diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentRequirement(null);
  };
  
  // Salvar um requisito (novo ou editado)
  const handleSaveRequirement = async () => {
    try {
      setLoading(true);
      
      const requirementData = {
        ...formData,
        projectId
      };
      
      let response;
      
      if (currentRequirement) {
        // Atualizar requisito existente
        response = await traceabilityService.updateRequirement(
          currentRequirement.id, 
          requirementData, 
          user
        );
        
        // Atualizar a lista de requisitos
        setRequirements(prevRequirements => 
          prevRequirements.map(req => 
            req.id === currentRequirement.id 
              ? { ...req, ...requirementData } 
              : req
          )
        );
      } else {
        // Criar novo requisito
        response = await traceabilityService.createRequirement(requirementData);
        
        // Adicionar à lista de requisitos
        if (response) {
          setRequirements(prevRequirements => [...prevRequirements, response]);
        }
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar requisito:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir diálogo de confirmação para excluir
  const handleOpenDeleteDialog = (requirement) => {
    setCurrentRequirement(requirement);
    setDeleteDialogOpen(true);
  };
  
  // Fechar diálogo de exclusão
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrentRequirement(null);
  };
  
  // Excluir requisito
  const handleDeleteRequirement = async () => {
    try {
      setLoading(true);
      
      // Implementar a lógica de exclusão quando o serviço suportar
      // await traceabilityService.deleteRequirement(currentRequirement.id);
      
      // Atualizar a lista de requisitos
      setRequirements(prevRequirements => 
        prevRequirements.filter(req => req.id !== currentRequirement.id)
      );
      
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Erro ao excluir requisito:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Mudar aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Voltar para a página do projeto
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };
  
  // Estado de carregamento
  if (loading && !requirements.length) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando dados do projeto...
        </Typography>
      </Box>
    );
  }
  
  // Estado de erro
  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBackToProject} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              color="inherit" 
              onClick={handleBackToProject}
              sx={{ cursor: 'pointer' }}
            >
              Projetos
            </Link>
            <Link 
              color="inherit" 
              onClick={handleBackToProject}
              sx={{ cursor: 'pointer' }}
            >
              {project?.name}
            </Link>
            <Typography color="text.primary">Requisitos</Typography>
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Requisitos do Projeto
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Requisito
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Gerencie os requisitos para {project?.name}
        </Typography>
      </Box>
      
      {/* Abas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="requisitos e matriz tabs"
        >
          <Tab label="Requisitos" id="requirements-tab-0" />
          <Tab label="Matriz de Rastreabilidade" id="requirements-tab-1" />
          <Tab label="Dashboard de Cobertura" id="requirements-tab-2" />
        </Tabs>
      </Box>
      
      {/* Aba de Requisitos */}
      <TabPanel value={activeTab} index={0}>
        {requirements.length === 0 ? (
          <Box p={3} display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6" gutterBottom>
              Nenhum requisito encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Comece adicionando o primeiro requisito para este projeto.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Adicionar Requisito
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell>Casos de Teste</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requirements.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {req.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {req.name}
                      </Typography>
                      {req.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {req.description.substring(0, 60)}
                          {req.description.length > 60 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={req.priority} 
                        size="small"
                        color={
                          req.priority === 'Alta' || req.priority === 'Crítica' 
                            ? 'error' 
                            : req.priority === 'Média' 
                              ? 'warning' 
                              : 'success'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {req.source || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={req.linkedTestCases?.length || 0} 
                        size="small"
                        color={req.linkedTestCases?.length > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar Requisito">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(req)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir Requisito">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(req)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Vincular Casos de Teste">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/projects/${projectId}/requirements/${req.id}/link-tests`)}
                            color="primary"
                          >
                            <LinkIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      {/* Aba da Matriz de Rastreabilidade */}
      <TabPanel value={activeTab} index={1}>
        <TraceabilityMatrix projectId={projectId} />
      </TabPanel>
      
      {/* Aba do Dashboard de Cobertura */}
      <TabPanel value={activeTab} index={2}>
        <CoverageDashboard projectId={projectId} />
      </TabPanel>
      
      {/* Diálogo para adicionar/editar requisito */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentRequirement ? 'Editar Requisito' : 'Novo Requisito'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Preencha os campos abaixo para {currentRequirement ? 'atualizar o' : 'adicionar um novo'} requisito.
          </DialogContentText>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome do Requisito"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Descrição"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Prioridade</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                label="Prioridade"
              >
                {configurations.priorities.length > 0 ? (
                  configurations.priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="Crítica">Crítica</MenuItem>
                    <MenuItem value="Alta">Alta</MenuItem>
                    <MenuItem value="Média">Média</MenuItem>
                    <MenuItem value="Baixa">Baixa</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              fullWidth
              id="source"
              label="Origem (opcional)"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder="Ex: Cliente, Análise de Negócio, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveRequirement} 
            variant="contained" 
            disabled={!formData.name || !formData.priority}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o requisito "{currentRequirement?.name}"? 
            Esta ação não pode ser desfeita.
            {currentRequirement?.linkedTestCases?.length > 0 && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                <Typography variant="body2" color="error">
                  Atenção: Este requisito está vinculado a {currentRequirement.linkedTestCases.length} 
                  caso(s) de teste. A exclusão removerá esses vínculos.
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleDeleteRequirement} color="error">
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requirements; 