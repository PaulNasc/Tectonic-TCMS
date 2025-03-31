import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import {
  CheckCircleOutline as PassedIcon,
  ErrorOutline as FailedIcon,
  HelpOutline as UncoveredIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { traceabilityService } from '../services/traceabilityService';
import { useTheme } from '@mui/material/styles';

// Componente para visualização de estatísticas em formato de cartão
const StatCard = ({ title, value, description, icon, color }) => {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: `4px solid ${color}`,
        boxShadow: `0 0 10px rgba(0, 0, 0, 0.1)`,
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 5px 15px rgba(0, 0, 0, 0.2)`,
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Componente para visualização de porcentagem em formato circular
const CircularProgressWithLabel = ({ value, size = 100, thickness = 5, color }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        sx={{ color }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

// Componente principal do Dashboard de Cobertura
const CoverageDashboard = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverageStats, setCoverageStats] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar estatísticas de cobertura
        const { data: stats, error: statsError } = await traceabilityService.getRequirementsCoverage(projectId);
        
        if (statsError) {
          throw new Error(statsError);
        }
        
        setCoverageStats(stats);
        
        // Carregar matriz de rastreabilidade para dados adicionais
        const { data: matrixData, error: matrixError } = await traceabilityService.buildTraceabilityMatrix(projectId);
        
        if (matrixError) {
          console.warn('Erro ao carregar matriz de rastreabilidade:', matrixError);
        } else {
          setMatrix(matrixData || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de cobertura:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Função para encontrar requisitos sem cobertura de testes
  const getUncoveredRequirements = () => {
    if (!matrix || matrix.length === 0) return [];
    return matrix
      .filter(item => item.linkedTestCases.length === 0)
      .map(item => item.requirement)
      .slice(0, 5); // Limitar a 5 para não sobrecarregar a UI
  };

  // Função para identificar os requisitos críticos com falhas
  const getCriticalRequirementsWithFailures = () => {
    if (!matrix || matrix.length === 0) return [];
    
    return matrix
      .filter(item => 
        (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
        item.executionSummary.failed > 0
      )
      .map(item => ({
        requirement: item.requirement,
        failedTests: item.executionSummary.failed
      }))
      .slice(0, 5); // Limitar a 5 para não sobrecarregar a UI
  };
  
  if (loading) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando dados de cobertura...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!coverageStats) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Não foi possível carregar os dados de cobertura. Tente novamente mais tarde.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard de Cobertura de Requisitos
      </Typography>
      
      <Box mb={4}>
        <Grid container spacing={3}>
          {/* Cartão de estatísticas para total de requisitos */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total de Requisitos"
              value={coverageStats.totalRequirements}
              description="Número total de requisitos cadastrados"
              icon={<ChartIcon />}
              color={theme.palette.primary.main}
            />
          </Grid>
          
          {/* Cartão de estatísticas para requisitos cobertos */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Requisitos Cobertos"
              value={`${coverageStats.coveredRequirements} (${Math.round(coverageStats.coveragePercent)}%)`}
              description="Requisitos com pelo menos um caso de teste"
              icon={<PassedIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
          
          {/* Cartão de estatísticas para taxa de aprovação */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Taxa de Aprovação"
              value={`${Math.round(coverageStats.passRate)}%`}
              description="Requisitos com todos os testes aprovados"
              icon={<PassedIcon />}
              color={coverageStats.passRate > 70 ? theme.palette.success.main : theme.palette.warning.main}
            />
          </Grid>
          
          {/* Cartão de estatísticas para requisitos sem cobertura */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sem Cobertura"
              value={coverageStats.totalRequirements - coverageStats.coveredRequirements}
              description="Requisitos sem casos de teste vinculados"
              icon={<UncoveredIcon />}
              color={theme.palette.error.main}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>
        Cobertura por Prioridade
      </Typography>
      
      <Box mb={4}>
        <Grid container spacing={3}>
          {Object.entries(coverageStats.priorityCoverage).map(([priority, data]) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={priority}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Prioridade: {priority}
                </Typography>
                
                <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgressWithLabel 
                    value={data.coveragePercent} 
                    color={data.coveragePercent > 70 
                      ? theme.palette.success.main 
                      : data.coveragePercent > 40 
                        ? theme.palette.warning.main 
                        : theme.palette.error.main}
                  />
                </Box>
                
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="body2" align="center">
                    {data.covered} de {data.total} requisitos cobertos
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary">
                    {data.passed} requisitos com testes aprovados
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Divider sx={{ my: 4 }} />
      
      <Grid container spacing={3}>
        {/* Lista de requisitos sem cobertura */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom color="error">
              Requisitos sem Cobertura de Testes
            </Typography>
            
            {getUncoveredRequirements().length > 0 ? (
              <List>
                {getUncoveredRequirements().map(req => (
                  <ListItem key={req.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {req.code} - {req.name}
                          </Typography>
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
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={req.description}
                    />
                  </ListItem>
                ))}
                
                {coverageStats.totalRequirements - coverageStats.coveredRequirements > 5 && (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    E mais {(coverageStats.totalRequirements - coverageStats.coveredRequirements - 5)} requisitos sem cobertura
                  </Typography>
                )}
              </List>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                Todos os requisitos possuem cobertura de testes. Muito bem!
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Lista de requisitos críticos com falhas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom color="error">
              Requisitos Críticos com Falhas
            </Typography>
            
            {getCriticalRequirementsWithFailures().length > 0 ? (
              <List>
                {getCriticalRequirementsWithFailures().map(item => (
                  <ListItem key={item.requirement.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {item.requirement.code} - {item.requirement.name}
                          </Typography>
                          <Chip 
                            label={item.requirement.priority} 
                            size="small" 
                            color="error"
                            sx={{ ml: 1 }}
                          />
                          <Chip 
                            icon={<FailedIcon />}
                            label={`${item.failedTests} falhas`} 
                            size="small" 
                            color="error"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={item.requirement.description}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                Não há requisitos críticos com falhas de teste. Excelente!
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          startIcon={<ChartIcon />}
          onClick={() => window.print()}
        >
          Exportar Relatório
        </Button>
      </Box>
    </Box>
  );
};

export default CoverageDashboard; 