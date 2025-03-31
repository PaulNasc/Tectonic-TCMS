import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
  Breadcrumbs,
  Link,
  Collapse,
  FormControlLabel,
  Switch,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as PassedIcon,
  Error as FailedIcon,
  Block as BlockedIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { traceabilityService } from '../services/traceabilityService';
import { testSuiteService } from '../services/testSuiteService';
import { projectService } from '../services/projectService';

// Componente TabPanel - para exibir conteúdo das abas
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`link-tests-tabpanel-${index}`}
      aria-labelledby={`link-tests-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Componente para exibir o status de execução
const ExecutionStatus = ({ status }) => {
  if (!status) return <PendingIcon fontSize="small" color="disabled" />;
  
  switch (status) {
    case 'Passou':
      return <PassedIcon fontSize="small" color="success" />;
    case 'Falhou':
      return <FailedIcon fontSize="small" color="error" />;
    case 'Bloqueado':
      return <BlockedIcon fontSize="small" color="warning" />;
    default:
      return <PendingIcon fontSize="small" color="disabled" />;
  }
};

const RequirementLinkTestCases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId, requirementId } = useParams();
  
  // Estados principais
  const [requirement, setRequirement] = useState(null);
  const [project, setProject] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [linkedTestCases, setLinkedTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSuites, setExpandedSuites] = useState({});
  const [showOnlyLinked, setShowOnlyLinked] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Carregar dados do requisito e casos de teste
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar o projeto
        const projectResponse = await projectService.getProjectById(projectId);
        if (!projectResponse) {
          throw new Error('Projeto não encontrado');
        }
        setProject(projectResponse);
        
        // Carregar o requisito
        const requirementResponse = await traceabilityService.getRequirementById(requirementId);
        if (!requirementResponse) {
          throw new Error('Requisito não encontrado');
        }
        setRequirement(requirementResponse);
        
        // Inicializar os casos de teste vinculados
        setLinkedTestCases(requirementResponse.linkedTestCases || []);
        
        // Carregar todos os casos de teste do projeto
        const suitesResponse = await testSuiteService.getTestSuitesByProject(projectId);
        if (!suitesResponse) {
          setTestCases([]);
        } else {
          // Extrair casos de teste de todas as suites
          const allTestCases = [];
          
          for (const suite of suitesResponse) {
            const suiteTestCases = (suite.testCases || []).map(testCase => ({
              ...testCase,
              suiteId: suite.id,
              suiteName: suite.name
            }));
            
            if (suiteTestCases.length > 0) {
              allTestCases.push({
                suiteId: suite.id,
                suiteName: suite.name,
                testCases: suiteTestCases
              });
            }
          }
          
          setTestCases(allTestCases);
          
          // Expandir as suites que têm casos de teste vinculados
          const initialExpandedState = {};
          for (const suite of allTestCases) {
            const hasLinkedTestCase = suite.testCases.some(tc => 
              requirementResponse.linkedTestCases?.some(ltc => ltc.id === tc.id)
            );
            
            if (hasLinkedTestCase) {
              initialExpandedState[suite.suiteId] = true;
            }
          }
          
          setExpandedSuites(initialExpandedState);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId && requirementId) {
      loadData();
    }
  }, [projectId, requirementId]);
  
  // Alternar a expansão de uma suite
  const toggleSuiteExpansion = (suiteId) => {
    setExpandedSuites(prev => ({
      ...prev,
      [suiteId]: !prev[suiteId]
    }));
  };
  
  // Vincular um caso de teste ao requisito
  const handleLinkTestCase = async (testCase) => {
    try {
      setLoading(true);
      
      // Verificar se já está vinculado
      const isAlreadyLinked = linkedTestCases.some(tc => tc.id === testCase.id);
      
      if (isAlreadyLinked) {
        return; // Já está vinculado, não fazer nada
      }
      
      // Chamar o serviço para vincular
      await traceabilityService.linkTestCaseToRequirement(
        requirementId,
        testCase.id,
        testCase,
        user
      );
      
      // Atualizar a lista de casos de teste vinculados
      setLinkedTestCases(prev => [...prev, testCase]);
    } catch (err) {
      console.error('Erro ao vincular caso de teste:', err);
      setError(`Erro ao vincular: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Desvincular um caso de teste do requisito
  const handleUnlinkTestCase = async (testCase) => {
    try {
      setLoading(true);
      
      // Verificar se está vinculado
      const isLinked = linkedTestCases.some(tc => tc.id === testCase.id);
      
      if (!isLinked) {
        return; // Não está vinculado, não fazer nada
      }
      
      // Chamar o serviço para desvincular
      await traceabilityService.unlinkTestCaseFromRequirement(
        requirementId,
        testCase.id,
        testCase,
        user
      );
      
      // Atualizar a lista de casos de teste vinculados
      setLinkedTestCases(prev => prev.filter(tc => tc.id !== testCase.id));
    } catch (err) {
      console.error('Erro ao desvincular caso de teste:', err);
      setError(`Erro ao desvincular: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar casos de teste pelo termo de pesquisa
  const filterTestCases = (suites) => {
    if (!searchTerm && !showOnlyLinked) {
      return suites;
    }
    
    return suites.map(suite => {
      const filteredTestCases = suite.testCases.filter(testCase => {
        const matchesSearch = !searchTerm || 
          testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (testCase.description && testCase.description.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesLinked = !showOnlyLinked || 
          linkedTestCases.some(tc => tc.id === testCase.id);
          
        return matchesSearch && matchesLinked;
      });
      
      return {
        ...suite,
        testCases: filteredTestCases
      };
    }).filter(suite => suite.testCases.length > 0);
  };
  
  // Mudar aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Voltar para a página de requisitos
  const handleBackToRequirements = () => {
    navigate(`/projects/${projectId}/requirements`);
  };
  
  // Estado de carregamento
  if (loading && !requirement) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando dados...
        </Typography>
      </Box>
    );
  }
  
  // Estado de erro
  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  // Filtrar os casos de teste
  const filteredTestCases = filterTestCases(testCases);
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBackToRequirements} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              color="inherit" 
              onClick={() => navigate('/projects')}
              sx={{ cursor: 'pointer' }}
            >
              Projetos
            </Link>
            <Link 
              color="inherit" 
              onClick={() => navigate(`/projects/${projectId}`)}
              sx={{ cursor: 'pointer' }}
            >
              {project?.name}
            </Link>
            <Link 
              color="inherit" 
              onClick={handleBackToRequirements}
              sx={{ cursor: 'pointer' }}
            >
              Requisitos
            </Link>
            <Typography color="text.primary">Vincular Casos de Teste</Typography>
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>
            {requirement?.code} - {requirement?.name}
          </Typography>
          
          {requirement?.description && (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {requirement.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Chip 
              label={`Prioridade: ${requirement?.priority}`} 
              size="small"
              color={
                requirement?.priority === 'Alta' || requirement?.priority === 'Crítica' 
                  ? 'error' 
                  : requirement?.priority === 'Média' 
                    ? 'warning' 
                    : 'success'
              }
              variant="outlined"
            />
            
            {requirement?.source && (
              <Chip 
                label={`Origem: ${requirement.source}`} 
                size="small"
                variant="outlined"
              />
            )}
            
            <Chip 
              label={`${linkedTestCases.length} Casos de Teste Vinculados`} 
              size="small"
              color="primary"
            />
          </Box>
        </Box>
      </Box>
      
      {/* Abas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="vincular casos de teste tabs"
        >
          <Tab label="Vincular Casos de Teste" id="link-tests-tab-0" />
          <Tab 
            label={`Casos de Teste Vinculados (${linkedTestCases.length})`} 
            id="link-tests-tab-1" 
          />
        </Tabs>
      </Box>
      
      {/* Aba de vincular casos de teste */}
      <TabPanel value={activeTab} index={0}>
        {/* Barra de ferramentas */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Pesquisar casos de teste..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: '300px' } }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyLinked}
                onChange={(e) => setShowOnlyLinked(e.target.checked)}
                color="primary"
              />
            }
            label="Mostrar apenas vinculados"
          />
        </Box>
        
        {testCases.length === 0 ? (
          <Alert severity="info">
            Nenhum caso de teste encontrado para este projeto. Adicione casos de teste primeiro.
          </Alert>
        ) : filteredTestCases.length === 0 ? (
          <Alert severity="info">
            Nenhum caso de teste corresponde aos critérios de pesquisa.
          </Alert>
        ) : (
          <Paper>
            {filteredTestCases.map((suite) => (
              <React.Fragment key={suite.suiteId}>
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSuiteExpansion(suite.suiteId)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {expandedSuites[suite.suiteId] ? (
                      <ExpandLessIcon sx={{ mr: 1 }} />
                    ) : (
                      <ExpandMoreIcon sx={{ mr: 1 }} />
                    )}
                    <Typography variant="subtitle1">
                      {suite.suiteName} ({suite.testCases.length} casos de teste)
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Chip 
                      label={`${suite.testCases.filter(tc => 
                        linkedTestCases.some(ltc => ltc.id === tc.id)
                      ).length} Vinculados`} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                <Collapse in={expandedSuites[suite.suiteId]} timeout="auto">
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">Nome</TableCell>
                          <TableCell width="15%">Tipo</TableCell>
                          <TableCell width="15%">Prioridade</TableCell>
                          <TableCell width="15%">Status</TableCell>
                          <TableCell width="15%">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {suite.testCases.map((testCase) => {
                          const isLinked = linkedTestCases.some(tc => tc.id === testCase.id);
                          
                          return (
                            <TableRow 
                              key={testCase.id} 
                              hover
                              sx={{ 
                                bgcolor: isLinked ? 'action.selected' : 'inherit'
                              }}
                            >
                              <TableCell>
                                <Typography variant="subtitle2">
                                  {testCase.name || testCase.title}
                                </Typography>
                                {testCase.description && (
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {testCase.description.substring(0, 60)}
                                    {testCase.description.length > 60 ? '...' : ''}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={testCase.type || 'Manual'} 
                                  size="small"
                                  color={testCase.type === 'Automatizado' ? 'primary' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={testCase.priority} 
                                  size="small"
                                  color={
                                    testCase.priority === 'Alta' || testCase.priority === 'Crítica' 
                                      ? 'error' 
                                      : testCase.priority === 'Média' 
                                        ? 'warning' 
                                        : 'success'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ExecutionStatus status={testCase.lastExecutionStatus} />
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {testCase.lastExecutionStatus || 'Não Executado'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {isLinked ? (
                                  <Tooltip title="Desvincular Caso de Teste">
                                    <IconButton 
                                      size="small" 
                                      color="default"
                                      onClick={() => handleUnlinkTestCase(testCase)}
                                      disabled={loading}
                                    >
                                      <UnlinkIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Vincular Caso de Teste">
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleLinkTestCase(testCase)}
                                      disabled={loading}
                                    >
                                      <LinkIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </React.Fragment>
            ))}
          </Paper>
        )}
      </TabPanel>
      
      {/* Aba de casos de teste vinculados */}
      <TabPanel value={activeTab} index={1}>
        {linkedTestCases.length === 0 ? (
          <Alert severity="info">
            Nenhum caso de teste está vinculado a este requisito.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40%">Nome</TableCell>
                  <TableCell width="20%">Suite</TableCell>
                  <TableCell width="15%">Tipo</TableCell>
                  <TableCell width="15%">Prioridade</TableCell>
                  <TableCell width="10%">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linkedTestCases.map((testCase) => (
                  <TableRow key={testCase.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {testCase.name || testCase.title}
                      </Typography>
                      {testCase.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {testCase.description.substring(0, 60)}
                          {testCase.description.length > 60 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {testCase.suiteName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={testCase.type || 'Manual'} 
                        size="small"
                        color={testCase.type === 'Automatizado' ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={testCase.priority} 
                        size="small"
                        color={
                          testCase.priority === 'Alta' || testCase.priority === 'Crítica' 
                            ? 'error' 
                            : testCase.priority === 'Média' 
                              ? 'warning' 
                              : 'success'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Desvincular Caso de Teste">
                        <IconButton 
                          size="small" 
                          color="default"
                          onClick={() => handleUnlinkTestCase(testCase)}
                          disabled={loading}
                        >
                          <UnlinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
    </Box>
  );
};

export default RequirementLinkTestCases; 