import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, useParams } from 'react-router-dom';
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
  useTheme,
  Collapse
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
  AdminPanelSettings as AdminPanelSettingsIcon,
  Home as HomeIcon,
  Article as RequirementsIcon,
  GridView as MatrixIcon,
  People as MembersIcon,
  PlayArrow as ExecuteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Group as TeamIcon,
  Description as DocsIcon,
  Autorenew as AutomationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Novo componente LogoSvg com design mais moderno
const LogoSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="gradientAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g>
      {/* Hexágono de fundo */}
      <path 
        d="M30 10 L45 20 L45 40 L30 50 L15 40 L15 20 Z" 
        fill="none" 
        stroke="url(#gradient)" 
        strokeWidth="2"
        filter="url(#glow)"
      />
      {/* Símbolo T estilizado */}
      <path 
        d="M25 22 L35 22 M30 22 L30 38" 
        stroke="url(#gradientAccent)" 
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {/* Texto TECTONIC com efeito moderno */}
      <text x="55" y="35" 
        fill="url(#gradient)" 
        fontFamily="Arial, sans-serif" 
        fontWeight="bold" 
        fontSize="22"
        letterSpacing="1"
      >TECTONIC</text>
      {/* Texto TCMS com efeito de destaque */}
      <text x="55" y="50" 
        fill="url(#gradientAccent)" 
        fontFamily="Arial, sans-serif" 
        fontWeight="bold" 
        fontSize="16"
        letterSpacing="2"
      >TCMS</text>
      {/* Linha decorativa com gradiente */}
      <path 
        d="M55 38 L160 38" 
        stroke="url(#gradientAccent)" 
        strokeWidth="2"
        strokeDasharray="1 3"
        filter="url(#glow)"
      />
    </g>
  </svg>
);

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
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { projectId } = useParams();

  console.log('Layout renderizado, usuário atual:', user);
  console.log('Email do usuário:', user?.email);
  console.log('Função do usuário:', user?.role);
  console.log('É admin@hybex?', user?.email === 'admin@hybex');
  console.log('Tem role admin?', user?.role === 'admin');
  console.log('ID do projeto atual:', projectId);

  // Determinar se estamos em uma rota de projeto
  const isProjectRoute = location.pathname.includes('/projects/') && projectId;

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

  const toggleProjectMenu = () => {
    setProjectMenuOpen(!projectMenuOpen);
  };

  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Projetos', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Relatórios', icon: <ReportsIcon />, path: '/reports' },
    ...(user?.role === 'admin' || user?.email === 'admin@hybex' ? [
      { text: 'Gerenciar', icon: <AdminPanelSettingsIcon />, path: '/admin' }
    ] : [])
  ];

  const projectMenuItems = isProjectRoute ? [
    { text: 'Requisitos', icon: <RequirementsIcon />, path: `/projects/${projectId}/requirements` },
    { text: 'Automação', icon: <AutomationIcon />, path: `/projects/${projectId}/automation` },
    { text: 'Membros', icon: <MembersIcon />, path: `/projects/${projectId}/members` },
    { text: 'Configurações', icon: <SettingsIcon />, path: `/projects/${projectId}/settings` }
  ] : [];

  console.log('Itens do menu gerados:', mainMenuItems);
  console.log('Itens do menu de projeto:', projectMenuItems);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            onClick={open ? handleDrawerClose : handleDrawerOpen}
            edge="start"
            sx={{ 
              mr: 2,
              ...(open && { transform: 'rotate(360deg)' }),
              transition: 'transform 0.5s ease-in-out'
            }}
          >
            <HomeIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <LogoSvg />
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Configurações da conta">
              <IconButton
                size="large"
                aria-label="conta do usuário"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.email?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Perfil</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Configurações</ListItemText>
              </MenuItem>
              {(user?.role === 'admin' || user?.email === 'admin@hybex') && (
                <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Gerenciar</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sair</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%',
            position: 'relative',
            px: 2
          }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #4F46E5, #1E40AF)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
                flex: 1
              }}
            >
              Painel
            </Typography>
            <IconButton 
              onClick={handleDrawerClose}
              sx={{
                position: 'absolute',
                right: 8
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        <Divider />
        <List>
          {mainMenuItems.map((item) => (
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
        
        {isProjectRoute && (
          <>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton onClick={toggleProjectMenu}>
                <ListItemIcon>
                  <ProjectsIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Projeto Atual" 
                  primaryTypographyProps={{ 
                    color: 'primary',
                    fontWeight: 'bold'
                  }} 
                />
                {projectMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
            </ListItem>
            <Collapse in={projectMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {projectMenuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      selected={location.pathname === item.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </Drawer>

      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default Layout; 
