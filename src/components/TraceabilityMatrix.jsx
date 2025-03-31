import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Link as LinkIcon,
  CheckCircle as PassedIcon,
  Error as FailedIcon,
  Block as BlockedIcon,
  HourglassEmpty as PendingIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { traceabilityService } from '../services/traceabilityService';

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

// Componente para exibir a porcentagem de cobertura
const CoverageIndicator = ({ value }) => {
  const color = value === 0 ? 'error' 
    : value < 50 ? 'warning'
    : value < 80 ? 'info'
    : 'success';
    
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={value} 
          color={color}
          sx={{ height: 8, borderRadius: 5 }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  );
};

const TraceabilityMatrix = ({ projectId }) => {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverageStats, setCoverageStats] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  
  useEffect(() => {
    const loadMatrix = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar matriz de rastreabilidade
        const { data, error } = await traceabilityService.buildTraceabilityMatrix(projectId);
        
        if (error) {
          throw new Error(error);
        }
        
        setMatrix(data || []);
        
        // Carregar estatísticas de cobertura
        const { data: stats, error: statsError } = await traceabilityService.getRequirementsCoverage(projectId);
        
        if (statsError) {
          console.warn('Erro ao carregar estatísticas de cobertura:', statsError);
        } else {
          setCoverageStats(stats);
        }
      } catch (err) {
        console.error('Erro ao carregar matriz de rastreabilidade:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      loadMatrix();
    }
  }, [projectId]);
  
  const toggleExpandRow = (reqId) => {
    setExpandedRows(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };
  
  if (loading) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Carregando matriz de rastreabilidade...
        </Typography>
      </Box>
    );
  }
  
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
  
  // Se não houver requisitos
  if (matrix.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Nenhum requisito encontrado para este projeto. Adicione requisitos para visualizar a matriz de rastreabilidade.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Resumo de cobertura */}
      {coverageStats && (
        <Box mb={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumo de Cobertura
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Requisitos
                </Typography>
                <Typography variant="h5">
                  {coverageStats.totalRequirements}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Requisitos Cobertos
                </Typography>
                <Typography variant="h5">
                  {coverageStats.coveredRequirements} ({Math.round(coverageStats.coveragePercent)}%)
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Taxa de Aprovação
                </Typography>
                <Typography variant="h5">
                  {Math.round(coverageStats.passRate)}%
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Cobertura por Prioridade
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Cobertos</TableCell>
                    <TableCell>Cobertura</TableCell>
                    <TableCell>Aprovação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(coverageStats.priorityCoverage).map(([priority, data]) => (
                    <TableRow key={priority}>
                      <TableCell>{priority}</TableCell>
                      <TableCell>{data.total}</TableCell>
                      <TableCell>{data.covered}</TableCell>
                      <TableCell>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={data.coveragePercent} 
                            color={data.coveragePercent < 50 ? 'warning' : 'success'}
                          />
                          <Typography variant="caption">
                            {Math.round(data.coveragePercent)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={data.passPercent} 
                            color={data.passPercent < 50 ? 'warning' : 'success'}
                          />
                          <Typography variant="caption">
                            {Math.round(data.passPercent)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
      
      {/* Matriz de Rastreabilidade */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40%">Requisito</TableCell>
                <TableCell width="15%">Prioridade</TableCell>
                <TableCell width="15%">Casos de Teste</TableCell>
                <TableCell width="15%">Status</TableCell>
                <TableCell width="15%">Cobertura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matrix.map((item) => (
                <React.Fragment key={item.requirement.id}>
                  <TableRow 
                    hover
                    onClick={() => toggleExpandRow(item.requirement.id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: expandedRows[item.requirement.id] ? 'action.selected' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandRow(item.requirement.id);
                          }}
                        >
                          {expandedRows[item.requirement.id] ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                        <Box>
                          <Typography variant="subtitle2">
                            {item.requirement.code} - {item.requirement.name}
                          </Typography>
                          {item.requirement.description && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.requirement.description.substring(0, 100)}
                              {item.requirement.description.length > 100 ? '...' : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.requirement.priority} 
                        size="small"
                        color={
                          item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica' 
                            ? 'error' 
                            : item.requirement.priority === 'Média' 
                              ? 'warning' 
                              : 'success'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {item.linkedTestCases.length > 0 ? (
                        <Chip 
                          label={item.linkedTestCases.length} 
                          size="small"
                          color={item.linkedTestCases.length > 0 ? 'primary' : 'default'}
                        />
                      ) : (
                        <Tooltip title="Nenhum caso de teste vinculado">
                          <Chip 
                            label="0" 
                            size="small"
                            color="default"
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.executionSummary.passed > 0 && (
                          <Tooltip title={`${item.executionSummary.passed} Passou`}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PassedIcon color="success" fontSize="small" />
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {item.executionSummary.passed}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        
                        {item.executionSummary.failed > 0 && (
                          <Tooltip title={`${item.executionSummary.failed} Falhou`}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FailedIcon color="error" fontSize="small" />
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {item.executionSummary.failed}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        
                        {item.executionSummary.blocked > 0 && (
                          <Tooltip title={`${item.executionSummary.blocked} Bloqueado`}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <BlockedIcon color="warning" fontSize="small" />
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {item.executionSummary.blocked}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        
                        {item.executionSummary.notExecuted > 0 && (
                          <Tooltip title={`${item.executionSummary.notExecuted} Não Executado`}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PendingIcon color="disabled" fontSize="small" />
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {item.executionSummary.notExecuted}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        
                        {item.executionSummary.total === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <CoverageIndicator value={item.coverage} />
                    </TableCell>
                  </TableRow>
                  
                  {/* Linha expandida com detalhes de casos de teste */}
                  {expandedRows[item.requirement.id] && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 0 }}>
                        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Casos de Teste Vinculados
                          </Typography>
                          
                          {item.linkedTestCases.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              Nenhum caso de teste vinculado a este requisito
                            </Alert>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Suite</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Prioridade</TableCell>
                                    <TableCell>Último Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.linkedTestCases.map((testCase) => (
                                    <TableRow key={testCase.id}>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {testCase.name || testCase.title}
                                        </Typography>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <ExecutionStatus status={testCase.lastExecutionStatus} />
                                          <Typography variant="body2" sx={{ ml: 1 }}>
                                            {testCase.lastExecutionStatus || 'Não Executado'}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TraceabilityMatrix; 