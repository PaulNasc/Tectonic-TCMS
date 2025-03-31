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
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme
} from '@mui/material';
import { 
  Save as SaveIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  PhotoCamera as PhotoCameraIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Loop as ActivityIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    photoURL: '',
    role: '',
    lastLogin: new Date(),
    createdAt: new Date()
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: user.role || 'user',
        lastLogin: user.lastLogin?.toDate() || new Date(),
        createdAt: user.createdAt?.toDate() || new Date()
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

  const formatDate = (date) => {
    try {
      return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data não disponível';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getRoleLabel = (role) => {
    const roles = {
      'admin': { label: 'Administrador', color: 'error' },
      'manager': { label: 'Gerente', color: 'warning' },
      'user': { label: 'Usuário', color: 'primary' }
    };
    
    return roles[role] || { label: 'Usuário', color: 'primary' };
  };

  // Dados simulados de atividades recentes
  const recentActivities = [
    { 
      type: 'test_execution', 
      title: 'Execução de teste concluída', 
      description: 'Suite: Testes de Login', 
      date: new Date(Date.now() - 60*60*1000), 
      status: 'success',
      icon: <CheckCircleIcon color="success" />
    },
    { 
      type: 'project_creation', 
      title: 'Projeto criado', 
      description: 'Nome: Sistema de Pagamentos', 
      date: new Date(Date.now() - 24*60*60*1000), 
      status: 'normal',
      icon: <AssignmentIcon color="primary" />
    },
    { 
      type: 'requirement_link', 
      title: 'Requisitos vinculados', 
      description: '5 Requisitos atualizados', 
      date: new Date(Date.now() - 2*24*60*60*1000), 
      status: 'normal',
      icon: <ActivityIcon color="secondary" />
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 'bold', 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(45deg, #4F46E5, #0EA5E9)' 
          : 'linear-gradient(45deg, #1E40AF, #0284C7)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent'
      }}>
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
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={profileData.photoURL}
                alt={profileData.name}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  border: `4px solid ${theme.palette.primary.main}`,
                  boxShadow: '0 0 15px rgba(0, 160, 252, 0.4)'
                }}
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
              
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {profileData.name || 'Usuário'}
              </Typography>
              
              <Chip 
                label={getRoleLabel(profileData.role).label} 
                color={getRoleLabel(profileData.role).color}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                {profileData.email}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary="Último acesso" 
                  secondary={formatDate(profileData.lastLogin)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary="Membro desde" 
                  secondary={formatDate(profileData.createdAt)}
                />
              </ListItem>
            </List>
            
            <Box mt={2}>
              <Button 
                variant="outlined" 
                fullWidth 
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/settings')}
                sx={{ mb: 1 }}
              >
                Configurações do Sistema
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': { fontWeight: 'bold' }
              }}
            >
              <Tab icon={<PersonIcon />} label="Dados Pessoais" iconPosition="start" />
              <Tab icon={<SecurityIcon />} label="Segurança" iconPosition="start" />
              <Tab icon={<ActivityIcon />} label="Atividades Recentes" iconPosition="start" />
            </Tabs>
            
            {/* Tab 1: Informações Pessoais */}
            {activeTab === 0 && (
              <Box p={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Informações Pessoais
                  </Typography>
                  
                  <Button
                    variant={editingProfile ? "contained" : "outlined"}
                    startIcon={editingProfile ? <SaveIcon /> : <EditIcon />}
                    onClick={() => !loading && (editingProfile ? handleUpdateProfile() : setEditingProfile(true))}
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
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        name="email"
                        value={profileData.email}
                        fullWidth
                        disabled={true}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                        }}
                      />
                    </Grid>
                  </Grid>
                </form>
              </Box>
            )}
            
            {/* Tab 2: Segurança */}
            {activeTab === 1 && (
              <Box p={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Alterar Senha
                  </Typography>
                  
                  <Button
                    variant={editingPassword ? "contained" : "outlined"}
                    startIcon={editingPassword ? <SaveIcon /> : <EditIcon />}
                    onClick={() => !loading && (editingPassword ? handleUpdatePassword() : setEditingPassword(true))}
                    disabled={loading}
                  >
                    {editingPassword ? 'Salvar' : 'Editar'}
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <form onSubmit={handleUpdatePassword}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Senha atual"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        disabled={!editingPassword || loading}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nova senha"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        disabled={!editingPassword || loading}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirmar nova senha"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        disabled={!editingPassword || loading}
                        required
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </form>
              </Box>
            )}
            
            {/* Tab 3: Atividades Recentes */}
            {activeTab === 2 && (
              <Box p={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Histórico de Atividades
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <List>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          {activity.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {activity.description}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {formatDate(activity.date)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile; 
 
 
 