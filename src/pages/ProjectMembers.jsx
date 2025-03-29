import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';

const ProjectMembers = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: '' });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await projectService.getProjectById(projectId);
      if (error) throw new Error(error);

      setProject(data);
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      setError(null);
      setSuccessMessage('');

      const { error } = await projectService.addMemberToProject(projectId, {
        email: newMember.email,
        role: 'member'
      });

      if (error) throw new Error(error);

      setSuccessMessage('Membro adicionado com sucesso!');
      setAddDialogOpen(false);
      setNewMember({ email: '' });
      await loadProject();
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setError(null);
      setSuccessMessage('');

      const updatedMembers = project.members.filter(m => m.userId !== memberId);
      const { error } = await projectService.updateProject(projectId, {
        members: updatedMembers
      });

      if (error) throw new Error(error);

      setSuccessMessage('Membro removido com sucesso!');
      await loadProject();
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Projeto não encontrado
        </Alert>
      </Box>
    );
  }

  const isAdmin = project.members?.find(m => m.userId === user?.id)?.role === 'admin';

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(`/projects/${projectId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Membros do Projeto
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Box display="flex" justifyContent="flex-end" mb={2}>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Adicionar Membro
            </Button>
          )}
        </Box>

        <List>
          {project.members?.map((member) => (
            <ListItem key={member.userId} divider>
              <ListItemText
                primary={member.name || member.email}
                secondary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                    <Chip
                      size="small"
                      label={member.role === 'admin' ? 'Administrador' : 'Membro'}
                      color={member.role === 'admin' ? 'primary' : 'default'}
                    />
                  </Box>
                }
              />
              {isAdmin && member.userId !== user?.id && (
                <ListItemSecondaryAction>
                  <Tooltip title="Remover membro">
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Adicionar Membro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="E-mail"
            type="email"
            fullWidth
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={!newMember.email}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectMembers; 