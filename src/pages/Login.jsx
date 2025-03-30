import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background-color: rgba(18, 18, 18, 0.8);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 160, 252, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 160, 252, 0.2);
`;

const Logo = styled.img`
  width: 140px;
  height: auto;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    background-color: rgba(18, 18, 18, 0.6);
    border-radius: 8px;
    
    &:hover fieldset {
      border-color: #00a0fc;
    }
    
    &.Mui-focused fieldset {
      border-color: #00a0fc;
    }
  }
  
  & .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.7);
    
    &.Mui-focused {
      color: #00a0fc;
    }
  }
  
  & .MuiOutlinedInput-input {
    color: #ffffff;
  }
`;

const LoginButton = styled(Button)`
  background: linear-gradient(45deg, #00a0fc 30%, #33b3fd 90%);
  color: #ffffff;
  padding: 12px;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8px;
  text-transform: none;
  
  &:hover {
    background: linear-gradient(45deg, #0070b0 30%, #00a0fc 90%);
    box-shadow: 0 3px 10px rgba(0, 160, 252, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const RegisterButton = styled(Button)`
  color: #00a0fc;
  margin-top: 16px;
  text-transform: none;
  
  &:hover {
    background-color: rgba(0, 160, 252, 0.1);
  }
`;

const ForgotPassword = styled(Typography)`
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: #00a0fc;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  & .MuiFormControlLabel-label {
    color: rgba(255, 255, 255, 0.7);
  }
  & .MuiCheckbox-root {
    color: rgba(255, 255, 255, 0.7);
    &.Mui-checked {
      color: #00a0fc;
    }
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'qa_analyst',
    message: ''
  });
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Carregar credenciais salvas ao montar o componente
  useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials);
      setFormData({ email, password });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (loading) return; // Evita cliques múltiplos
    
    setLoading(true);
    
    try {
      const { user, error } = await login(formData.email, formData.password);
      
      if (error) {
        throw new Error(error);
      }
      
      if (!user) {
        throw new Error('Falha no login. Tente novamente.');
      }
      
      console.log('Login bem-sucedido:', user);
      
      // Salvar ou remover credenciais com base no checkbox
      if (rememberMe) {
        localStorage.setItem('savedCredentials', JSON.stringify({
          email: formData.email,
          password: formData.password
        }));
      } else {
        localStorage.removeItem('savedCredentials');
      }
      
      // Navegação para home
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Erro no login:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao fazer login. Tente novamente.',
        severity: 'error'
      });
      setLoading(false); // Garante que loading é definido como false em caso de erro
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'As senhas não coincidem.',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Implementar o envio da solicitação de registro para o Firebase
      const accessRequestData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        requestedRole: registerData.role,
        status: 'pending',
        message: registerData.message,
        createdAt: new Date()
      };
      
      // Salvar no Firebase
      const accessRequestRef = collection(db, 'accessRequests');
      await addDoc(accessRequestRef, accessRequestData);
      
      setSnackbar({
        open: true,
        message: 'Solicitação de registro enviada com sucesso! Aguarde a aprovação do administrador.',
        severity: 'success'
      });
      
      setShowRegisterDialog(false);
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'qa_analyst',
        message: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao enviar solicitação. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setSnackbar({
        open: true,
        message: 'Por favor, informe seu e-mail.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        throw new Error(error);
      }
      
      setResetSent(true);
      setSnackbar({
        open: true,
        message: 'E-mail de recuperação enviado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleResetClose = () => {
    setShowResetPasswordDialog(false);
    setResetEmail('');
    setResetSent(false);
  };

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoginCard>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Logo src="/src/assets/logo-tectonic.svg" alt="Tectonic TCMS Logo" />
            <Typography variant="h5" sx={{ color: '#ffffff', mb: 1 }}>
              Bem-vindo ao Tectonic TCMS
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
              Entre com suas credenciais para continuar
            </Typography>
          </Box>

          <Form onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <StyledTextField
              fullWidth
              label="Senha"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StyledFormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    name="rememberMe"
                    disabled={loading}
                  />
                }
                label="Lembrar-me"
              />
              <ForgotPassword 
                variant="body2"
                onClick={() => setShowResetPasswordDialog(true)}
              >
                Esqueceu sua senha?
              </ForgotPassword>
            </Box>

            <LoginButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </LoginButton>
          </Form>

          <Box sx={{ textAlign: 'center' }}>
            <RegisterButton
              startIcon={<PersonAddIcon />}
              onClick={() => setShowRegisterDialog(true)}
              disabled={loading}
            >
              Solicitar Acesso
            </RegisterButton>
          </Box>
        </LoginCard>
      </motion.div>

      {/* Diálogo de Registro */}
      <Dialog 
        open={showRegisterDialog} 
        onClose={() => !loading && setShowRegisterDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 160, 252, 0.2)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Solicitar Acesso
        </DialogTitle>
        
        <DialogContent>
          <Form onSubmit={handleRegisterSubmit}>
            <StyledTextField
              fullWidth
              label="Nome Completo"
              name="name"
              value={registerData.name}
              onChange={handleRegisterChange}
              required
              margin="normal"
            />
            
            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={registerData.email}
              onChange={handleRegisterChange}
              required
              margin="normal"
            />
            
            <StyledTextField
              fullWidth
              label="Senha"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={registerData.password}
              onChange={handleRegisterChange}
              required
              margin="normal"
            />
            
            <StyledTextField
              fullWidth
              label="Confirmar Senha"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={registerData.confirmPassword}
              onChange={handleRegisterChange}
              required
              margin="normal"
            />
            
            <StyledTextField
              fullWidth
              label="Mensagem (opcional)"
              name="message"
              multiline
              rows={3}
              value={registerData.message}
              onChange={handleRegisterChange}
              margin="normal"
              placeholder="Descreva brevemente por que você precisa de acesso ao sistema"
            />
          </Form>
        </DialogContent>
        
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setShowRegisterDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <LoginButton
            onClick={handleRegisterSubmit}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </LoginButton>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Recuperação de Senha */}
      <Dialog
        open={showResetPasswordDialog}
        onClose={handleResetClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 160, 252, 0.2)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Recuperar Senha
        </DialogTitle>
        
        <DialogContent>
          {resetSent ? (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                E-mail de recuperação enviado com sucesso!
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </Typography>
              <StyledTextField
                fullWidth
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={handleResetClose}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {resetSent ? 'Fechar' : 'Cancelar'}
          </Button>
          {!resetSent && (
            <LoginButton
              onClick={handleResetPassword}
              disabled={loading || !resetEmail}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </LoginButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 