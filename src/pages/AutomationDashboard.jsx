import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { automationService } from '../services/automationService';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const StatusBadge = ({ status }) => {
  const getStatusProps = (status) => {
    switch (status) {
      case 'active':
        return { color: 'success', label: 'Ativo' };
      case 'inactive':
        return { color: 'warning', label: 'Inativo' };
      case 'running':
        return { color: 'info', label: 'Em execução' };
      case 'completed':
        return { color: 'success', label: 'Concluído' };
      case 'failed':
        return { color: 'error', label: 'Falhou' };
      case 'pending':
        return { color: 'warning', label: 'Pendente' };
      default:
        return { color: 'default', label: status };
    }
  };

  const { color, label } = getStatusProps(status);
  return <Chip size="small" color={color} label={label} />;
};

const ExecutionItem = ({ execution }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: pt });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={16} />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  return (
    <ListItem divider>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(execution.status)}
            <Typography variant="body2">
              Execução {execution.buildNumber || execution.id.slice(0, 8)}
            </Typography>
          </Box>
        }
        secondary={
          <>
            <Typography variant="caption" display="block">
              Iniciado: {formatDate(execution.startTime)}
            </Typography>
            {execution.endTime && (
              <Typography variant="caption" display="block">
                Finalizado: {formatDate(execution.endTime)}
              </Typography>
            )}
          </>
        }
      />
      <Box>
        <StatusBadge status={execution.status} />
      </Box>
    </ListItem>
  );
};

const AutomationCard = ({ automation, onTrigger, onEdit, onDelete, onViewHistory }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nunca executado';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: pt });
  };

  const successRate = automation.executionCount > 0
    ? (automation.successCount / automation.executionCount) * 100
    : 0;

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {automation.name}
          </Typography>
          <StatusBadge status={automation.status} />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {automation.description}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="body2" component="div">
            <strong>Tipo:</strong> {automation.type === 'ci' ? 'Integração Contínua' : 'Execução programada'}
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Última execução:</strong> {formatDate(automation.lastExecution)}
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Total de execuções:</strong> {automation.executionCount || 0}
          </Typography>
          
          <Box mt={1}>
            <Typography variant="body2" gutterBottom>
              Taxa de sucesso: {successRate.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={successRate}
              color={successRate > 70 ? 'success' : successRate > 40 ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box>
          <Tooltip title="Executar automação">
            <IconButton 
              color="primary" 
              onClick={() => onTrigger(automation.id)}
              disabled={automation.status === 'inactive'}
            >
              <PlayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ver histórico">
            <IconButton color="info" onClick={() => onViewHistory(automation.id)}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Editar">
            <IconButton onClick={() => onEdit(automation)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton color="error" onClick={() => onDelete(automation.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

const IntegrationCard = ({ integration, onEdit, onDelete }) => {
  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {integration.name}
          </Typography>
          <StatusBadge status={integration.status} />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {integration.description}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="body2" component="div">
            <strong>Tipo:</strong> {integration.provider}
          </Typography>
          <Typography variant="body2" component="div">
            <strong>URL do webhook:</strong> 
            <Box component="span" sx={{ 
              display: 'inline-block', 
              maxWidth: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              verticalAlign: 'middle'
            }}>
              {integration.webhookUrl}
            </Box>
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Tooltip title="Editar">
          <IconButton onClick={() => onEdit(integration)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton color="error" onClick={() => onDelete(integration.id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

const AutomationDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [selectedAutomation, setSelectedAutomation] = useState(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [automationForm, setAutomationForm] = useState({
    name: '',
    description: '',
    type: 'ci',
    trigger: 'manual',
    command: '',
    schedule: '',
    status: 'active'
  });
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    description: '',
    provider: 'github',
    repoUrl: '',
    branch: '',
    webhookUrl: '',
    status: 'active'
  });
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar automações
      const { data: automationsData, error: automationsError } = await automationService.getProjectAutomations(projectId);
      if (automationsError) throw new Error(automationsError);
      setAutomations(automationsData || []);
      
      // Carregar integrações
      const { data: integrationsData, error: integrationsError } = await automationService.getProjectIntegrations(projectId);
      if (integrationsError) throw new Error(integrationsError);
      setIntegrations(integrationsData || []);
      
      // Carregar relatório
      const { data: reportData, error: reportError } = await automationService.generateAutomationReport(projectId);
      if (reportError) throw new Error(reportError);
      setReportData(reportData);
    } catch (err) {
      console.error('Erro ao carregar dados de automação:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewHistory = async (automationId) => {
    setSelectedAutomation(automations.find(a => a.id === automationId));
    setHistoryDialogOpen(true);
    
    try {
      const { data, error } = await automationService.getExecutionHistory(automationId);
      if (error) throw new Error(error);
      setExecutionHistory(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setSnackbar({
        open: true,
        message: `Erro ao carregar histórico: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleAddAutomation = () => {
    setAutomationForm({
      name: '',
      description: '',
      type: 'ci',
      trigger: 'manual',
      command: '',
      schedule: '',
      status: 'active'
    });
    setAutomationDialogOpen(true);
  };

  const handleEditAutomation = (automation) => {
    setAutomationForm({
      id: automation.id,
      name: automation.name,
      description: automation.description,
      type: automation.type,
      trigger: automation.trigger,
      command: automation.command,
      schedule: automation.schedule,
      status: automation.status
    });
    setAutomationDialogOpen(true);
  };

  const handleAddIntegration = () => {
    setIntegrationForm({
      name: '',
      description: '',
      provider: 'github',
      repoUrl: '',
      branch: '',
      webhookUrl: '',
      status: 'active'
    });
    setIntegrationDialogOpen(true);
  };

  const handleEditIntegration = (integration) => {
    setIntegrationForm({
      id: integration.id,
      name: integration.name,
      description: integration.description,
      provider: integration.provider,
      repoUrl: integration.repoUrl,
      branch: integration.branch,
      webhookUrl: integration.webhookUrl,
      status: integration.status
    });
    setIntegrationDialogOpen(true);
  };

  const handleSaveAutomation = async () => {
    try {
      const automationData = {
        ...automationForm,
        projectId
      };
      
      let result;
      if (automationForm.id) {
        // Atualizar existente
        result = await automationService.updateAutomation(automationForm.id, automationData);
      } else {
        // Criar novo
        result = await automationService.createAutomation(automationData);
      }
      
      if (result.error) throw new Error(result.error);
      
      setAutomationDialogOpen(false);
      loadData();
      setSnackbar({
        open: true,
        message: `Automação ${automationForm.id ? 'atualizada' : 'criada'} com sucesso!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao salvar automação:', err);
      setSnackbar({
        open: true,
        message: `Erro ao salvar automação: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleSaveIntegration = async () => {
    try {
      const integrationData = {
        ...integrationForm,
        projectId
      };
      
      const { data, error } = await automationService.setupCIIntegration(integrationData);
      if (error) throw new Error(error);
      
      setIntegrationDialogOpen(false);
      loadData();
      setSnackbar({
        open: true,
        message: 'Integração configurada com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao configurar integração:', err);
      setSnackbar({
        open: true,
        message: `Erro ao configurar integração: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (deleteType === 'automation') {
      handleDeleteAutomation(itemToDelete);
    } else if (deleteType === 'integration') {
      handleDeleteIntegration(itemToDelete);
    }
    
    setConfirmDeleteDialogOpen(false);
    setItemToDelete(null);
    setDeleteType('');
  };

  const handleDeleteAutomation = async (automationId) => {
    try {
      const { error } = await automationService.deleteAutomation(automationId);
      if (error) throw new Error(error);
      
      setAutomations(automations.filter(a => a.id !== automationId));
      setSnackbar({
        open: true,
        message: 'Automação excluída com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir automação:', err);
      setSnackbar({
        open: true,
        message: `Erro ao excluir automação: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    try {
      // Aqui você implementaria a função de excluir integração no serviço
      // Por enquanto, vamos apenas remover do estado local
      setIntegrations(integrations.filter(i => i.id !== integrationId));
      setSnackbar({
        open: true,
        message: 'Integração excluída com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir integração:', err);
      setSnackbar({
        open: true,
        message: `Erro ao excluir integração: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleTriggerAutomation = async (automationId) => {
    try {
      const { data, error } = await automationService.recordExecution(automationId, {
        status: 'running',
        triggerType: 'manual'
      });
      
      if (error) throw new Error(error);
      
      setSnackbar({
        open: true,
        message: 'Automação iniciada com sucesso!',
        severity: 'success'
      });
      
      // Atualizar a lista de automações
      loadData();
    } catch (err) {
      console.error('Erro ao iniciar automação:', err);
      setSnackbar({
        open: true,
        message: `Erro ao iniciar automação: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1600px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Automação e CI/CD
          </Typography>
          <Box>
            <Tooltip title="Atualizar">
              <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Painel de métricas */}
        {reportData && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Métricas de Automação
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" color="primary">
                    {reportData.automationCount}
                  </Typography>
                  <Typography variant="body1">Automações configuradas</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" color="primary">
                    {reportData.totalExecutions}
                  </Typography>
                  <Typography variant="body1">Execuções totais</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" color={reportData.successRate > 70 ? 'success.main' : 'error.main'}>
                    {reportData.successRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">Taxa de sucesso</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h5" color="primary">
                    {reportData.successfulExecutions}/{reportData.totalExecutions}
                  </Typography>
                  <Typography variant="body1">Execuções bem-sucedidas</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Box sx={{ mb: 4 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Automações" icon={<CodeIcon />} iconPosition="start" />
            <Tab label="Integrações CI/CD" icon={<LinkIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            <Box display="flex" justifyContent="flex-end" mb={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAutomation}
              >
                Nova Automação
              </Button>
            </Box>

            <Grid container spacing={3}>
              {automations.length > 0 ? (
                automations.map((automation) => (
                  <Grid item xs={12} sm={6} md={4} key={automation.id}>
                    <AutomationCard
                      automation={automation}
                      onTrigger={handleTriggerAutomation}
                      onEdit={handleEditAutomation}
                      onDelete={(id) => {
                        setItemToDelete(id);
                        setDeleteType('automation');
                        setConfirmDeleteDialogOpen(true);
                      }}
                      onViewHistory={handleViewHistory}
                    />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Nenhuma automação configurada
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Configure automações para executar seus testes automaticamente.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddAutomation}
                    >
                      Configurar Automação
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Box display="flex" justifyContent="flex-end" mb={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddIntegration}
              >
                Nova Integração
              </Button>
            </Box>

            <Grid container spacing={3}>
              {integrations.length > 0 ? (
                integrations.map((integration) => (
                  <Grid item xs={12} sm={6} md={4} key={integration.id}>
                    <IntegrationCard
                      integration={integration}
                      onEdit={handleEditIntegration}
                      onDelete={(id) => {
                        setItemToDelete(id);
                        setDeleteType('integration');
                        setConfirmDeleteDialogOpen(true);
                      }}
                    />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Nenhuma integração CI/CD configurada
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Configure integrações CI/CD para automatizar seus fluxos de trabalho.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddIntegration}
                    >
                      Configurar Integração
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* Diálogos */}
        {/* Diálogo de Histórico de Execução */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Histórico de Execuções - {selectedAutomation?.name}
          </DialogTitle>
          <DialogContent dividers>
            {executionHistory.length > 0 ? (
              <List>
                {executionHistory.map((execution) => (
                  <ExecutionItem key={execution.id} execution={execution} />
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  Nenhuma execução encontrada para esta automação.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Automação */}
        <Dialog
          open={automationDialogOpen}
          onClose={() => setAutomationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {automationForm.id ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome da Automação"
                  value={automationForm.name}
                  onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={automationForm.description}
                  onChange={(e) => setAutomationForm({ ...automationForm, description: e.target.value })}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={automationForm.type}
                    onChange={(e) => setAutomationForm({ ...automationForm, type: e.target.value })}
                    label="Tipo"
                  >
                    <MenuItem value="ci">Integração Contínua</MenuItem>
                    <MenuItem value="scheduled">Execução Programada</MenuItem>
                    <MenuItem value="webhook">Webhook</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gatilho</InputLabel>
                  <Select
                    value={automationForm.trigger}
                    onChange={(e) => setAutomationForm({ ...automationForm, trigger: e.target.value })}
                    label="Gatilho"
                  >
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="commit">Por Commit</MenuItem>
                    <MenuItem value="schedule">Agendado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {automationForm.trigger === 'schedule' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Agendamento (cron)"
                    value={automationForm.schedule}
                    onChange={(e) => setAutomationForm({ ...automationForm, schedule: e.target.value })}
                    helperText="Expressão cron (Ex: 0 0 * * * para diário às 00:00)"
                    margin="normal"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Comando"
                  value={automationForm.command}
                  onChange={(e) => setAutomationForm({ ...automationForm, command: e.target.value })}
                  helperText="Comando a ser executado (Ex: npm test)"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={automationForm.status}
                    onChange={(e) => setAutomationForm({ ...automationForm, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAutomationDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveAutomation}
              variant="contained"
              color="primary"
              disabled={!automationForm.name}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Integração */}
        <Dialog
          open={integrationDialogOpen}
          onClose={() => setIntegrationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {integrationForm.id ? 'Editar Integração' : 'Nova Integração CI/CD'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome da Integração"
                  value={integrationForm.name}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={integrationForm.description}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, description: e.target.value })}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Provedor</InputLabel>
                  <Select
                    value={integrationForm.provider}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, provider: e.target.value })}
                    label="Provedor"
                  >
                    <MenuItem value="github">GitHub</MenuItem>
                    <MenuItem value="gitlab">GitLab</MenuItem>
                    <MenuItem value="jenkins">Jenkins</MenuItem>
                    <MenuItem value="azure">Azure DevOps</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={integrationForm.status}
                    onChange={(e) => setIntegrationForm({ ...integrationForm, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="active">Ativo</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL do Repositório"
                  value={integrationForm.repoUrl}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, repoUrl: e.target.value })}
                  helperText="URL do repositório Git"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Branch"
                  value={integrationForm.branch}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, branch: e.target.value })}
                  helperText="Branch a ser monitorada (Ex: main, master)"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL do Webhook"
                  value={integrationForm.webhookUrl}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
                  helperText="URL do webhook (será gerada automaticamente)"
                  margin="normal"
                  disabled={!integrationForm.id}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIntegrationDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveIntegration}
              variant="contained"
              color="primary"
              disabled={!integrationForm.name}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Confirmação de Exclusão */}
        <Dialog
          open={confirmDeleteDialogOpen}
          onClose={() => setConfirmDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para mensagens */}
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
      </motion.div>
    </Box>
  );
};

export default AutomationDashboard; 