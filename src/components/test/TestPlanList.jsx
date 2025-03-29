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
  IconButton,
  Chip,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { testPlanService } from '../../services/testPlanService';

const NeonPaper = styled(Paper)(({ theme }) => ({
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
  backgroundColor: status === 'completed' 
    ? 'rgba(76, 175, 80, 0.2)'
    : status === 'in_progress'
    ? 'rgba(33, 150, 243, 0.2)'
    : 'rgba(158, 158, 158, 0.2)',
  color: status === 'completed'
    ? '#4caf50'
    : status === 'in_progress'
    ? '#2196f3'
    : '#9e9e9e',
  border: `1px solid ${
    status === 'completed'
      ? 'rgba(76, 175, 80, 0.3)'
      : status === 'in_progress'
      ? 'rgba(33, 150, 243, 0.3)'
      : 'rgba(158, 158, 158, 0.3)'
  }`,
}));

const PriorityChip = styled(Chip)(({ priority }) => ({
  backgroundColor: priority === 'high'
    ? 'rgba(244, 67, 54, 0.2)'
    : priority === 'medium'
    ? 'rgba(255, 152, 0, 0.2)'
    : 'rgba(76, 175, 80, 0.2)',
  color: priority === 'high'
    ? '#f44336'
    : priority === 'medium'
    ? '#ff9800'
    : '#4caf50',
  border: `1px solid ${
    priority === 'high'
      ? 'rgba(244, 67, 54, 0.3)'
      : priority === 'medium'
      ? 'rgba(255, 152, 0, 0.3)'
      : 'rgba(76, 175, 80, 0.3)'
  }`,
}));

const TestPlanList = ({ onEdit, onDelete, onCreate }) => {
  const [testPlans, setTestPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestPlans();
  }, []);

  const loadTestPlans = async () => {
    try {
      const data = await testPlanService.getTestPlans();
      setTestPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos de teste:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de teste?')) {
      try {
        await testPlanService.deleteTestPlan(id);
        loadTestPlans();
      } catch (error) {
        console.error('Erro ao excluir plano de teste:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Progresso';
      default:
        return 'Rascunho';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      default:
        return 'Baixa';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#00a0fc' }}>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ color: '#00a0fc', textShadow: '0 0 10px rgba(0, 160, 252, 0.5)' }}
        >
          Planos de Teste
        </Typography>
        <Tooltip title="Novo Plano de Teste">
          <NeonButton
            startIcon={<AddIcon />}
            onClick={onCreate}
          >
            Novo Plano
          </NeonButton>
        </Tooltip>
      </Box>

      <TableContainer component={NeonPaper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#00a0fc' }}>Título</TableCell>
              <TableCell sx={{ color: '#00a0fc' }}>Status</TableCell>
              <TableCell sx={{ color: '#00a0fc' }}>Prioridade</TableCell>
              <TableCell sx={{ color: '#00a0fc' }}>Criado em</TableCell>
              <TableCell sx={{ color: '#00a0fc' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell sx={{ color: '#ffffff' }}>{plan.title}</TableCell>
                <TableCell>
                  <StatusChip
                    label={getStatusLabel(plan.status)}
                    status={plan.status}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <PriorityChip
                    label={getPriorityLabel(plan.priority)}
                    priority={plan.priority}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ color: '#ffffff' }}>
                  {formatDate(plan.created_at)}
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => onEdit(plan)}
                      sx={{ color: '#00a0fc' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      onClick={() => handleDelete(plan.id)}
                      sx={{ color: '#ff4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TestPlanList; 