import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  FolderSpecial as ProjectsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AdminPanelSettings as AdminPanelSettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  
  .logo-icon {
    font-size: 32px;
    color: var(--neon-primary);
  }
`;

const StyledListItem = styled(ListItem)`
  margin: 4px 8px;
  border-radius: 8px;
  
  .MuiListItemButton-root {
    padding: 8px 16px;
    border-radius: 8px;
    
    &:hover {
      background-color: var(--hover-bg);
    }
  }
  
  &.active {
    .MuiListItemButton-root {
      background-color: var(--active-bg);
    }
    .MuiListItemIcon-root {
      color: var(--neon-primary);
    }
    .MuiListItemText-primary {
      color: var(--neon-primary);
      font-weight: 600;
    }
  }
  
  .MuiListItemIcon-root {
    color: var(--text-secondary);
    min-width: 40px;
  }
  
  .MuiListItemText-primary {
    color: var(--text-primary);
    font-size: 0.95rem;
  }
`;

const Layout = ({ toggleTheme }) => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Projetos', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
    ...(user?.role === 'admin' || user?.email === 'admin@hybex' ? [
      { text: 'Gerenciar', icon: <AdminPanelSettingsIcon />, path: '/admin' }
    ] : [])
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Tectonic TCMS
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
          <Tooltip title="Configurações de conta">
              <IconButton
              onClick={handleMenu}
              sx={{ ml: 2 }}
              >
                <Avatar 
                alt={user?.name || 'User'}
                src={user?.photoURL}
                sx={{ width: 32, height: 32 }}
              />
              </IconButton>
            </Tooltip>
        </Toolbar>
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            Tectonic TCMS
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
              onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
            >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => {
          navigate('/profile');
          handleClose();
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography>Perfil</Typography>
        </MenuItem>

        <MenuItem onClick={() => {
          navigate('/settings');
          handleClose();
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography>Configurações</Typography>
        </MenuItem>

        {(user?.role === 'admin' || user?.email === 'admin@hybex') && (
          <MenuItem onClick={() => {
            navigate('/admin');
            handleClose();
          }}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <Typography>Gerenciar</Typography>
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Sair</Typography>
        </MenuItem>
      </Menu>

      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default Layout; 
