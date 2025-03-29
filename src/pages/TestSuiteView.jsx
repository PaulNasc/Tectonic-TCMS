import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { testSuiteService } from '../services/testSuiteService';
import LoadingScreen from '../components/LoadingScreen';

export default function TestSuiteView() {
  const { suiteId } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSuite = async () => {
      try {
        console.log('Carregando suite:', suiteId);
        setLoading(true);
        setError(null);

        const { data, error } = await testSuiteService.getTestSuiteById(suiteId);
        
        if (error) {
          console.error('Erro ao carregar suite:', error);
          setError(error);
          return;
        }

        if (!data) {
          console.error('Suite não encontrada');
          setError('Suite de teste não encontrada');
          return;
        }

        console.log('Suite carregada:', data);
        setSuite(data);
      } catch (err) {
        console.error('Erro inesperado ao carregar suite:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId) {
      loadSuite();
    }
  }, [suiteId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!suite) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Suite de teste não encontrada
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {suite.name}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {suite.description}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Casos de Teste ({suite.testCases?.length || 0})
        </Typography>

        {suite.testCases?.length > 0 ? (
          suite.testCases.map((testCase, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle1">
                {testCase.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {testCase.description}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">
            Nenhum caso de teste cadastrado
          </Typography>
        )}
      </Box>
    </Box>
  );
} 