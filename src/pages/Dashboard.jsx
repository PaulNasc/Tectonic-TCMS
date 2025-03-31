import React, { useState, useEffect } from 'react';
import { 
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getTestStatistics } from '../services/testService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative'
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.primary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}));

const getStatusColor = (status) => {
  const colors = {
    'Passou': 'success',
    'Falhou': 'error',
    'Bloqueado': 'warning',
    'Não Executado': 'info',
    'Pendente': 'default'
  };
  return colors[status] || 'default';
};

const getPriorityColor = (priority) => {
  const colors = {
    'Alta': 'error',
    'Média': 'warning',
    'Baixa': 'info'
  };
  return colors[priority] || 'default';
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Verificar se o usuário é admin@hybex
  const isAdminHybex = user?.email === 'admin@hybex';

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const response = await getTestStatistics();
        if (response.error) {
          throw new Error(response.error);
        }
        setStats(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

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

  const successRate = stats.totalExecutions > 0
    ? ((stats.statusCounts.Passou / stats.totalExecutions) * 100).toFixed(1)
    : 0;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Acesso direto à área administrativa para admin@hybex */}
      {isAdminHybex && (
        <Box mb={3} p={2} sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.main'
        }}>
          <Typography variant="h6" gutterBottom>
            <AdminIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Acesso Administrativo
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Como usuário administrador (admin@hybex), você tem acesso à área de gerenciamento do sistema.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/admin')}
            startIcon={<AdminIcon />}
          >
            Acessar Página de Administração
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Total de Testes */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={2}>
            <Typography variant="h6" color="textSecondary">
              Total de Testes
            </Typography>
            <Typography variant="h3">
              {stats.totalTests}
            </Typography>
          </StatCard>
        </Grid>

        {/* Total de Execuções */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={2}>
            <Typography variant="h6" color="textSecondary">
              Total de Execuções
            </Typography>
            <Typography variant="h3">
              {stats.totalExecutions}
            </Typography>
          </StatCard>
        </Grid>

        {/* Taxa de Sucesso */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={2}>
            <Typography variant="h6" color="textSecondary">
              Taxa de Sucesso
            </Typography>
            <Typography variant="h3">
              {successRate}%
            </Typography>
          </StatCard>
        </Grid>

        {/* Testes Pendentes */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard elevation={2}>
            <Typography variant="h6" color="textSecondary">
              Testes Pendentes
            </Typography>
            <Typography variant="h3">
              {stats.statusCounts.Pendente || 0}
            </Typography>
          </StatCard>
        </Grid>

        {/* Status dos Testes */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Status dos Testes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                    <TableCell align="right">Porcentagem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.statusCounts).map(([status, count]) => (
                    <TableRow key={status}>
                      <TableCell>
                        <Chip
                          label={status}
                          color={getStatusColor(status)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {((count / stats.totalTests) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
        </Grid>

        {/* Prioridade dos Testes */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Prioridade dos Testes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Prioridade</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                    <TableCell align="right">Porcentagem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.priorityCounts).map(([priority, count]) => (
                    <TableRow key={priority}>
                      <TableCell>
                        <Chip
                          label={priority}
                          color={getPriorityColor(priority)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {((count / stats.totalTests) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
          </Grid>

        {/* Execuções Recentes */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Execuções Recentes
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Executado por</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentExecutions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>{execution.testId}</TableCell>
                      <TableCell>
                        <Chip
                          label={execution.status}
                          color={getStatusColor(execution.status)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{execution.executedBy.name}</TableCell>
                      <TableCell>
                        {new Date(execution.executedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 