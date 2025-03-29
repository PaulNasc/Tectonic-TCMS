import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import { Settings as SettingsIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tectonic
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Configurações">
              <IconButton color="inherit" size="large">
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={user?.email || 'Usuário'}>
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{ ml: 2 }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Sidebar open={sidebarOpen} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${240}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          marginTop: '64px'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 