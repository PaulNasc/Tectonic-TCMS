import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { testPlanService } from '../../services/testPlanService';
import { testExecutionService } from '../../services/testExecutionService';

const NeonPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 160, 252, 0.2)',
  boxShadow: '0 0 20px rgba(0, 160, 252, 0.1)',
}));

const NeonButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00a0fc 30%, #33b3fd 90%)',
  border: 0,
  color: 'white',
  height: 48,
  padding: '0 30px',
  boxShadow: '0 3px 5px 2px rgba(0, 160, 252, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #0070b0 30%, #00a0fc 90%)',
    boxShadow: '0 5px 8px 3px rgba(0, 160, 252, .4)',
  },
}));

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor: status === 'passed'
    ? 'rgba(76, 175, 80, 0.2)'
    : status === 'failed'
    ? 'rgba(244, 67, 54, 0.2)'
    : status === 'blocked'
    ? 'rgba(255, 152, 0, 0.2)'
    : 'rgba(158, 158, 158, 0.2)',
  color: status === 'passed'
    ? '#4caf50'
    : status === 'failed'
    ? '#f44336'
    : status === 'blocked'
    ? '#ff9800'
    : '#9e9e9e',
  border: `1px solid ${
    status === 'passed'
      ? 'rgba(76, 175, 80, 0.3)'
      : status === 'failed'
      ? 'rgba(244, 67, 54, 0.3)'
      : status === 'blocked'
      ? 'rgba(255, 152, 0, 0.3)'
      : 'rgba(158, 158, 158, 0.3)'
  }`,
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 160, 252, 0.2)',
  boxShadow: '0 0 20px rgba(0, 160, 252, 0.1)',
}));

const TestReport = ({ testPlanId }) => {
  const [testPlan, setTestPlan] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [testPlanId]);

  const loadData = async () => {
    try {
      const [planData, executionsData] = await Promise.all([
        testPlanService.getTestPlan(testPlanId),
        testExecutionService.getTestExecutions(testPlanId),
      ]);

      setTestPlan(planData);
      setExecutions(executionsData);
    } catch (error) {
      setError('Erro ao carregar dados do relatório');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!executions.length) return null;

    const totalExecutions = executions.length;
    const totalTestCases = testPlan?.testCases.length || 0;
    const totalResults = executions.reduce((acc, exec) => {
      acc[exec.status] = (acc[exec.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalExecutions,
      totalTestCases,
      passed: totalResults.passed || 0,
      failed: totalResults.failed || 0,
      blocked: totalResults.blocked || 0,
      successRate: ((totalResults.passed || 0) / totalExecutions) * 100,
    };
  };

  const handleDownloadReport = () => {
    // Implementar a lógica de download do relatório
    console.log('Download report');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress sx={{ color: '#00a0fc' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#f44336' }}>{error}</Typography>
      </Box>
    );
  }

  const stats = calculateStats();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ color: '#00a0fc', textShadow: '0 0 10px rgba(0, 160, 252, 0.5)' }}
        >
          Relatório de Testes: {testPlan?.title}
        </Typography>
        <NeonButton
          startIcon={<DownloadIcon />}
          onClick={handleDownloadReport}
        >
          Download Relatório
        </NeonButton>
      </Box>

      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <Typography variant="h6" sx={{ color: '#00a0fc', mb: 1 }}>
                Total de Execuções
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffffff' }}>
                {stats.totalExecutions}
              </Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <Typography variant="h6" sx={{ color: '#00a0fc', mb: 1 }}>
                Taxa de Sucesso
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffffff' }}>
                {stats.successRate.toFixed(1)}%
              </Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <Typography variant="h6" sx={{ color: '#00a0fc', mb: 1 }}>
                Casos de Teste
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffffff' }}>
                {stats.totalTestCases}
              </Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <Typography variant="h6" sx={{ color: '#00a0fc', mb: 1 }}>
                Status Atual
              </Typography>
              <StatusChip
                label={testPlan?.status === 'completed' ? 'Concluído' : 'Em Progresso'}
                status={testPlan?.status === 'completed' ? 'passed' : 'in_progress'}
                size="small"
              />
            </StatCard>
          </Grid>
        </Grid>
      )}

      <NeonPaper elevation={3}>
        <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
          Histórico de Execuções
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#00a0fc' }}>Data</TableCell>
                <TableCell sx={{ color: '#00a0fc' }}>Status</TableCell>
                <TableCell sx={{ color: '#00a0fc' }}>Passaram</TableCell>
                <TableCell sx={{ color: '#00a0fc' }}>Falharam</TableCell>
                <TableCell sx={{ color: '#00a0fc' }}>Bloqueados</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell sx={{ color: '#ffffff' }}>
                    {new Date(execution.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={
                        execution.status === 'passed'
                          ? 'Passou'
                          : execution.status === 'failed'
                          ? 'Falhou'
                          : execution.status === 'blocked'
                          ? 'Bloqueado'
                          : 'Em Progresso'
                      }
                      status={execution.status}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#4caf50' }}>
                    {execution.passed_count || 0}
                  </TableCell>
                  <TableCell sx={{ color: '#f44336' }}>
                    {execution.failed_count || 0}
                  </TableCell>
                  <TableCell sx={{ color: '#ff9800' }}>
                    {execution.blocked_count || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </NeonPaper>
    </Box>
  );
};

export default TestReport; 