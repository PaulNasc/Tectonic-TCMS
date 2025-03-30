import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material';
import { 
  Edit as EditIcon, 
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { testSuiteService } from '../services/testSuiteService';
import LoadingScreen from '../components/LoadingScreen';
import { formatDate } from '../utils/dateUtils';
import TestCommentSection from '../components/test/TestCommentSection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function TestSuiteView() {
  const { projectId, suiteId } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionDetailsOpen, setExecutionDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [executionToDelete, setExecutionToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const loadSuite = async () => {
      try {
        console.log('Carregando suite:', suiteId);
        setLoading(true);
        setError(null);

        const { data, error } = await testSuiteService.getTestSuiteById(suiteId);
        
        if (error) {
          console.error('Erro ao carregar suite:', error);
          setError(error);
          return;
        }

        if (!data) {
          console.error('Suite não encontrada');
          setError('Suite de teste não encontrada');
          return;
        }

        // Garantir que temos execuções carregadas
        if (data.executions && data.executions.length > 0) {
          // Quando temos apenas IDs de execuções, vamos carregar os detalhes completos
          const loadedExecutions = [];
          for (const execId of data.executions) {
            try {
              // Carregar dados da execução se for apenas um ID
              if (typeof execId === 'string') {
                const executionRef = doc(db, 'testExecutions', execId);
                const executionDoc = await getDoc(executionRef);
                
                if (executionDoc.exists()) {
                  const executionData = executionDoc.data();
                  loadedExecutions.push({
                    id: execId,
                    ...executionData,
                    executedAt: executionData.executedAt?.toDate?.() || executionData.executedAt,
                    passed: executionData.summary?.passed || 0,
                    total: executionData.summary?.total || 0
                  });
                }
              } else {
                // Já é um objeto de execução
                loadedExecutions.push(execId);
              }
            } catch (err) {
              console.error(`Erro ao carregar execução ${execId}:`, err);
            }
          }
          
          data.executions = loadedExecutions;
        }

        console.log('Suite carregada com execuções:', data);
        setSuite(data);
      } catch (err) {
        console.error('Erro inesperado ao carregar suite:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId) {
      loadSuite();
    }
  }, [suiteId]);

  const handleEdit = () => {
    navigate(`/projects/${projectId}/suites/${suiteId}/edit`);
  };

  const handleExecute = () => {
    navigate(`/projects/${projectId}/suites/${suiteId}/execute`);
  };

  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusIcon = (status) => {
    if (status === 'Passou' || status === 'passed') return <CheckCircleIcon color="success" />;
    if (status === 'Falhou' || status === 'failed') return <ErrorIcon color="error" />;
    return <WarningIcon color="warning" />;
  };

  const getPassRateColor = (rate) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  const handleViewExecutionDetails = (execution) => {
    setSelectedExecution(execution);
    setExecutionDetailsOpen(true);
  };

  const handleCloseExecutionDetails = () => {
    setExecutionDetailsOpen(false);
    setSelectedExecution(null);
  };

  const handleOpenDeleteConfirmation = (execution) => {
    setExecutionToDelete(execution);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmOpen(false);
    setExecutionToDelete(null);
  };

  const handleDeleteExecution = async () => {
    if (!executionToDelete) return;
    
    try {
      setActionLoading(true);
      setError(null);
      
      const { success, error: deleteError } = await testSuiteService.deleteExecution(suiteId, executionToDelete.id);
      
      if (deleteError) {
        throw new Error(deleteError);
      }
      
      // Recarregar a suíte para obter dados atualizados
      const { data, error: loadError } = await testSuiteService.getTestSuiteById(suiteId);
      
      if (loadError) {
        throw new Error(loadError);
      }
      
      // Atualizar o estado da suite
      setSuite(data);
      
      // Fechar o diálogo
      handleCloseDeleteConfirmation();
      
      // Mostrar mensagem de sucesso
      setSnackbar({
        open: true,
        message: 'Execução excluída com sucesso',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir execução:', err);
      setSnackbar({
        open: true,
        message: 'Falha ao excluir execução: ' + err.message,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({...snackbar, open: false});
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" onClick={handleBackToProject}>
            Voltar ao Projeto
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!suite) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" action={
          <Button color="inherit" onClick={handleBackToProject}>
            Voltar ao Projeto
          </Button>
        }>
          Suite de teste não encontrada
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {suite.name}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            Editar
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PlayArrowIcon />} 
            onClick={handleExecute}
          >
            Executar
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {suite.description}
      </Typography>

      {/* Estatísticas da suite */}
      <Box mb={4} mt={4}>
        <Typography variant="h6" gutterBottom>
          Estatísticas
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total de Casos
              </Typography>
              <Typography variant="h5">
                {suite.testCases?.length || 0}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Execuções
              </Typography>
              <Typography variant="h5">
                {suite.statistics?.totalExecutions || 0}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Taxa de Sucesso
              </Typography>
              <Typography variant="h5">
                <Chip 
                  label={`${suite.statistics?.passRate?.toFixed(0) || 0}%`} 
                  color={getPassRateColor(suite.statistics?.passRate || 0)}
                />
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Última Execução
              </Typography>
              <Typography variant="h5">
                {suite.statistics?.lastExecutionDate ? formatDate(suite.statistics.lastExecutionDate) : 'Nenhuma'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Lista de casos de teste */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Casos de Teste ({suite.testCases?.length || 0})
        </Typography>

        {suite.testCases?.length > 0 ? (
          <TableContainer component={Paper}>
            <Table aria-label="casos de teste">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suite.testCases.map((testCase, index) => (
                  <TableRow key={testCase.id || index}>
                    <TableCell component="th" scope="row">
                      {testCase.name || testCase.title}
                    </TableCell>
                    <TableCell>{testCase.description}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={testCase.priority || 'Média'} 
                        color={testCase.priority === 'Alta' ? 'error' : testCase.priority === 'Baixa' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {testCase.lastExecution ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(testCase.lastExecution.status)}
                          {testCase.lastExecution.status}
                        </Box>
                      ) : 'Não executado'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nenhum caso de teste cadastrado
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate(`/projects/${projectId}/suites/${suiteId}/edit?action=addTestCase`)}
              startIcon={<EditIcon />}
              sx={{ mt: 2 }}
            >
              Adicionar Casos de Teste
            </Button>
          </Paper>
        )}
      </Box>

      {/* Histórico de Execuções */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Histórico de Execuções
        </Typography>

        {suite.executions?.length > 0 ? (
          <TableContainer component={Paper}>
            <Table aria-label="histórico de execuções">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Executado por</TableCell>
                  <TableCell>Ambiente</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suite.executions.map((execution, index) => (
                  <TableRow key={execution.id || index}>
                    <TableCell>{formatDate(execution.executedAt)}</TableCell>
                    <TableCell>{execution.executedBy?.name || 'Sistema'}</TableCell>
                    <TableCell>{execution.environment}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {execution.passed}/{execution.total} testes
                        <Chip 
                          size="small" 
                          label={`${(execution.passed / execution.total * 100).toFixed(0)}%`}
                          color={getPassRateColor(execution.passed / execution.total * 100)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button 
                          size="small" 
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewExecutionDetails(execution)}
                        >
                          Detalhes
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDeleteConfirmation(execution)}
                        >
                          Excluir
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nenhuma execução registrada
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleExecute} 
              sx={{ mt: 2 }}
            >
              Executar Suite
            </Button>
          </Paper>
        )}
      </Box>

      {/* Seção de Comentários */}
      <Box sx={{ mt: 4 }}>
        <TestCommentSection testCaseId={suiteId} projectId={projectId} />
      </Box>

      {/* Diálogo de detalhes da execução */}
      <Dialog
        open={executionDetailsOpen}
        onClose={handleCloseExecutionDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Execução
          <IconButton
            onClick={handleCloseExecutionDetails}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedExecution && (
            <Box>
              <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
                <Typography variant="body1">
                  <strong>Data:</strong> {formatDate(selectedExecution.executedAt)}
                </Typography>
                <Typography variant="body1">
                  <strong>Ambiente:</strong> {selectedExecution.environment}
                </Typography>
                <Typography variant="body1">
                  <strong>Executado por:</strong> {selectedExecution.executedBy?.name || 'Sistema'}
                </Typography>
              </Box>
              
              {selectedExecution.notes && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Notas:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedExecution.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Typography variant="subtitle1" gutterBottom>
                Resultados dos Testes:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Caso de Teste</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Observações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedExecution.testResults?.map((result, idx) => {
                      const testCase = suite.testCases?.find(tc => tc.id === result.testId) || {};
                      return (
                        <TableRow key={idx}>
                          <TableCell>{testCase.name || testCase.title || 'Teste desconhecido'}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(result.status)}
                              {result.status === 'passed' ? 'Passou' : 
                               result.status === 'failed' ? 'Falhou' : 
                               result.status === 'blocked' ? 'Bloqueado' : 'Pulado'}
                            </Box>
                          </TableCell>
                          <TableCell>{result.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                <Typography variant="subtitle1">
                  Resumo:
                </Typography>
                <Chip 
                  label={`Passou: ${selectedExecution.summary?.passed || 0}/${selectedExecution.summary?.total || 0}`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  label={`Falhou: ${selectedExecution.summary?.failed || 0}/${selectedExecution.summary?.total || 0}`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  label={`Bloqueado: ${selectedExecution.summary?.blocked || 0}/${selectedExecution.summary?.total || 0}`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExecutionDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirmation}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta execução? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirmation} disabled={actionLoading}>Cancelar</Button>
          <Button 
            onClick={handleDeleteExecution} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 