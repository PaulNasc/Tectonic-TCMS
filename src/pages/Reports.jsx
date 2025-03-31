import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  DownloadForOffline as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  BugReport as BugIcon,
  CheckCircle as CheckIcon,
  PriorityHigh as PriorityIcon,
  Summarize as SummarizeIcon
} from '@mui/icons-material';
import { reportService } from '../services/reportService';
import { projectService } from '../services/projectService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente principal da página de relatórios
const Reports = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeMetrics: true,
    includeRiskAnalysis: true,
    includeCoverageAnalysis: true
  });
  const [activeTab, setActiveTab] = useState(0);

  // Carregar dados do projeto e relatórios existentes
  useEffect(() => {
    const loadProjectAndReports = async () => {
      if (!projectId) {
        setError('ID do projeto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Carregar projeto
        const projectResponse = await projectService.getProjectById(projectId);
        if (projectResponse.error) {
          throw new Error(projectResponse.error);
        }
        setProjectData(projectResponse.data || projectResponse);

        // Carregar relatórios existentes
        const reportsResponse = await reportService.getProjectReports(projectId);
        if (reportsResponse.error) {
          console.warn('Erro ao carregar relatórios:', reportsResponse.error);
        } else {
          setReports(reportsResponse.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjectAndReports();
  }, [projectId]);

  // Função para gerar um novo relatório
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      setError(null);

      const response = await reportService.generateQualityReport(projectId, reportOptions);
      if (response.error) {
        throw new Error(response.error);
      }

      // Adicionar o novo relatório à lista e selecioná-lo
      setReports(prev => [response.data, ...prev]);
      setSelectedReport(response.data);
      setOpenDialog(false);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError(`Erro ao gerar relatório: ${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Carregar um relatório específico
  const handleLoadReport = async (reportId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportService.getReportById(reportId);
      if (response.error) {
        throw new Error(response.error);
      }

      setSelectedReport(response.data);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError(`Erro ao carregar relatório: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar chip de nível de risco
  const renderRiskLevelChip = (riskLevel) => {
    const riskMap = {
      'Crítico': { color: 'error', icon: <ErrorIcon fontSize="small" /> },
      'Alto': { color: 'warning', icon: <WarningIcon fontSize="small" /> },
      'Médio': { color: 'info', icon: <InfoIcon fontSize="small" /> },
      'Baixo': { color: 'success', icon: <CheckIcon fontSize="small" /> },
      'Indefinido': { color: 'default', icon: <InfoIcon fontSize="small" /> }
    };

    const riskInfo = riskMap[riskLevel] || riskMap['Indefinido'];

    return (
      <Chip
        label={riskLevel}
        color={riskInfo.color}
        size="small"
        icon={riskInfo.icon}
      />
    );
  };

  // Renderizar chip de tipo de recomendação
  const renderRecommendationTypeChip = (type) => {
    const typeMap = {
      'critical': { color: 'error', icon: <ErrorIcon fontSize="small" />, label: 'Crítica' },
      'high': { color: 'warning', icon: <WarningIcon fontSize="small" />, label: 'Alta' },
      'medium': { color: 'info', icon: <InfoIcon fontSize="small" />, label: 'Média' },
      'low': { color: 'default', icon: <InfoIcon fontSize="small" />, label: 'Baixa' }
    };

    const typeInfo = typeMap[type] || typeMap['low'];

    return (
      <Chip
        label={typeInfo.label}
        color={typeInfo.color}
        size="small"
        icon={typeInfo.icon}
      />
    );
  };

  // Renderizar icon para área de recomendação
  const renderAreaIcon = (area) => {
    const areaMap = {
      'coverage': <TimelineIcon />,
      'execution': <BugIcon />,
      'automation': <RefreshIcon />,
      'security': <SecurityIcon />
    };

    return areaMap[area] || <InfoIcon />;
  };

  // Formatar data
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Estado de carregamento
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando dados dos relatórios...
        </Typography>
      </Box>
    );
  }

  // Estado de erro
  if (error && !selectedReport && reports.length === 0) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  // Componente de header
  const ReportHeader = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Relatórios de Qualidade
        </Typography>
        <Button
          variant="contained"
          startIcon={<ReportIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Gerar Novo Relatório
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {projectData?.name && `Projeto: ${projectData.name}`}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  // Componente de diálogo para gerar relatório
  const GenerateReportDialog = () => (
    <Dialog
      open={openDialog}
      onClose={() => setOpenDialog(false)}
      aria-labelledby="report-dialog-title"
    >
      <DialogTitle id="report-dialog-title">
        Gerar Novo Relatório de Qualidade
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Configure as opções para o relatório de qualidade do projeto.
        </DialogContentText>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={reportOptions.includeMetrics}
                onChange={(e) => setReportOptions({ ...reportOptions, includeMetrics: e.target.checked })}
              />
            }
            label="Incluir métricas detalhadas"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={reportOptions.includeRiskAnalysis}
                onChange={(e) => setReportOptions({ ...reportOptions, includeRiskAnalysis: e.target.checked })}
              />
            }
            label="Incluir análise de risco"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={reportOptions.includeCoverageAnalysis}
                onChange={(e) => setReportOptions({ ...reportOptions, includeCoverageAnalysis: e.target.checked })}
              />
            }
            label="Incluir análise de cobertura"
          />
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpenDialog(false)} disabled={generatingReport}>
          Cancelar
        </Button>
        <Button
          onClick={handleGenerateReport}
          variant="contained"
          disabled={generatingReport}
          startIcon={generatingReport ? <CircularProgress size={20} /> : <ReportIcon />}
        >
          {generatingReport ? 'Gerando...' : 'Gerar Relatório'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Componente de lista de relatórios
  const ReportsList = () => (
    <Grid container spacing={2}>
      {reports.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity="info">
            Nenhum relatório encontrado para este projeto. Gere um novo relatório para começar.
          </Alert>
        </Grid>
      ) : (
        reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id || report.generatedAt}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                },
                bgcolor: selectedReport?.id === report.id ? 'action.selected' : 'background.paper'
              }}
              onClick={() => setSelectedReport(report)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <ReportIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Relatório de Qualidade
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Gerado em: {formatDate(report.generatedAt)}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {report.riskAnalysis?.riskLevel && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Nível de risco:
                      </Typography>
                      {renderRiskLevelChip(report.riskAnalysis.riskLevel)}
                    </Box>
                  )}
                  
                  {report.summary?.coveragePercentage !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        Cobertura:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {Math.round(report.summary.coveragePercentage)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<InfoIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(report);
                  }}
                >
                  Detalhes
                </Button>
                <Button 
                  size="small" 
                  startIcon={<DownloadIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Funcionalidade de download será implementada em breve');
                  }}
                >
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  // Componente de visualização de relatório
  const ReportViewer = () => {
    if (!selectedReport) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Selecione um relatório da lista para visualizar seus detalhes.
        </Alert>
      );
    }

    return (
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6">
              <ReportIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Relatório de Qualidade
            </Typography>
            
            <Box>
              <Button 
                startIcon={<DownloadIcon />}
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => alert('Funcionalidade de download será implementada em breve')}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gerado em: {formatDate(selectedReport.generatedAt)}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Projeto: {selectedReport.projectName || projectData?.name}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            <Tab label="Sumário" icon={<SummarizeIcon />} iconPosition="start" />
            <Tab 
              label="Métricas" 
              icon={<TimelineIcon />} 
              iconPosition="start" 
              disabled={!selectedReport.metrics?.requirements}
            />
            <Tab 
              label="Análise de Risco" 
              icon={<SecurityIcon />} 
              iconPosition="start" 
              disabled={!selectedReport.riskAnalysis?.riskLevel}
            />
            <Tab 
              label="Recomendações" 
              icon={<InfoIcon />} 
              iconPosition="start" 
              disabled={!selectedReport.recommendations?.length}
            />
          </Tabs>

          {/* Tab de Sumário */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Visão Geral
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Nível de Risco:</strong> {selectedReport.riskAnalysis?.riskLevel || 'Não avaliado'}
                      {selectedReport.riskAnalysis?.riskLevel && (
                        <Box component="span" sx={{ ml: 1 }}>
                          {renderRiskLevelChip(selectedReport.riskAnalysis.riskLevel)}
                        </Box>
                      )}
                    </Typography>
                    
                    {selectedReport.metrics?.overallQualityScore !== undefined && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Pontuação de Qualidade:</strong> {selectedReport.metrics.overallQualityScore.toFixed(1)}/5
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Requisitos
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total de Requisitos:</strong> {selectedReport.summary?.totalRequirements || 0}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Requisitos Cobertos:</strong> {selectedReport.summary?.coveredRequirements || 0} 
                      ({Math.round(selectedReport.summary?.coveragePercentage || 0)}%)
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Requisitos Aprovados:</strong> {selectedReport.summary?.passedRequirements || 0}
                      ({Math.round(selectedReport.summary?.passRate || 0)}%)
                    </Typography>
                    
                    {selectedReport.riskAnalysis?.criticalUncoveredCount !== undefined && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Requisitos Críticos sem Cobertura:</strong> {selectedReport.riskAnalysis.criticalUncoveredCount}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Testes
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total de Casos de Teste:</strong> {selectedReport.summary?.totalTestCases || 0}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Testes Automatizados:</strong> {selectedReport.summary?.automatedTestCases || 0} 
                      ({Math.round(selectedReport.summary?.automationRate || 0)}%)
                    </Typography>
                    
                    {selectedReport.metrics?.testing?.executed !== undefined && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Testes Executados:</strong> {selectedReport.metrics.testing.executed} 
                        ({Math.round(selectedReport.metrics.testing.executionRate || 0)}%)
                      </Typography>
                    )}
                    
                    {selectedReport.metrics?.testing?.passed !== undefined && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Testes Aprovados:</strong> {selectedReport.metrics.testing.passed} 
                        ({Math.round(selectedReport.metrics.testing.passRate || 0)}%)
                      </Typography>
                    )}
                  </Box>
                  
                  {selectedReport.recommendations?.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Principais Recomendações
                      </Typography>
                      
                      <List dense>
                        {selectedReport.recommendations.slice(0, 3).map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {renderAreaIcon(rec.area)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={rec.message}
                              secondary={renderRecommendationTypeChip(rec.type)}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab de Métricas */}
          {activeTab === 1 && selectedReport.metrics?.requirements && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Typography variant="subtitle1" gutterBottom>
                      Métricas de Requisitos
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total de Requisitos</TableCell>
                            <TableCell align="right">{selectedReport.metrics.requirements.total}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Requisitos Cobertos</TableCell>
                            <TableCell align="right">
                              {selectedReport.metrics.requirements.covered} 
                              ({Math.round(selectedReport.metrics.requirements.coveragePercent)}%)
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Requisitos Sem Cobertura</TableCell>
                            <TableCell align="right">{selectedReport.metrics.requirements.uncovered}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pontuação de Qualidade</TableCell>
                            <TableCell align="right">{selectedReport.metrics.requirements.qualityScore.toFixed(1)}/5</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {selectedReport.metrics.requirements.priorityCoverage && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                          Cobertura por Prioridade
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Prioridade</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Cobertos</TableCell>
                                <TableCell align="right">Cobertura</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(selectedReport.metrics.requirements.priorityCoverage).map(([priority, data]) => (
                                <TableRow key={priority}>
                                  <TableCell>{priority}</TableCell>
                                  <TableCell align="right">{data.total}</TableCell>
                                  <TableCell align="right">{data.covered}</TableCell>
                                  <TableCell align="right">{Math.round(data.coveragePercent)}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Typography variant="subtitle1" gutterBottom>
                      Métricas de Teste
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total de Testes</TableCell>
                            <TableCell align="right">{selectedReport.metrics.testing.total}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Testes Executados</TableCell>
                            <TableCell align="right">
                              {selectedReport.metrics.testing.executed} 
                              ({Math.round(selectedReport.metrics.testing.executionRate)}%)
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Testes Aprovados</TableCell>
                            <TableCell align="right">
                              {selectedReport.metrics.testing.passed} 
                              ({Math.round(selectedReport.metrics.testing.passRate)}%)
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Testes Automatizados</TableCell>
                            <TableCell align="right">
                              {selectedReport.metrics.automation.automated} 
                              ({Math.round(selectedReport.metrics.automation.automationRate)}%)
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pontuação de Execução</TableCell>
                            <TableCell align="right">{selectedReport.metrics.testing.qualityScore.toFixed(1)}/5</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pontuação de Automação</TableCell>
                            <TableCell align="right">{selectedReport.metrics.automation.qualityScore.toFixed(1)}/5</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  
                  <Paper sx={{ p: 2, mt: 2 }} variant="outlined">
                    <Typography variant="subtitle1" gutterBottom>
                      Pontuação Geral de Qualidade
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                      <Box sx={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'background.default',
                        border: '8px solid',
                        borderColor: 
                          selectedReport.metrics.overallQualityScore >= 4 ? 'success.main' :
                          selectedReport.metrics.overallQualityScore >= 3 ? 'info.main' :
                          selectedReport.metrics.overallQualityScore >= 2 ? 'warning.main' :
                          'error.main'
                      }}>
                        <Typography variant="h3" fontWeight="bold">
                          {selectedReport.metrics.overallQualityScore.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
                      {selectedReport.metrics.overallQualityScore >= 4.5 ? 'Excelente' : 
                       selectedReport.metrics.overallQualityScore >= 3.5 ? 'Bom' : 
                       selectedReport.metrics.overallQualityScore >= 2.5 ? 'Regular' : 
                       selectedReport.metrics.overallQualityScore >= 1.5 ? 'Insuficiente' : 'Crítico'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab de Análise de Risco */}
          {activeTab === 2 && selectedReport.riskAnalysis?.riskLevel && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ mr: 1, color: 
                        selectedReport.riskAnalysis.riskLevel === 'Crítico' ? 'error.main' :
                        selectedReport.riskAnalysis.riskLevel === 'Alto' ? 'warning.main' :
                        selectedReport.riskAnalysis.riskLevel === 'Médio' ? 'info.main' :
                        'success.main'
                      }} />
                      <Typography variant="subtitle1">
                        Nível de Risco: {selectedReport.riskAnalysis.riskLevel}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" gutterBottom>
                      Requisitos críticos sem cobertura: {selectedReport.riskAnalysis.criticalUncoveredCount}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      Requisitos críticos com falhas: {selectedReport.riskAnalysis.criticalFailingCount}
                    </Typography>
                  </Paper>
                  
                  {selectedReport.riskAnalysis.criticalUncovered?.length > 0 && (
                    <Paper sx={{ p: 2, mt: 2 }} variant="outlined">
                      <Typography variant="subtitle2" gutterBottom>
                        Requisitos Críticos sem Cobertura
                      </Typography>
                      
                      <List dense>
                        {selectedReport.riskAnalysis.criticalUncovered.map((req) => (
                          <ListItem key={req.id}>
                            <ListItemIcon>
                              <PriorityIcon color="error" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={req.name}
                              secondary={`Prioridade: ${req.priority}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {selectedReport.riskAnalysis.criticalFailing?.length > 0 && (
                    <Paper sx={{ p: 2 }} variant="outlined">
                      <Typography variant="subtitle2" gutterBottom>
                        Requisitos Críticos com Falhas
                      </Typography>
                      
                      <List dense>
                        {selectedReport.riskAnalysis.criticalFailing.map((req) => (
                          <Accordion key={req.id} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="body2">{req.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Prioridade: {req.priority}
                              </Typography>
                              
                              <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                                Testes Falhando:
                              </Typography>
                              
                              <List dense>
                                {req.failingTests.map((test) => (
                                  <ListItem key={test.id} dense>
                                    <ListItemIcon>
                                      <BugIcon fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <ListItemText 
                                      primary={test.name}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab de Recomendações */}
          {activeTab === 3 && selectedReport.recommendations?.length > 0 && (
            <Box>
              <List>
                {selectedReport.recommendations.map((rec, index) => (
                  <Paper key={index} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
                    <ListItem
                      secondaryAction={renderRecommendationTypeChip(rec.type)}
                    >
                      <ListItemIcon>
                        {renderAreaIcon(rec.area)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={rec.message}
                        secondary={rec.details}
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <ReportHeader />
      
      <Grid container spacing={3}>
        {!selectedReport ? (
          <Grid item xs={12}>
            <ReportsList />
          </Grid>
        ) : (
          <>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Relatórios Disponíveis
              </Typography>
              <ReportsList />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <ReportViewer />
            </Grid>
          </>
        )}
      </Grid>
      
      <GenerateReportDialog />
    </Box>
  );
};

export default Reports; 