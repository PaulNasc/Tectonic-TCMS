import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Divider, 
  Avatar, 
  Alert, 
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    photoURL: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!profileData.name.trim()) {
        throw new Error('O nome é obrigatório');
      }

      // Simulação de atualização - substituir pela função real
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Chamar função de atualização do contexto
      // await updateProfile({
      //   name: profileData.name,
      //   photoURL: profileData.photoURL
      // });

      setSuccess('Perfil atualizado com sucesso!');
      setEditingProfile(false);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!passwordData.currentPassword) {
        throw new Error('A senha atual é obrigatória');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      // Simulação de atualização - substituir pela função real
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Chamar função de atualização de senha do contexto
      // await updatePassword(passwordData.currentPassword, passwordData.newPassword);

      setSuccess('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setEditingPassword(false);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={profileData.photoURL}
                alt={profileData.name}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {profileData.name?.charAt(0) || <PersonIcon />}
              </Avatar>
              
              <IconButton 
                color="primary" 
                component="label" 
                sx={{ mb: 2 }}
                disabled={!editingProfile}
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) => {
                    // Lógica para upload de imagem
                    console.log(e.target.files[0]);
                  }}
                />
                <PhotoCameraIcon />
              </IconButton>
              
              <Typography variant="h6" gutterBottom>
                {profileData.name || 'Usuário'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profileData.email}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações Pessoais
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={editingProfile ? <SaveIcon /> : <EditIcon />}
                onClick={() => !loading && (editingProfile ? handleUpdateProfile : setEditingProfile(true))}
                disabled={loading}
              >
                {editingProfile ? 'Salvar' : 'Editar'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <form onSubmit={handleUpdateProfile}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nome"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    fullWidth
                    disabled={!editingProfile || loading}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    name="email"
                    value={profileData.email}
                    fullWidth
                    disabled={true}
                    InputProps={{
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>
                
                {editingProfile && (
                  <Grid item xs={12} textAlign="right">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      Salvar Alterações
                    </Button>
                  </Grid>
                )}
              </Grid>
            </form>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Alterar Senha
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={editingPassword ? <SaveIcon /> : <EditIcon />}
                onClick={() => !loading && (editingPassword ? handleUpdatePassword : setEditingPassword(true))}
                disabled={loading}
              >
                {editingPassword ? 'Salvar' : 'Editar'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {editingPassword ? (
              <form onSubmit={handleUpdatePassword}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Senha Atual"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nova Senha"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirmar Nova Senha"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} textAlign="right">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      Atualizar Senha
                    </Button>
                  </Grid>
                </Grid>
              </form>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Clique em "Editar" para alterar sua senha.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile; 
 
 
 