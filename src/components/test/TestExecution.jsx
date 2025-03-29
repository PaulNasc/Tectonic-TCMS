import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  SkipNext as SkipIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { testPlanService } from '../../services/testPlanService';

const NeonPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
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

const TestExecution = ({ testPlanId }) => {
  const [testPlan, setTestPlan] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTestPlan();
  }, [testPlanId]);

  const loadTestPlan = async () => {
    try {
      const data = await testPlanService.getTestPlan(testPlanId);
      setTestPlan(data);
      setTestResults(data.testCases.map(() => ({
        status: 'pending',
        notes: '',
      })));
    } catch (error) {
      setError('Erro ao carregar plano de teste');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTestResult = (status) => {
    const newResults = [...testResults];
    newResults[activeStep] = {
      ...newResults[activeStep],
      status,
    };
    setTestResults(newResults);
  };

  const handleNotesChange = (event) => {
    const newResults = [...testResults];
    newResults[activeStep] = {
      ...newResults[activeStep],
      notes: event.target.value,
    };
    setTestResults(newResults);
  };

  const getStepContent = (step) => {
    if (!testPlan) return null;

    const testCase = testPlan.testCases[step];
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
          Descrição
        </Typography>
        <Typography sx={{ color: '#ffffff', mb: 3 }}>
          {testCase.description}
        </Typography>

        <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
          Passos
        </Typography>
        <Typography sx={{ color: '#ffffff', mb: 3, whiteSpace: 'pre-line' }}>
          {testCase.steps}
        </Typography>

        <Typography variant="h6" sx={{ color: '#00a0fc', mb: 2 }}>
          Resultado Esperado
        </Typography>
        <Typography sx={{ color: '#ffffff', mb: 3 }}>
          {testCase.expectedResult}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Tooltip title="Passou">
            <IconButton
              onClick={() => handleTestResult('passed')}
              sx={{
                color: testResults[step]?.status === 'passed' ? '#4caf50' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Falhou">
            <IconButton
              onClick={() => handleTestResult('failed')}
              sx={{
                color: testResults[step]?.status === 'failed' ? '#f44336' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bloqueado">
            <IconButton
              onClick={() => handleTestResult('blocked')}
              sx={{
                color: testResults[step]?.status === 'blocked' ? '#ff9800' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <SkipIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <NeonTextField
          fullWidth
          multiline
          rows={4}
          label="Observações"
          value={testResults[step]?.notes || ''}
          onChange={handleNotesChange}
        />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#00a0fc' }}>Carregando...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ color: '#f44336' }}>{error}</Typography>
      </Box>
    );
  }

  if (!testPlan) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ color: '#00a0fc', textShadow: '0 0 10px rgba(0, 160, 252, 0.5)' }}
      >
        Execução de Testes: {testPlan.title}
      </Typography>

      <NeonPaper elevation={3}>
        <Stepper
          activeStep={activeStep}
          sx={{
            '& .MuiStepLabel-label': {
              color: '#ffffff',
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: '#00a0fc',
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: '#4caf50',
            },
            '& .MuiStepIcon-root': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#00a0fc',
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#4caf50',
            },
          }}
        >
          {testPlan.testCases.map((_, index) => (
            <Step key={index}>
              <StepLabel>
                Caso de Teste {index + 1}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
          <NeonButton
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Anterior
          </NeonButton>
          <NeonButton
            onClick={handleNext}
            disabled={activeStep === testPlan.testCases.length - 1}
          >
            Próximo
          </NeonButton>
        </Box>
      </NeonPaper>
    </Box>
  );
};

export default TestExecution; 