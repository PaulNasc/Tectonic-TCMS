import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Paper,
  Button,
  Tabs,
  Tab,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as testService from '../services/testService';
import { reportService } from '../services/reportService';
import { projectService } from '../services/projectService';
import { traceabilityService } from '../services/traceabilityService';
import { Link } from 'react-router-dom';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
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

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: '20px',
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
  },
}));

const StatValue = styled(Typography)({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '8px',
  background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
});

const ChartCard = styled(Card)`
  padding: 24px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  margin-top: 24px;
`;

const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

const Reports = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [requirementsCoverage, setRequirementsCoverage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalTests: 0,
    executedTests: 0,
    successRate: 0,
    statusDistribution: {
      passed: 0,
      failed: 0,
      blocked: 0
    },
    executionHistory: []
  });

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const { data, error } = await projectService.listProjects({ userId: user?.uid });
        
        if (error) {
          console.error('Erro ao carregar projetos:', error);
          return;
        }
        
        setProjects(data || []);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        
        // Carregar relatórios existentes
        const { data: reportsData, error: reportsError } = await reportService.getReportsByProject(selectedProject);
        
        if (reportsError) {
          console.error('Erro ao carregar relatórios:', reportsError);
        } else {
          setReports(reportsData || []);
        }
        
        // Carregar dados de cobertura de requisitos
        const { data: coverageData, error: coverageError } = await traceabilityService.getRequirementsCoverage(selectedProject);
        
        if (coverageError) {
          console.error('Erro ao carregar dados de cobertura:', coverageError);
        } else {
          setRequirementsCoverage(coverageData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do projeto:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjectData();
  }, [selectedProject]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await testService.getTestStats(timeRange);
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatusDistribution = () => {
    const { passed, failed, blocked } = stats.statusDistribution;
    return [
      { name: 'Aprovados', value: passed },
      { name: 'Falhas', value: failed },
      { name: 'Bloqueados', value: blocked }
    ];
  };

  const handleGenerateReport = async () => {
    if (!selectedProject) {
      alert('Selecione um projeto para gerar o relatório');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await reportService.generateProjectReport(selectedProject);
      
      if (error) {
        alert(`Erro ao gerar relatório: ${error}`);
        return;
      }
      
      // Recarregar a lista de relatórios
      const { data: reportsData } = await reportService.getReportsByProject(selectedProject);
      setReports(reportsData || []);
      
      alert('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert(`Erro ao gerar relatório: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Typography variant="h4">
            Relatórios e Análises
          </Typography>
          <FormControl 
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--border-color)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--neon-primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--neon-primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                '&.Mui-focused': {
                  color: 'var(--neon-primary)',
                },
              },
              '& .MuiSelect-select': {
                color: 'var(--text-primary)',
              },
            }}
          >
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Período"
            >
              <MenuItem value={7}>Última Semana</MenuItem>
              <MenuItem value={30}>Último Mês</MenuItem>
              <MenuItem value={90}>Último Trimestre</MenuItem>
            </Select>
          </FormControl>
        </Header>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Total de Testes
              </Typography>
              <StatValue>
                {stats.totalTests}
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                Casos de teste cadastrados
              </Typography>
            </StatsCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Testes Executados
              </Typography>
              <StatValue>
                {stats.executedTests}
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                No período selecionado
              </Typography>
            </StatsCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Taxa de Sucesso
              </Typography>
              <StatValue>
                {stats.successRate.toFixed(1)}%
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                Testes aprovados / executados
              </Typography>
            </StatsCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Distribuição de Status
              </Typography>
              <Divider sx={{ borderColor: 'var(--border-color)', mb: 3 }} />
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={formatStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {formatStatusDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Histórico de Execuções
              </Typography>
              <Divider sx={{ borderColor: 'var(--border-color)', mb: 3 }} />
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={stats.executionHistory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-secondary)"
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="passed" name="Aprovados" fill={COLORS[0]} />
                    <Bar dataKey="failed" name="Falhas" fill={COLORS[1]} />
                    <Bar dataKey="blocked" name="Bloqueados" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Seleção de Projeto
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="project-select-label">Projeto</InputLabel>
                <Select
                  labelId="project-select-label"
                  id="project-select"
                  value={selectedProject}
                  label="Projeto"
                  onChange={handleProjectChange}
                >
                  <MenuItem value="">
                    <em>Selecione um projeto</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color="primary"
                disabled={!selectedProject || loading}
                onClick={handleGenerateReport}
                startIcon={<AddIcon />}
              >
                Gerar Novo Relatório
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {selectedProject ? (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Dashboard de Cobertura" />
                <Tab label="Relatórios Gerados" />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  {requirementsCoverage ? (
                    <>
                      <Typography variant="h5" sx={{ mb: 3 }}>
                        Dashboard de Cobertura de Requisitos
                      </Typography>

                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <StatsCard>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              Total de Requisitos
                            </Typography>
                            <StatValue variant="h3">
                              {requirementsCoverage.totalRequirements}
                            </StatValue>
                          </StatsCard>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <StatsCard>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              Requisitos Cobertos
                            </Typography>
                            <StatValue variant="h3">
                              {requirementsCoverage.coveredRequirements}
                            </StatValue>
                            <Typography variant="body2" color="text.secondary">
                              {Math.round(requirementsCoverage.coveragePercent)}% do total
                            </Typography>
                          </StatsCard>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <StatsCard>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              Taxa de Aprovação
                            </Typography>
                            <StatValue variant="h3">
                              {Math.round(requirementsCoverage.passRate)}%
                            </StatValue>
                            <Typography variant="body2" color="text.secondary">
                              Requisitos com testes aprovados
                            </Typography>
                          </StatsCard>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <StatsCard>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                              Requisitos sem Cobertura
                            </Typography>
                            <StatValue variant="h3">
                              {requirementsCoverage.totalRequirements - requirementsCoverage.coveredRequirements}
                            </StatValue>
                            <Typography variant="body2" color="text.secondary">
                              Necessitam de testes
                            </Typography>
                          </StatsCard>
                        </Grid>
                      </Grid>

                      {requirementsCoverage.priorityCoverage && (
                        <Paper sx={{ p: 3, mb: 4 }}>
                          <Typography variant="h6" gutterBottom>
                            Cobertura por Prioridade
                          </Typography>
                          
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Prioridade</TableCell>
                                  <TableCell>Total</TableCell>
                                  <TableCell>Cobertos</TableCell>
                                  <TableCell>% Cobertura</TableCell>
                                  <TableCell>Aprovados</TableCell>
                                  <TableCell>% Aprovação</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(requirementsCoverage.priorityCoverage).map(([priority, data]) => (
                                  <TableRow key={priority}>
                                    <TableCell>{priority}</TableCell>
                                    <TableCell>{data.total}</TableCell>
                                    <TableCell>{data.covered}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={`${Math.round(data.coveragePercent)}%`}
                                        color={
                                          data.coveragePercent >= 80 ? 'success' :
                                          data.coveragePercent >= 50 ? 'info' :
                                          data.coveragePercent >= 30 ? 'warning' : 'error'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>{data.passed}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={`${Math.round(data.passPercent)}%`}
                                        color={
                                          data.passPercent >= 80 ? 'success' :
                                          data.passPercent >= 50 ? 'info' :
                                          data.passPercent >= 30 ? 'warning' : 'error'
                                        }
                                        size="small"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component={Link}
                          to={`/projects/${selectedProject}/requirements`}
                        >
                          Ver Dashboard Completo de Cobertura
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Alert severity="info">
                      Não há dados de cobertura de requisitos disponíveis para este projeto. Adicione requisitos e vincule casos de teste para visualizar estatísticas de cobertura.
                    </Alert>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="h5" sx={{ mb: 3 }}>
                    Relatórios Gerados
                  </Typography>

                  {reports.length === 0 ? (
                    <Alert severity="info">
                      Não há relatórios gerados para este projeto. Utilize o botão "Gerar Novo Relatório" para criar um relatório completo.
                    </Alert>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Data de Geração</TableCell>
                            <TableCell>Cobertura de Requisitos</TableCell>
                            <TableCell>Nível de Risco</TableCell>
                            <TableCell>Requisitos Críticos</TableCell>
                            <TableCell>Ações</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>
                                {new Date(report.generatedAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                {report.requirementsCoverage ? (
                                  <Chip 
                                    label={`${Math.round(report.requirementsCoverage.coveragePercent)}%`}
                                    color={
                                      report.requirementsCoverage.coveragePercent >= 80 ? 'success' :
                                      report.requirementsCoverage.coveragePercent >= 50 ? 'info' :
                                      report.requirementsCoverage.coveragePercent >= 30 ? 'warning' : 'error'
                                    }
                                    size="small"
                                  />
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={report.insights?.risk?.level || 'Indefinido'}
                                  color={
                                    report.insights?.risk?.level === 'Crítico' ? 'error' :
                                    report.insights?.risk?.level === 'Alto' ? 'warning' :
                                    report.insights?.risk?.level === 'Médio' ? 'info' : 'success'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {report.insights?.requirements?.criticalWithFailures?.length || 0}
                              </TableCell>
                              <TableCell>
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => {
                                    // Implementar visualização do relatório
                                    alert('Visualização do relatório não implementada');
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => {
                                    // Implementar download do relatório em PDF
                                    alert('Download do relatório em PDF não implementado');
                                  }}
                                >
                                  <PictureAsPdfIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => {
                                    // Implementar download do relatório em Excel
                                    alert('Download do relatório em Excel não implementado');
                                  }}
                                >
                                  <TableChartIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          )
        ) : (
          <Alert severity="info" sx={{ mt: 3 }}>
            Selecione um projeto para visualizar relatórios e estatísticas de cobertura.
          </Alert>
        )}
      </motion.div>
    </Container>
  );
};

export default Reports; 