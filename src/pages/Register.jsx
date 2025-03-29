import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { createAccessRequest, checkEmailExists } from '../services/userService';

const Container = styled(Box)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  padding: 24px;
`;

const RegisterCard = styled(Box)`
  background-color: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px 0 rgba(0, 160, 252, 0.1);
  border: 1px solid rgba(0, 160, 252, 0.2);
`;

const Logo = styled('img')`
  width: 120px;
  height: auto;
  margin-bottom: 24px;
`;

const Form = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    background-color: rgba(18, 18, 18, 0.6);
    
    & fieldset {
      border-color: rgba(255, 255, 255, 0.23);
    }
    
    &:hover fieldset {
      border-color: #00a0fc;
    }
    
    &.Mui-focused fieldset {
      border-color: #00a0fc;
    }
  }
  
  & .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.7);
  }
  
  & .MuiOutlinedInput-input {
    color: #ffffff;
  }
`;

const RegisterButton = styled(Button)`
  background: linear-gradient(45deg, #00a0fc 30%, #33b3fd 90%);
  color: white;
  padding: 12px;
  text-transform: none;
  font-size: 16px;
  margin-top: 16px;
  
  &:hover {
    background: linear-gradient(45deg, #0070b0 30%, #00a0fc 90%);
  }
  
  &.Mui-disabled {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.3);
  }
`;

const LoginLink = styled(Link)`
  color: #00a0fc;
  text-decoration: none;
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
  display: block;
  
  &:hover {
    text-decoration: underline;
  }
`;

const roles = {
  qa_analyst: 'Analista QA',
  developer: 'Desenvolvedor',
  viewer: 'Visualizador'
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (!formData.role) {
      setError('Selecione um cargo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      // Verificar se o email já está em uso
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setError('Este email já está em uso');
        return;
      }

      // Criar solicitação de acesso
      await createAccessRequest({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError('Erro ao criar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <RegisterCard>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Logo src="/src/assets/logo-hybex.svg" alt="Hybex Logo" />
          <Typography variant="h5" sx={{ color: '#ffffff', mb: 1 }}>
            Criar Conta
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Preencha os dados para solicitar acesso
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Solicitação enviada com sucesso! Você será redirecionado para o login.
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <StyledTextField
            fullWidth
            label="Nome completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />

          <StyledTextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />

          <StyledTextField
            fullWidth
            label="Senha"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            label="Confirmar senha"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            select
            label="Cargo"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={loading}
          >
            {Object.entries(roles).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </StyledTextField>

          <RegisterButton
            type="submit"
            fullWidth
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Enviando...' : 'Solicitar Acesso'}
          </RegisterButton>
        </Form>

        <LoginLink to="/login">
          Já tem uma conta? Faça login
        </LoginLink>
      </RegisterCard>
    </Container>
  );
};

export default Register; 