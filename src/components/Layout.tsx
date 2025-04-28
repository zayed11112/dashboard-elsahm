import React, { useState, ReactNode, useEffect } from 'react';
import { styled, useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { palette } from '../theme/palette';
import AnimatedAvatar from './AnimatedAvatar';
import ProfileAvatar from './ProfileAvatar';

const drawerWidth = 280;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundImage: palette.gradients.primary,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginRight: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
  height: 80,
  backgroundImage: palette.gradients.sidebar,
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  background: 'linear-gradient(90deg, #FFFFFF 0%, #E0E0E0 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginLeft: theme.spacing(1),
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));



const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled('input')(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  padding: theme.spacing(1, 1, 1, 0),
  paddingLeft: `calc(1em + ${theme.spacing(4)})`,
  transition: theme.transitions.create('width'),
  [theme.breakpoints.up('md')]: {
    width: '20ch',
  },
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '0.9rem',
}));

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useThemeContext();

  // Menu states
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  // Get notifications from context
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // Handle notifications menu
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Handle profile menu
  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileClose();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'لوحة التحكم',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'العقارات',
      icon: <HomeWorkIcon />,
      path: '/properties',
    },
    {
      text: 'المُلاك',
      icon: <PersonIcon />,
      path: '/owners',
    },
    {
      text: 'المستخدمين',
      icon: <PeopleIcon />,
      path: '/users',
    },
    {
      text: 'الحجوزات',
      icon: <BookOnlineIcon />,
      path: '/reservations',
    },
    {
      text: 'تسجيل دخول Supabase',
      icon: <LoginIcon />,
      path: '/supabase-login',
    },
  ];

  // Check if menu item is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex', direction: 'rtl' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ minHeight: 70, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, mr: 1 }}>
              {title}
            </Typography>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="end"
              sx={{ ...(open && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>

          {/* Notification Icon */}
          <Tooltip title="الإشعارات">
            <IconButton
              color="inherit"
              sx={{ ml: 1 }}
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              elevation: 3,
              sx: {
                width: 320,
                maxHeight: 400,
                borderRadius: 2,
                mt: 1.5
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>الإشعارات</Typography>
              {unreadCount > 0 && (
                <Tooltip title="تعليم الكل كمقروء">
                  <IconButton size="small" onClick={() => markAllAsRead()}>
                    <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Divider />
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      handleNotificationsClose();
                    }}
                    sx={{
                      py: 1.5,
                      backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: notification.read ? 'text.primary' : 'primary.main'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <Divider />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    عرض كل الإشعارات
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  لا توجد إشعارات جديدة
                </Typography>
              </Box>
            )}
          </Menu>

          {/* Theme Toggle Removed */}

          {/* Settings Icon */}
          <Tooltip title="الإعدادات">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* Profile Avatar */}
          <Tooltip title="الملف الشخصي">
            <IconButton
              onClick={handleProfileOpen}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <ProfileAvatar
                src="/admin_profile.jpg"
                size={40}
              />
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleProfileClose}
            PaperProps={{
              elevation: 3,
              sx: {
                width: 200,
                borderRadius: 2,
                mt: 1.5
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClose}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">الملف الشخصي</Typography>
            </MenuItem>
            <MenuItem onClick={handleProfileClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">الإعدادات</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">تسجيل الخروج</Typography>
            </MenuItem>
          </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderLeft: 'none',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            backgroundImage: palette.gradients.sidebar,
            color: '#FFFFFF',
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <DrawerHeader>
          <LogoBox>
            <Avatar
              src="/logo512.png"
              sx={{
                width: 40,
                height: 40,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            />
            <LogoText variant="h6">

            </LogoText>
          </LogoBox>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        {/* Admin Info */}
        <Box sx={{ p: 2, textAlign: 'center', mb: 1 }}>
          <AnimatedAvatar
            src="/admin_profile.jpg"
            size={80}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
             Eslam Zayed
          </Typography>
          <Typography variant="body2" color="white">
            Admin Elsahm
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Menu Items */}
        <List component="nav" sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      '& .MuiListItemIcon-root': {
                        color: '#FFFFFF',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#FFFFFF',
                        fontWeight: 600,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: '60%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px 0 0 4px',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 40,
                    color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.3s ease',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: active ? 600 : 500,
                      color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                      sx: { transition: 'all 0.3s ease' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />
        <Box sx={{ p: 3 }}>
          <Typography
            variant="caption"
            color="rgba(255, 255, 255, 0.6)"
            align="center"
            display="block"
            sx={{
              fontWeight: 500,
              letterSpacing: 0.5,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            لوحة تحكم السهم للتسكين © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          transition: theme.transitions.create(['margin', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginRight: `-${drawerWidth}px`,
          ...(open && {
            transition: theme.transitions.create(['margin', 'padding'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginRight: 0,
          }),
          bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a',
          minHeight: '100vh',
          backgroundImage: theme.palette.mode === 'light'
            ? 'radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0) 50%)'
            : 'radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0) 50%)',
        }}
      >
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}