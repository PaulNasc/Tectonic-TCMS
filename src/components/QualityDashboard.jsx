import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Button
} from '@mui/material';
import {
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
  BugReport as BugIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { reportService } from '../services/reportService';
import { traceabilityService } from '../services/traceabilityService';
import { projectService } from '../services/projectService';
import { useNavigate } from 'react-router-dom';

// Componente para exibir pontuação de qualidade
const QualityScore = ({ score, size = 'medium', label = true }) => {
  let color;
  let labelText;
  
  if (score >= 4.5) {
    color = 'success.main';
    labelText = 'Excelente';
  } else if (score >= 3.5) {
    color = 'info.main';
    labelText = 'Bom';
  } else if (score >= 2.5) {
    color = 'warning.main';
    labelText = 'Regular';
  } else if (score >= 1.5) {
    color = 'orange';
    labelText = 'Insuficiente';
  } else {
    color = 'error.main';
    labelText = 'Crítico';
  }
  
  const dimensions = {
    small: { width: 60, height: 60, fontSize: '1.2rem' },
    medium: { width: 100, height: 100, fontSize: '2rem' },
    large: { width: 140, height: 140, fontSize: '2.5rem' }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ 
        width: dimensions[size].width, 
        height: dimensions[size].height, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.paper',
        border: '6px solid',
        borderColor: color
      }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: dimensions[size].fontSize }}>
          {score.toFixed(1)}
        </Typography>
      </Box>
      {label && (
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          {labelText}
        </Typography>
      )}
    </Box>
  );
};

// Componente para exibir progresso de métricas
const MetricProgress = ({ value, label, color, target = 100 }) => {
  // Determinar cor baseada no valor se não for explícita
  const progressColor = color || 
    (value >= 80 ? 'success.main' : 
     value >= 60 ? 'info.main' : 
     value >= 40 ? 'warning.main' : 
     'error.main');
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="medium">{Math.round(value)}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={Math.min(100, (value / target) * 100)}
        sx={{ 
          height: 8, 
          borderRadius: 5,
          backgroundColor: 'action.disabledBackground',
          '& .MuiLinearProgress-bar': {
            backgroundColor: progressColor
          }
        }}
      />
    </Box>
  );
};

// Componente principal do Dashboard de Qualidade
const QualityDashboard = ({ projectId }) => {
  console.log("QualityDashboard renderizado com projectId:", projectId);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [requirementsCoverage, setRequirementsCoverage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Carregar dados do projeto e métricas de qualidade
  useEffect(() => {
    const loadQualityData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar dados do projeto
        const projectResponse = await projectService.getProjectById(projectId);
        if (projectResponse.error) {
          throw new Error(projectResponse.error);
        }
        setProject(projectResponse.data || projectResponse);
        
        // Carregar relatório de qualidade
        const reportResponse = await reportService.generateQualityReport(projectId, { preview: true });
        if (reportResponse.error) {
          console.warn("Erro ao gerar relatório de qualidade:", reportResponse.error);
        } else {
          setQualityData(reportResponse.data);
        }
        
        // Carregar dados de cobertura de requisitos
        const coverageResponse = await traceabilityService.getRequirementsCoverage(projectId);
        if (coverageResponse.error) {
          console.warn("Erro ao obter dados de cobertura:", coverageResponse.error);
        } else {
          setRequirementsCoverage(coverageResponse.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de qualidade:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadQualityData();
    }
  }, [projectId]);
  
  // Função para atualizar os dados
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Atualizar relatório de qualidade
      const reportResponse = await reportService.generateQualityReport(projectId, { preview: true });
      if (reportResponse.error) {
        console.warn("Erro ao atualizar relatório de qualidade:", reportResponse.error);
      } else {
        setQualityData(reportResponse.data);
      }
      
      // Atualizar dados de cobertura
      const coverageResponse = await traceabilityService.getRequirementsCoverage(projectId);
      if (coverageResponse.error) {
        console.warn("Erro ao atualizar dados de cobertura:", coverageResponse.error);
      } else {
        setRequirementsCoverage(coverageResponse.data);
      }
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      setError("Falha ao atualizar os dados: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Navegar para relatórios detalhados
  const handleViewReports = () => {
    navigate(`/projects/${projectId}/reports`);
  };
  
  // Estado de carregamento
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando métricas de qualidade...
        </Typography>
      </Box>
    );
  }
  
  // Estado de erro
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // Verificar se há dados suficientes
  if (!qualityData && !requirementsCoverage) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Não há dados suficientes para exibir o dashboard de qualidade.
        Adicione requisitos e casos de teste ao projeto para visualizar métricas de qualidade.
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Dashboard de Qualidade
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AssessmentIcon />} 
            onClick={handleViewReports}
          >
            Ver Relatórios
          </Button>
        </Box>
      </Box>
      
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}
      
      <Grid container spacing={3}>
        {/* Pontuação Geral de Qualidade */}
        {qualityData?.metrics?.overallQualityScore !== undefined && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Pontuação de Qualidade
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <QualityScore score={qualityData.metrics.overallQualityScore} size="large" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Baseado em cobertura de requisitos, execução de testes e automação
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* Métricas por Área */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métricas por Área
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Requisitos */}
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <QualityScore 
                      score={qualityData?.metrics?.requirements?.qualityScore || 0} 
                      size="small"
                      label={false}
                    />
                    <Typography variant="subtitle2">Requisitos</Typography>
                  </Box>
                  
                  <MetricProgress
                    value={requirementsCoverage?.coveragePercent || 0}
                    label="Cobertura"
                  />
                </Grid>
                
                {/* Testes */}
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <QualityScore 
                      score={qualityData?.metrics?.testing?.qualityScore || 0} 
                      size="small"
                      label={false}
                    />
                    <Typography variant="subtitle2">Execução</Typography>
                  </Box>
                  
                  <MetricProgress
                    value={qualityData?.metrics?.testing?.executionRate || 0}
                    label="Taxa de Execução"
                  />
                  <MetricProgress
                    value={qualityData?.metrics?.testing?.passRate || 0}
                    label="Taxa de Aprovação"
                  />
                </Grid>
                
                {/* Automação */}
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <QualityScore 
                      score={qualityData?.metrics?.automation?.qualityScore || 0} 
                      size="small"
                      label={false}
                    />
                    <Typography variant="subtitle2">Automação</Typography>
                  </Box>
                  
                  <MetricProgress
                    value={qualityData?.metrics?.automation?.automationRate || 0}
                    label="Taxa de Automação"
                    target={80} // 80% é considerado excelente para automação
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Resumo de Cobertura */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cobertura de Requisitos
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {requirementsCoverage?.totalRequirements || 0}
                    </Typography>
                    <Typography variant="body2">Total de Requisitos</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {requirementsCoverage?.coveredRequirements || 0}
                    </Typography>
                    <Typography variant="body2">Requisitos Cobertos</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cobertura por Prioridade
                </Typography>
                
                {requirementsCoverage?.priorityCoverage && Object.entries(requirementsCoverage.priorityCoverage).map(([priority, data]) => (
                  <MetricProgress
                    key={priority}
                    value={data.coveragePercent}
                    label={priority}
                    color={
                      priority === 'Crítica' || priority === 'Alta' 
                        ? (data.coveragePercent >= 80 ? 'success.main' : 'error.main')
                        : undefined
                    }
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Insights e Recomendações */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights e Recomendações
              </Typography>
              
              {qualityData?.recommendations && qualityData.recommendations.length > 0 ? (
                <List>
                  {qualityData.recommendations.slice(0, 5).map((recommendation, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon>
                        {recommendation.type === 'critical' && <ErrorIcon color="error" />}
                        {recommendation.type === 'high' && <WarningIcon color="warning" />}
                        {recommendation.type === 'medium' && <InfoIcon color="info" />}
                        {recommendation.type === 'low' && <InfoIcon color="action" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation.message}
                        secondary={recommendation.details}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body1">
                    Não há recomendações críticas neste momento
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Continue mantendo boas práticas de teste
                  </Typography>
                </Box>
              )}
              
              {qualityData?.recommendations && qualityData.recommendations.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    variant="text" 
                    onClick={handleViewReports}
                  >
                    Ver todas as recomendações
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Análise de Risco */}
        {qualityData?.riskAnalysis?.riskLevel && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mr: 2 }}>
                  Análise de Risco
                </Typography>
                
                <Chip 
                  label={qualityData.riskAnalysis.riskLevel}
                  color={
                    qualityData.riskAnalysis.riskLevel === 'Crítico' ? 'error' :
                    qualityData.riskAnalysis.riskLevel === 'Alto' ? 'warning' :
                    qualityData.riskAnalysis.riskLevel === 'Médio' ? 'info' :
                    'success'
                  }
                  icon={
                    qualityData.riskAnalysis.riskLevel === 'Crítico' ? <ErrorIcon /> :
                    qualityData.riskAnalysis.riskLevel === 'Alto' ? <WarningIcon /> :
                    qualityData.riskAnalysis.riskLevel === 'Médio' ? <InfoIcon /> :
                    <CheckIcon />
                  }
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.main">
                      {qualityData.riskAnalysis.criticalUncoveredCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      Requisitos críticos sem cobertura
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h5" color="error.main">
                      {qualityData.riskAnalysis.criticalFailingCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      Requisitos críticos com falhas
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h5" color="primary.main">
                      {Math.round(requirementsCoverage?.passRate || 0)}%
                    </Typography>
                    <Typography variant="body2">
                      Taxa de aprovação de requisitos
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h5" color="primary.main">
                      {project?.statistics?.totalTestsCount || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total de casos de teste
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Call-to-action para relatórios */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button 
                  variant="contained"
                  color="primary"
                  startIcon={<AssessmentIcon />}
                  onClick={handleViewReports}
                >
                  Gerar Relatório Detalhado
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Gere um relatório completo para análise detalhada e recomendações específicas
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default QualityDashboard; 