import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { palette } from '../theme/palette';
import { useNotifications } from '../contexts/NotificationsContext';

// Types
interface NavMenuItem {
  text: string;
  icon?: React.ReactNode;
  path: string;
}

interface NavBarProps {
  title?: string;
}

// Styled components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  backgroundImage: palette.gradients.primary,
  backdropFilter: 'blur(10px)',
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: 'white',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s',
  position: 'relative',
  padding: '6px 16px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
  },
  '&.active': {
    fontWeight: 700,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '50%',
      width: '40%',
      height: 3,
      backgroundColor: '#fff',
      transform: 'translateX(-50%)',
      borderRadius: '1px 1px 0 0',
    }
  }
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  color: 'white',
  margin: theme.direction === 'rtl' ? '0 1rem 0 0' : '0 0 0 1rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.1rem',
  },
}));

const NavBar: React.FC<NavBarProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // States
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [anchorElMore, setAnchorElMore] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use notifications from context
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Menu items
  const menuItems: NavMenuItem[] = [
    {
      text: 'العقارات',
      path: '/properties',
    },
    {
      text: 'المُلاك',
      path: '/owners',
    },
    {
      text: 'المستخدمين',
      path: '/users',
    },
    {
      text: 'الأقسام',
      path: '/categories',
    },
    {
      text: 'طلبات الحجز',
      path: '/checkout-requests',
    },
  ];
  
  // More menu items
  const moreMenuItems: NavMenuItem[] = [
    {
      text: 'طرق الدفع',
      path: '/payment-methods',
    },
    {
      text: 'طلبات شحن رصيد',
      path: '/payment-requests',
    },
    {
      text: 'إضافة رصيد',
      path: '/add-balance',
    },
    {
      text: 'تسجيل دخول Supabase',
      path: '/supabase-login',
    },
    // يمكنك إضافة المزيد من العناصر هنا عند الحاجة
  ];

  // Check if a menu item is active
  const isActive = (path: string) => location.pathname.startsWith(path);

  // Handlers
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };
  
  const handleOpenMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElMore(event.currentTarget);
  };

  const handleCloseMoreMenu = () => {
    setAnchorElMore(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleCloseMoreMenu();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    handleCloseNotificationsMenu();
  };

  // User menu items - Define after handler functions are declared
  const userMenuItems = [
    <MenuItem key="profile" onClick={handleCloseUserMenu}>
      <Typography textAlign="center">الملف الشخصي</Typography>
    </MenuItem>,
    <MenuItem key="settings" onClick={handleCloseUserMenu}>
      <Typography textAlign="center">الإعدادات</Typography>
    </MenuItem>,
    <Divider key="divider" />,
    <MenuItem key="logout" onClick={handleLogout}>
      <Typography textAlign="center">تسجيل الخروج</Typography>
    </MenuItem>
  ];

  return (
    <>
      <StyledAppBar>
        <Container maxWidth={false}>
          <Toolbar disableGutters sx={{ 
            minHeight: { xs: 64, md: 70 },
            px: { xs: 1, sm: 2 },
            direction: 'rtl'
          }}>
            {/* Mobile Menu Icon */}
            {isMobile && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuToggle}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <LogoContainer sx={{ display: 'flex' }}>
              <Box
                component="a"
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/dashboard');
                }}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none'
                }}
              >
                <Avatar 
                  src="/logo512.png"
                  sx={{ 
                    width: 38, 
                    height: 38,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                  alt="السهم للتسكين"
                />
                {!isSmallScreen && (
                  <Typography
                    variant="h6"
                    noWrap
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      textDecoration: 'none',
                      mr: 2
                    }}
                  >
                    السهم للتسكين
                  </Typography>
                )}
              </Box>
              
              {/* Page Title */}
              {title && !isSmallScreen && (
                <PageTitle>{title}</PageTitle>
              )}
            </LogoContainer>

            {/* Navigation Links - For Medium+ screens */}
            <Box sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' }, 
              justifyContent: 'center',
              mr: 4
            }}>
              {menuItems.map((item) => (
                <NavButton
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  className={isActive(item.path) ? 'active' : ''}
                >
                  {item.text}
                </NavButton>
              ))}
              
              {/* More Button with Dropdown */}
              <NavButton
                onClick={handleOpenMoreMenu}
                endIcon={<KeyboardArrowDownIcon />}
                className={moreMenuItems.some(item => isActive(item.path)) ? 'active' : ''}
              >
                المزيد
              </NavButton>
            </Box>

            {/* Action Icons - Right Side */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Notifications */}
              <Tooltip title="الإشعارات">
                <IconButton 
                  onClick={handleOpenNotificationsMenu} 
                  sx={{ mr: 1, color: 'white' }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Profile */}
              <Box sx={{ mr: 0 }}>
                <Tooltip title="الملف الشخصي">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      alt="Eslam Zayed" 
                      src="/admin_profile.jpg" 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        border: '2px solid white',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* More Menu Dropdown */}
      <Menu
        anchorEl={anchorElMore}
        open={Boolean(anchorElMore)}
        onClose={handleCloseMoreMenu}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 220,
            borderRadius: 2,
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {moreMenuItems.map((item) => (
          <MenuItem 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            sx={{ 
              py: 1.2,
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              }
            }}
          >
            <Typography>{item.text}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorElNotifications}
        open={Boolean(anchorElNotifications)}
        onClose={handleCloseNotificationsMenu}
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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>الإشعارات</Typography>
          <Tooltip title="تعليم الكل كمقروء">
            <IconButton size="small" onClick={handleMarkAllAsRead}>
              <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              لا توجد إشعارات
            </Typography>
          </Box>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification.id)} 
                sx={{ 
                  py: 1.5, 
                  backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
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
            {notifications.length > 5 && (
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  عرض كل الإشعارات ({notifications.length})
                </Typography>
              </Box>
            )}
          </>
        )}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
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
        {userMenuItems}
      </Menu>

      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundImage: palette.gradients.primary,
            color: '#fff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src="/logo512.png"
            sx={{ 
              width: 35, 
              height: 35,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }} 
          />
          <Typography variant="h6" sx={{ mr: 1, fontWeight: 600 }}>
            السهم للتسكين
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {/* Admin Info */}
        <Box sx={{ p: 1.5, textAlign: 'center', mb: 1 }}>
          <Avatar
            src="/admin_profile.jpg"
            sx={{
              width: 60,
              height: 60,
              mb: 1.2,
              mx: 'auto',
              border: '2px solid white'
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            Eslam Zayed
          </Typography>
          <Typography variant="body2" color="white" sx={{ fontSize: '0.75rem', mt: 0.2, opacity: 0.8 }}>
            Admin Elsahm
          </Typography>
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        
        {/* Mobile Menu Items */}
        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    py: 0.7,
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: '60%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px 0 0 4px',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.82rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          
          {/* Add More Menu Items to the Mobile Drawer */}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
          <Typography variant="caption" sx={{ px: 2, color: 'rgba(255, 255, 255, 0.5)' }}>
            خيارات إضافية
          </Typography>
          
          {moreMenuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    py: 0.7,
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: '60%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px 0 0 4px',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.82rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <Box sx={{ p: 2 }}>
          <Typography
            variant="caption"
            color="rgba(255, 255, 255, 0.6)"
            align="center"
            display="block"
            sx={{
              fontWeight: 500,
              letterSpacing: 0.5,
              fontSize: '0.7rem',
            }}
          >
            لوحة تحكم السهم للتسكين © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default NavBar; 