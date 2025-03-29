import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Divider,
  ListItemIcon,
  useTheme,
  Badge,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  styled
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportIcon from '@mui/icons-material/Report';

import LogoHybex from '../assets/logo-hybex.png';

// Largura do drawer
const drawerWidth = 260;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const MainLayout = ({ toggleTheme, currentTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  
  // Estados para controlar os submenus
  const [openTestManagement, setOpenTestManagement] = useState(false);
  const [openQAProcess, setOpenQAProcess] = useState(false);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Navegação
  const navigateTo = (path) => {
    navigate(path);
  };
  
  // Toggle submenus
  const handleTestManagementClick = () => {
    setOpenTestManagement(!openTestManagement);
  };
  
  const handleQAProcessClick = () => {
    setOpenQAProcess(!openQAProcess);
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ marginRight: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!open && (
              <img 
                src={LogoHybex} 
                alt="Hybex Logo" 
                style={{ 
                  height: '30px', 
                  marginRight: '15px' 
                }} 
              />
            )}
            <Typography variant="h6" noWrap component="div">
              CRM QA Test
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Ícones da barra de ferramentas */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Alternar tema">
              <IconButton onClick={toggleTheme} color="inherit">
                {currentTheme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notificações">
              <IconButton 
                color="inherit"
                onClick={handleNotificationMenuOpen}
              >
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Perfil">
              <IconButton 
                onClick={handleProfileMenuOpen}
                size="small" 
                sx={{ ml: 2 }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <Avatar 
                    alt={user?.name || "Usuário"} 
                    src="/static/avatar.jpg"
                    sx={{ width: 32, height: 32 }}
                  >
                    {user?.name ? user.name.charAt(0) : "U"}
                  </Avatar>
                </StyledBadge>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Menu de perfil */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.name || "Usuário"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || "usuario@hybex"}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => navigateTo('/settings/profile')}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Meu Perfil
        </MenuItem>
        
        <MenuItem onClick={() => navigateTo('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
      
      {/* Menu de notificações */}
      <Menu
        anchorEl={notificationAnchorEl}
        id="notification-menu"
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        onClick={handleNotificationMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 320,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notificações
          </Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            Marcar todas como lidas
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem>
          <ListItemIcon>
            <BugReportIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Box>
            <Typography variant="body2">
              Novo bug reportado: #1234
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 5 minutos
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <Box>
            <Typography variant="body2">
              Teste #5678 foi aprovado
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 2 horas
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem>
          <ListItemIcon>
            <ReportIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <Box>
            <Typography variant="body2">
              Solicitação de acesso pendente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 1 dia
            </Typography>
          </Box>
        </MenuItem>
        
        <Divider />
        
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            Ver todas as notificações
          </Typography>
        </Box>
      </Menu>
      
      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          ...(open && {
            width: drawerWidth,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              boxSizing: 'border-box',
              overflowX: 'hidden',
            },
          }),
          ...(!open && {
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
              width: theme.spacing(9),
            },
            '& .MuiDrawer-paper': {
              width: theme.spacing(7),
              [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
              },
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              boxSizing: 'border-box',
              overflowX: 'hidden',
            },
          }),
        }}
      >
        <DrawerHeader>
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={LogoHybex} 
                  alt="Hybex Logo" 
                  style={{ 
                    height: '30px', 
                    marginRight: '12px' 
                  }} 
                />
                <Typography variant="h6" noWrap>
                  Hybex QA
                </Typography>
              </Box>
              <IconButton onClick={handleDrawerToggle}>
                {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Box>
          )}
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {/* Dashboard */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={() => navigateTo('/dashboard')}
              selected={location.pathname === '/dashboard'}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          
          {/* Gerenciamento de Testes */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={handleTestManagementClick}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Gerenciamento de Testes" sx={{ opacity: open ? 1 : 0 }} />
              {open && (openTestManagement ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          
          {/* Submenu de Gerenciamento de Testes */}
          <Collapse in={open && openTestManagement} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton 
                sx={{ pl: 4 }}
                onClick={() => navigateTo('/test-management/create')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <BugReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Criar Teste" />
              </ListItemButton>
              
              <ListItemButton 
                sx={{ pl: 4 }}
                onClick={() => navigateTo('/test-management/list')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Listar Testes" />
              </ListItemButton>
              
              <ListItemButton 
                sx={{ pl: 4 }}
                onClick={() => navigateTo('/test-management/reports')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <ReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Relatórios" />
              </ListItemButton>
            </List>
          </Collapse>
          
          {/* Processos QA */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={handleQAProcessClick}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <PlaylistAddCheckIcon />
              </ListItemIcon>
              <ListItemText primary="Processos QA" sx={{ opacity: open ? 1 : 0 }} />
              {open && (openQAProcess ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          
          {/* Submenu de Processos QA */}
          <Collapse in={open && openQAProcess} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton 
                sx={{ pl: 4 }}
                onClick={() => navigateTo('/qa-process/workflows')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CheckCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Fluxos de Trabalho" />
              </ListItemButton>
              
              <ListItemButton 
                sx={{ pl: 4 }}
                onClick={() => navigateTo('/qa-process/templates')}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Templates" />
              </ListItemButton>
            </List>
          </Collapse>
          
          {/* Configurações */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={() => navigateTo('/settings')}
              selected={location.pathname === '/settings'}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configurações" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        
        <Box 
          sx={{ 
            p: open ? 2 : 0, 
            mt: 'auto', 
            display: open ? 'block' : 'none' 
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; 2025 Hybex
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            v1.0.0
          </Typography>
        </Box>
      </Drawer>
      
      {/* Conteúdo principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 