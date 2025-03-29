import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { testSuiteService } from '../services/testSuiteService';

const TestSuiteEdit = () => {
  const { projectId, suiteId } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSuite = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Carregando detalhes da suite:', suiteId);

        const { data, error } = await testSuiteService.getTestSuiteById(suiteId);
        
        if (error) {
          throw new Error(error);
        }

        if (!data) {
          throw new Error('Suite de teste não encontrada');
        }

        setSuite(data);
        setFormData({
          name: data.name,
          description: data.description
        });
      } catch (err) {
        console.error('Erro ao carregar suite:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId) {
      loadSuite();
    }
  }, [suiteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validações
      if (!formData.name.trim()) {
        throw new Error('O nome da suite é obrigatório');
      }

      const { error } = await testSuiteService.updateTestSuite(suiteId, {
        name: formData.name,
        description: formData.description
      });

      if (error) {
        throw new Error(error);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/projects/${projectId}/suites/${suiteId}`);
      }, 1500);
    } catch (err) {
      console.error('Erro ao salvar suite:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !suite) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              Voltar para o Projeto
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          Editar Suite de Teste
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate(`/projects/${projectId}/suites/${suiteId}`)}
        >
          Cancelar
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Suite de teste atualizada com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nome da Suite"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Descrição"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  sx={{ ml: 2 }}
                >
                  {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TestSuiteEdit; 