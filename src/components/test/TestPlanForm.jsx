import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const NeonPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 160, 252, 0.2)',
  boxShadow: '0 0 20px rgba(0, 160, 252, 0.1)',
}));

const NeonTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(0, 160, 252, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 160, 252, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00a0fc',
      boxShadow: '0 0 10px rgba(0, 160, 252, 0.3)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#00a0fc',
    },
  },
  '& .MuiInputBase-input': {
    color: '#ffffff',
  },
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

const TestPlanForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    priority: 'medium',
    status: 'draft',
    testCases: [{ description: '', expectedResult: '', steps: '' }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = {
      ...newTestCases[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      testCases: newTestCases
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { description: '', expectedResult: '', steps: '' }
      ]
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <NeonPaper elevation={3}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: '#00a0fc', textShadow: '0 0 10px rgba(0, 160, 252, 0.5)' }}
        >
          {initialData ? 'Editar Plano de Testes' : 'Novo Plano de Testes'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <NeonTextField
                fullWidth
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <NeonTextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Prioridade</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Prioridade"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 160, 252, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 160, 252, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00a0fc',
                      boxShadow: '0 0 10px rgba(0, 160, 252, 0.3)',
                    },
                  }}
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 160, 252, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 160, 252, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00a0fc',
                      boxShadow: '0 0 10px rgba(0, 160, 252, 0.3)',
                    },
                  }}
                >
                  <MenuItem value="draft">Rascunho</MenuItem>
                  <MenuItem value="in_progress">Em Progresso</MenuItem>
                  <MenuItem value="completed">Concluído</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
                Casos de Teste
              </Typography>
              {formData.testCases.map((testCase, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid rgba(0, 160, 252, 0.2)', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ color: '#ffffff' }}>Caso de Teste #{index + 1}</Typography>
                    <Tooltip title="Remover caso de teste">
                      <IconButton
                        onClick={() => removeTestCase(index)}
                        sx={{ color: '#ff4444' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <NeonTextField
                        fullWidth
                        label="Descrição"
                        value={testCase.description}
                        onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <NeonTextField
                        fullWidth
                        label="Passos"
                        value={testCase.steps}
                        onChange={(e) => handleTestCaseChange(index, 'steps', e.target.value)}
                        multiline
                        rows={3}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <NeonTextField
                        fullWidth
                        label="Resultado Esperado"
                        value={testCase.expectedResult}
                        onChange={(e) => handleTestCaseChange(index, 'expectedResult', e.target.value)}
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Tooltip title="Adicionar caso de teste">
                <IconButton
                  onClick={addTestCase}
                  sx={{ color: '#00a0fc', mt: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <NeonButton type="submit">
                  {initialData ? 'Atualizar' : 'Criar'} Plano de Testes
                </NeonButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </NeonPaper>
    </Box>
  );
};

export default TestPlanForm; 