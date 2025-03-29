import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const NeonPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 160, 252, 0.2)',
  boxShadow: '0 0 20px rgba(0, 160, 252, 0.1)',
  '&:hover': {
    boxShadow: '0 0 30px rgba(0, 160, 252, 0.2)',
  },
}));

const NeonButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
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

const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
      }}
    >
      <NeonPaper elevation={3} sx={{ width: '100%', maxWidth: 400 }}>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            color: '#00a0fc',
            textShadow: '0 0 10px rgba(0, 160, 252, 0.5)',
            marginBottom: 3,
          }}
        >
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <NeonTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <NeonTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <NeonButton
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Entrar
          </NeonButton>
        </Box>
      </NeonPaper>
    </Box>
  );
};

export default LoginForm; 