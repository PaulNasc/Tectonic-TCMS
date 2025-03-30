import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { testSuiteService } from '../services/testSuiteService';
import { useAuth } from '../contexts/AuthContext';

const TestSuiteExecute = () => {
  const { projectId, suiteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [executions, setExecutions] = useState({});
  const [environment, setEnvironment] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');

  useEffect(() => {
    const loadSuite = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Carregando suite para execução:', suiteId);

        const { data, error } = await testSuiteService.getTestSuiteById(suiteId);
        
        if (error) {
          throw new Error(error);
        }

        if (!data) {
          throw new Error('Suite de teste não encontrada');
        }

        console.log('Suite carregada:', data);
        setSuite(data);
        
        // Inicializar o estado de execuções
        const initialExecutions = {};
        data.testCases?.forEach(tc => {
          initialExecutions[tc.id] = {
            status: 'Pendente',
            notes: '',
            evidence: '',
            executedBy: user.id,
            executedAt: null
          };
        });
        setExecutions(initialExecutions);
      } catch (err) {
        console.error('Erro ao carregar suite:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId && user) {
      loadSuite();
    }
  }, [suiteId, user]);

  const handleStatusChange = (testCaseId, status) => {
    setExecutions(prev => ({
      ...prev,
      [testCaseId]: {
        ...prev[testCaseId],
        status,
        executedAt: new Date()
      }
    }));
  };

  const handleNotesChange = (testCaseId, notes) => {
    setExecutions(prev => ({
      ...prev,
      [testCaseId]: {
        ...prev[testCaseId],
        notes
      }
    }));
  };

  const handleNext = () => {
    if (activeTestCase < (suite?.testCases?.length || 0) - 1) {
      setActiveTestCase(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (activeTestCase > 0) {
      setActiveTestCase(prev => prev - 1);
    }
  };

  const handleFinishExecution = async () => {
    try {
      setExecuting(true);
      setError(null);
      
      // Validações
      if (!environment) {
        throw new Error('Selecione um ambiente para a execução');
      }
      
      // Verificar se todos os testes foram executados
      const pendingTests = Object.values(executions).filter(exec => exec.status === 'Pendente');
      if (pendingTests.length > 0) {
        throw new Error(`Existem ${pendingTests.length} testes pendentes de execução`);
      }
      
      // Mapear os resultados dos testes para o formato esperado pelo serviço
      const mappedResults = Object.entries(executions).map(([testId, execution]) => {
        // Mapear os status do frontend para os status esperados pelo backend
        const statusMap = {
          'Passou': 'passed',
          'Falhou': 'failed',
          'Bloqueado': 'blocked',
          'Pendente': 'skipped'
        };
        
        return {
          testId,
          status: statusMap[execution.status] || 'skipped',
          notes: execution.notes || '',
          evidence: execution.evidence || ''
        };
      });
      
      // Contar resultados para resumo
      const summary = {
        total: mappedResults.length,
        passed: mappedResults.filter(r => r.status === 'passed').length,
        failed: mappedResults.filter(r => r.status === 'failed').length,
        blocked: mappedResults.filter(r => r.status === 'blocked').length,
        skipped: mappedResults.filter(r => r.status === 'skipped').length
      };
      
      // Montar o resultado da execução
      const executionResult = {
        suiteId,
        projectId,
        environment,
        notes: executionNotes,
        executedBy: {
          id: user.id,
          name: user.name || user.email,
          email: user.email
        },
        executedAt: new Date(),
        testResults: mappedResults,
        status: 'completed',
        summary: summary,
        passed: summary.passed,
        total: summary.total
      };
      
      console.log('Finalizando execução:', executionResult);
      
      // Chamar o serviço para salvar a execução
      const { data, error: execError } = await testSuiteService.executeSuite(suiteId, executionResult);
      
      if (execError) {
        throw new Error(execError);
      }
      
      console.log('Execução finalizada com sucesso!', data);
      
      // Atualizar a suite com a nova execução
      const { data: updatedSuite } = await testSuiteService.getTestSuiteById(suiteId);
      setSuite(updatedSuite);
      
      // Mostrar mensagem de sucesso
      setError(null);
      
      // Redirecionar para a página da suite
      navigate(`/projects/${projectId}/suites/${suiteId}`);
      
    } catch (err) {
      console.error('Erro ao finalizar execução:', err);
      setError(err.message || 'Erro ao finalizar execução');
    } finally {
      setExecuting(false);
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

  const testCases = suite?.testCases || [];
  const currentTestCase = testCases[activeTestCase];
  const allTestsExecuted = Object.values(executions).every(exec => exec.status !== 'Pendente');
  
  const getStatusColor = (status) => {
    const colors = {
      'Pendente': 'info',
      'Passou': 'success',
      'Falhou': 'error',
      'Bloqueado': 'warning'
    };
    return colors[status] || 'default';
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Executar Suite: {suite?.name}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/projects/${projectId}/suites/${suiteId}`)}
            sx={{ mr: 1 }}
          >
            Ver Suite
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Cancelar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuração da Execução
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Ambiente</InputLabel>
                  <Select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    label="Ambiente"
                    required
                  >
                    <MenuItem value="Desenvolvimento">Desenvolvimento</MenuItem>
                    <MenuItem value="Teste">Teste</MenuItem>
                    <MenuItem value="Homologação">Homologação</MenuItem>
                    <MenuItem value="Produção">Produção</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <TextField
                label="Notas da Execução"
                multiline
                rows={2}
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                fullWidth
              />
            </Box>
          </Paper>

          {testCases.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Caso de Teste {activeTestCase + 1} de {testCases.length}
                </Typography>
                <Box>
                  <Button 
                    onClick={handlePrevious}
                    disabled={activeTestCase === 0}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 1 }}
                  >
                    Anterior
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={activeTestCase === testCases.length - 1}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Próximo
                  </Button>
                </Box>
              </Box>

              {currentTestCase && (
                <>
                  <Typography variant="h5" gutterBottom>
                    {currentTestCase.name}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {currentTestCase.description}
                  </Typography>
                  
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Pré-requisitos:
                    </Typography>
                    {currentTestCase.prerequisites && currentTestCase.prerequisites.length > 0 ? (
                      <List dense>
                        {currentTestCase.prerequisites.map((prereq, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={prereq} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nenhum pré-requisito definido
                      </Typography>
                    )}
                  </Box>
                  
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Passos:
                    </Typography>
                    {currentTestCase.steps && currentTestCase.steps.length > 0 ? (
                      <List>
                        {currentTestCase.steps.map((step, index) => (
                          <ListItem key={index}>
                            <ListItemText 
                              primary={`${index + 1}. ${step}`} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nenhum passo definido
                      </Typography>
                    )}
                  </Box>
                  
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Resultado Esperado:
                    </Typography>
                    <Typography variant="body1">
                      {currentTestCase.expectedResults || "Nenhum resultado esperado definido"}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Resultado da Execução:
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Button
                        variant={executions[currentTestCase.id]?.status === 'Passou' ? 'contained' : 'outlined'}
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleStatusChange(currentTestCase.id, 'Passou')}
                      >
                        Passou
                      </Button>
                      <Button
                        variant={executions[currentTestCase.id]?.status === 'Falhou' ? 'contained' : 'outlined'}
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleStatusChange(currentTestCase.id, 'Falhou')}
                      >
                        Falhou
                      </Button>
                      <Button
                        variant={executions[currentTestCase.id]?.status === 'Bloqueado' ? 'contained' : 'outlined'}
                        color="warning"
                        startIcon={<WarningIcon />}
                        onClick={() => handleStatusChange(currentTestCase.id, 'Bloqueado')}
                      >
                        Bloqueado
                      </Button>
                    </Box>
                    
                    <TextField
                      label="Observações"
                      multiline
                      rows={3}
                      value={executions[currentTestCase.id]?.notes || ''}
                      onChange={(e) => handleNotesChange(currentTestCase.id, e.target.value)}
                      fullWidth
                      margin="normal"
                    />
                  </Box>
                </>
              )}
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status da Execução
            </Typography>
            
            <List dense>
              {testCases.map((tc, index) => (
                <ListItem 
                  key={tc.id}
                  selected={index === activeTestCase}
                  button
                  onClick={() => setActiveTestCase(index)}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      color={getStatusColor(executions[tc.id]?.status)}
                    >
                      {executions[tc.id]?.status === 'Passou' && <CheckIcon />}
                      {executions[tc.id]?.status === 'Falhou' && <CloseIcon />}
                      {executions[tc.id]?.status === 'Bloqueado' && <WarningIcon />}
                      {executions[tc.id]?.status === 'Pendente' && <PlayArrowIcon />}
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={tc.name}
                    secondary={`Status: ${executions[tc.id]?.status}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={!allTestsExecuted || executing || !environment}
              onClick={handleFinishExecution}
              size="large"
              sx={{ mb: 2 }}
            >
              {executing ? <CircularProgress size={24} /> : 'Finalizar Execução'}
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate(`/projects/${projectId}/suites/${suiteId}`)}
            >
              Ver Suite
            </Button>
            
            {!allTestsExecuted && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Todos os testes precisam ser executados
              </Typography>
            )}
            
            {!environment && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Selecione um ambiente para a execução
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestSuiteExecute; 