import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import * as testService from '../services/testService';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StyledTableContainer = styled(TableContainer)`
  & .MuiTableCell-root {
    color: var(--text-primary);
  }
  & .MuiTableRow-root:hover {
    background-color: var(--hover-bg);
  }
`;

const StatusChip = styled(Chip)`
  &.success {
    background-color: var(--success-bg);
    color: var(--success-text);
  }
  &.error {
    background-color: var(--error-bg);
    color: var(--error-text);
  }
  &.warning {
    background-color: var(--warning-bg);
    color: var(--warning-text);
  }
  &.info {
    background-color: var(--info-bg);
    color: var(--info-text);
  }
`;

const ExecutionDetails = styled(Paper)`
  padding: 24px;
  margin-top: 24px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  borderRadius: theme.shape.borderRadius
}));

const TestExecution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executionStatus, setExecutionStatus] = useState('');
  const [observations, setObservations] = useState('');
  const [executing, setExecuting] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Memoize test data transformations
  const formattedTest = useMemo(() => {
    if (!test) return null;
    return {
      ...test,
      formattedDate: new Date(test.createdAt).toLocaleDateString(),
      lastRunFormatted: test.lastRun ? new Date(test.lastRun).toLocaleDateString() : 'Nunca executado'
    };
  }, [test]);

  // Validate user permissions
  useEffect(() => {
    if (!currentUser || !hasPermission('executeTests')) {
      setError('Você não tem permissão para executar testes');
      navigate('/tests');
    }
  }, [currentUser, hasPermission, navigate]);

  const loadTest = useCallback(async () => {
      try {
        setLoading(true);
        const response = await testService.getTestCaseById(id);
        if (response.error) {
          throw new Error(response.error);
        }
        setTest(response.data);
      } catch (err) {
      setSnackbar({
        open: true,
        message: `Erro ao carregar teste: ${err.message}`,
        severity: 'error'
      });
      } finally {
        setLoading(false);
      }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id, loadTest]);

  const validateExecution = () => {
    const errors = [];
    if (!executionStatus) {
      errors.push('Status da execução é obrigatório');
    }
    if (executionStatus === 'Falhou' && !observations) {
      errors.push('Observações são obrigatórias quando o teste falha');
    }
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateExecution();
    if (validationErrors.length > 0) {
      setSnackbar({
        open: true,
        message: validationErrors.join('. '),
        severity: 'error'
      });
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      const executionData = {
        testId: id,
        status: executionStatus,
        observations,
        executedBy: {
          id: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email
        },
        executedAt: new Date().toISOString()
      };

      const response = await testService.createTestExecution(executionData);
      if (response.error) {
        throw new Error(response.error);
      }

      setSnackbar({
        open: true,
        message: 'Execução registrada com sucesso!',
        severity: 'success'
      });

      setTimeout(() => {
      navigate('/tests');
      }, 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Erro ao salvar execução: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleViewHistory = async (test) => {
    try {
      const { data, error } = await testService.getTestExecutions(test.id);
      if (error) throw error;
      
      setSelectedTest({ ...test, executions: data });
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setError('Erro ao carregar histórico');
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
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!test) {
    return (
      <Box m={2}>
        <Alert severity="warning">Teste não encontrado</Alert>
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
    <Container>
      <StyledPaper>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Execução de Teste - {test.sequentialId}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {test.name}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip label={`Tipo: ${test.type}`} color="primary" variant="outlined" />
              <Chip label={`Prioridade: ${test.priority}`} color="secondary" variant="outlined" />
              <Chip label={`Status: ${test.status}`} color="default" variant="outlined" />
            </Box>
            <Typography variant="body1" paragraph>
              {test.description}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Responsável: {test.createdBy?.name || 'Não definido'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                  Criado em: {formattedTest.formattedDate}
            </Typography>
                {formattedTest.lastRunFormatted !== 'Nunca executado' && (
              <Typography variant="subtitle1" gutterBottom>
                    Última execução: {formattedTest.lastRunFormatted}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Pré-requisitos
            </Typography>
            <List>
              {test.prerequisites?.map((prereq, index) => (
                <ListItem key={index}>
                  <ListItemText primary={prereq} />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Passos
            </Typography>
            <List>
              {test.steps?.map((step, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`${index + 1}. ${step}`}
                    secondary={test.expectedResults?.[index]}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Resultado da Execução
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status da Execução</InputLabel>
              <Select
                value={executionStatus}
                onChange={(e) => setExecutionStatus(e.target.value)}
                label="Status da Execução"
              >
                <MenuItem value="Passou">Passou</MenuItem>
                <MenuItem value="Falhou">Falhou</MenuItem>
                <MenuItem value="Bloqueado">Bloqueado</MenuItem>
                <MenuItem value="Não Executado">Não Executado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              margin="normal"
              label="Observações"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />

            <Box mt={3} display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={executing}
              >
                {executing ? 'Salvando...' : 'Salvar Execução'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/tests')}
                disabled={executing}
              >
                Cancelar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </StyledPaper>

      {/* Diálogo de Histórico */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--card-bg)',
            color: 'var(--text-primary)'
          }
        }}
      >
        <DialogTitle>
          Histórico de Execuções: {selectedTest?.name}
          <IconButton
            onClick={() => setHistoryDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'var(--text-secondary)'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Executado por</TableCell>
                <TableCell>Observações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedTest?.executions?.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    {new Date(execution.executedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={execution.status}
                      color={execution.status === 'Passou' ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{execution.executedBy.name}</TableCell>
                  <TableCell>{execution.observations}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

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
    </Container>
      </motion.div>
    </AnimatePresence>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(TestExecution); 