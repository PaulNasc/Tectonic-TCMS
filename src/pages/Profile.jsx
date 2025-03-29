import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Box,
  Typography,
  Card,
  Avatar,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileCard = styled(Card)`
  padding: 32px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
`;

const AvatarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
`;

const LargeAvatar = styled(Avatar)`
  width: 120px;
  height: 120px;
  font-size: 3rem;
  background-color: var(--neon-primary);
  color: #000;
  margin-bottom: 16px;
`;

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: user?.displayName || 'Usuário',
    email: user?.email || '',
    role: 'Administrador',
    department: 'QA'
  });

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: user?.displayName || 'Usuário',
      email: user?.email || '',
      role: 'Administrador',
      department: 'QA'
    });
  };

  const handleSave = () => {
    // Aqui implementaremos a lógica de salvar as alterações
    setEditing(false);
    setSnackbar({
      open: true,
      message: 'Perfil atualizado com sucesso!',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: 'var(--text-primary)' }}>
          Meu Perfil
        </Typography>

        <ProfileCard>
          <AvatarWrapper>
            <LargeAvatar>
              {formData.name[0]?.toUpperCase() || 'U'}
            </LargeAvatar>
            <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
              {formData.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
              {formData.role}
            </Typography>
          </AvatarWrapper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            {!editing ? (
              <Button
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  color: 'var(--neon-primary)',
                  '&:hover': { bgcolor: 'var(--hover-bg)' }
                }}
              >
                Editar Perfil
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  sx={{
                    color: 'var(--error-text)',
                    '&:hover': { bgcolor: 'var(--error-bg)' }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{
                    color: 'var(--success-text)',
                    '&:hover': { bgcolor: 'var(--success-bg)' }
                  }}
                >
                  Salvar
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!editing}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)'
                },
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary)'
                }
              }}
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!editing}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)'
                },
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary)'
                }
              }}
            />
            <TextField
              label="Cargo"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!editing}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)'
                },
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary)'
                }
              }}
            />
            <TextField
              label="Departamento"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              disabled={!editing}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--border-color)'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary)'
                },
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary)'
                }
              }}
            />
          </Box>
        </ProfileCard>

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
      </motion.div>
    </Container>
  );
};

export default Profile; 