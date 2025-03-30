import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { testSuiteService } from '../services/testSuiteService';

// Componente TabPanel para mostrar conteúdo de cada aba
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TestSuiteEdit = () => {
  const { projectId, suiteId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action');
  const [suite, setSuite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado para controle do diálogo de adição de caso de teste
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    description: '',
    steps: [],
    expectedResults: '',
    prerequisites: [],
    priority: 'medium'
  });
  const [currentStep, setCurrentStep] = useState('');
  const [currentPrerequisite, setCurrentPrerequisite] = useState('');

  useEffect(() => {
    const loadSuite = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Carregando detalhes da suite:', suiteId);

        const { data, error } = await testSuiteService.getTestSuiteById(suiteId);
        
        if (error) {
          throw new Error(error);
        }

        if (!data) {
          throw new Error('Suite de teste não encontrada');
        }

        setSuite(data);
        setFormData({
          name: data.name,
          description: data.description
        });
      } catch (err) {
        console.error('Erro ao carregar suite:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId) {
      loadSuite();
    }
  }, [suiteId]);

  useEffect(() => {
    if (initialAction === 'addTestCase') {
      setActiveTab(1);
    }
  }, [initialAction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validações
      if (!formData.name.trim()) {
        throw new Error('O nome da suite é obrigatório');
      }

      const { error } = await testSuiteService.updateTestSuite(suiteId, {
        name: formData.name,
        description: formData.description
      });

      if (error) {
        throw new Error(error);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/projects/${projectId}/suites/${suiteId}`);
      }, 1500);
    } catch (err) {
      console.error('Erro ao salvar suite:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Funções para gerenciar o diálogo de adição de caso de teste
  const handleOpenTestCaseDialog = () => {
    setTestCaseDialogOpen(true);
    setNewTestCase({
      name: '',
      description: '',
      steps: [],
      expectedResults: '',
      prerequisites: [],
      priority: 'medium'
    });
  };

  const handleCloseTestCaseDialog = () => {
    setTestCaseDialogOpen(false);
  };

  const handleTestCaseChange = (e) => {
    const { name, value } = e.target;
    setNewTestCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStep = () => {
    if (currentStep.trim()) {
      setNewTestCase(prev => ({
        ...prev,
        steps: [...prev.steps, currentStep.trim()]
      }));
      setCurrentStep('');
    }
  };

  const handleRemoveStep = (index) => {
    setNewTestCase(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleAddPrerequisite = () => {
    if (currentPrerequisite.trim()) {
      setNewTestCase(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, currentPrerequisite.trim()]
      }));
      setCurrentPrerequisite('');
    }
  };

  const handleRemovePrerequisite = (index) => {
    setNewTestCase(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const handleSaveTestCase = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validações
      if (!newTestCase.name.trim()) {
        throw new Error('O nome do caso de teste é obrigatório');
      }

      // Preparar o caso de teste para salvar
      const testCaseData = {
        name: newTestCase.name,
        description: newTestCase.description,
        steps: newTestCase.steps,
        expectedResults: newTestCase.expectedResults,
        prerequisites: newTestCase.prerequisites,
        priority: newTestCase.priority,
        status: 'active'
      };

      // Salvar o caso de teste
      const response = await testSuiteService.createTestCase(suiteId, testCaseData);
      
      // Atualizar o estado da suíte com o novo caso de teste
      setSuite(response.data);
      
      // Fechar o diálogo
      handleCloseTestCaseDialog();
      
      // Mostrar mensagem de sucesso
      setSuccess('Caso de teste adicionado com sucesso!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao adicionar caso de teste:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm('Tem certeza que deseja excluir este caso de teste?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await testSuiteService.removeTestCase(suiteId, testCaseId);
      
      // Recarregar a suíte para atualizar a lista de casos de teste
      const { data } = await testSuiteService.getTestSuiteById(suiteId);
      setSuite(data);
      
      setSuccess('Caso de teste excluído com sucesso!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao excluir caso de teste:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !suite) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              Voltar para o Projeto
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Editar Suite de Teste
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate(`/projects/${projectId}/suites/${suiteId}`)}
        >
          Cancelar
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {typeof success === 'string' ? success : 'Suite de teste atualizada com sucesso!'}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Detalhes da Suite" />
          <Tab label="Casos de Teste" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nome da Suite"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descrição"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={saving}
                    sx={{ ml: 2 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Casos de Teste
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenTestCaseDialog}
          >
            Adicionar Caso de Teste
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          {suite?.testCases?.length > 0 ? (
            <List>
              {suite.testCases.map((testCase, index) => (
                <ListItem
                  key={testCase.id || index}
                  divider={index < suite.testCases.length - 1}
                >
                  <ListItemText
                    primary={testCase.name || testCase.title}
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          Prioridade: {testCase.priority || 'Média'}
                        </Typography>
                        {testCase.description && (
                          <Typography variant="body2" color="text.secondary">
                            {testCase.description.substring(0, 100)}
                            {testCase.description.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteTestCase(testCase.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                Nenhum caso de teste adicionado
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenTestCaseDialog}
                sx={{ mt: 2 }}
              >
                Adicionar Primeiro Caso de Teste
              </Button>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Diálogo para adicionar caso de teste */}
      <Dialog
        open={testCaseDialogOpen}
        onClose={handleCloseTestCaseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adicionar Caso de Teste
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nome do Caso de Teste"
                value={newTestCase.name}
                onChange={handleTestCaseChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  name="priority"
                  value={newTestCase.priority}
                  onChange={handleTestCaseChange}
                  label="Prioridade"
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descrição"
                value={newTestCase.description}
                onChange={handleTestCaseChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Pré-requisitos
              </Typography>
              <Box display="flex" mb={2}>
                <TextField
                  value={currentPrerequisite}
                  onChange={(e) => setCurrentPrerequisite(e.target.value)}
                  label="Novo pré-requisito"
                  fullWidth
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddPrerequisite}
                  disabled={!currentPrerequisite.trim()}
                  sx={{ ml: 1 }}
                >
                  Adicionar
                </Button>
              </Box>
              
              {newTestCase.prerequisites.length > 0 ? (
                <List dense>
                  {newTestCase.prerequisites.map((prereq, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={prereq} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemovePrerequisite(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum pré-requisito adicionado
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Passos
              </Typography>
              <Box display="flex" mb={2}>
                <TextField
                  value={currentStep}
                  onChange={(e) => setCurrentStep(e.target.value)}
                  label="Novo passo"
                  fullWidth
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddStep}
                  disabled={!currentStep.trim()}
                  sx={{ ml: 1 }}
                >
                  Adicionar
                </Button>
              </Box>
              
              {newTestCase.steps.length > 0 ? (
                <List dense>
                  {newTestCase.steps.map((step, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`${index + 1}. ${step}`} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveStep(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum passo adicionado
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="expectedResults"
                label="Resultado Esperado"
                value={newTestCase.expectedResults}
                onChange={handleTestCaseChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestCaseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTestCase}
            variant="contained"
            color="primary"
            disabled={saving || !newTestCase.name.trim()}
          >
            {saving ? <CircularProgress size={24} /> : 'Salvar Caso de Teste'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestSuiteEdit; 
 