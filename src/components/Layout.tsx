import React, { useState, ReactNode, useMemo } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import NavBar from './Navbar';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  Zoom,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  LocationOn as LocationOnIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  AttachMoney as AttachMoneyIcon,
  ChatBubbleOutline,
  ViewCarousel as ViewCarouselIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

// إنشاء دالة لاختيار الخلفية المناسبة بناءً على عنوان الصفحة
const getBackgroundImage = (title: string): string => {
  // إزالة جميع الخلفيات وإرجاع سلسلة فارغة
  return '';
};

interface MainProps {
  backgroundImage: string;
}

const Main = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'backgroundImage'
})<MainProps>(({ theme, backgroundImage }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : '#121212',
  minHeight: '100vh',
  position: 'relative',
  // إزالة خصائص الخلفية
  // backgroundImage: backgroundImage,
  // backgroundSize: 'cover',
  // backgroundPosition: 'center',
  // backgroundAttachment: 'fixed',
  // backgroundRepeat: 'no-repeat',
  // '&::before': {
  //   content: '""',
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: theme.palette.mode === 'light' 
  //     ? 'rgba(255, 255, 255, 0.6)' 
  //     : 'rgba(15, 23, 42, 0.65)',
  //   zIndex: -1,
  // }
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '1600px',
  margin: '0 auto',
  padding: theme.spacing(2, 0),
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 0),
  },
}));

export default function Layout({ children, title }: LayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [quickAccessAnchor, setQuickAccessAnchor] = useState<null | HTMLElement>(null);

  // استخدام useMemo لتجنب إعادة حساب الخلفية في كل مرة يتم فيها إعادة تقديم المكون
  const backgroundImage = useMemo(() => getBackgroundImage(title), [title]);
  
  // قائمة روابط الوصول السريع
  const quickAccessLinks = [
    { title: "لوحة التحكم", icon: <DashboardIcon sx={{ color: '#2196F3' }} />, path: "/dashboard" },
    { title: "العقارات", icon: <HomeIcon sx={{ color: '#2196F3' }} />, path: "/properties" },
    { title: "المستخدمين", icon: <PersonIcon sx={{ color: '#4CAF50' }} />, path: "/users" },
    { title: "المُلاك", icon: <PeopleIcon sx={{ color: '#03A9F4' }} />, path: "/owners" },
    { title: "الأقسام", icon: <CategoryIcon sx={{ color: '#FF9800' }} />, path: "/categories" },
    { title: "الأماكن", icon: <LocationOnIcon sx={{ color: '#FF5722' }} />, path: "/places" },
    { title: "طلبات الحجز", icon: <ReceiptIcon sx={{ color: '#FF9800' }} />, path: "/checkout-requests" },
    { title: "طرق الدفع", icon: <CreditCardIcon sx={{ color: '#6A1B9A' }} />, path: "/payment-methods" },
    { title: "طلبات شحن رصيد", icon: <WalletIcon sx={{ color: '#8E24AA' }} />, path: "/payment-requests" },
    { title: "إضافة رصيد", icon: <AttachMoneyIcon sx={{ color: '#AB47BC' }} />, path: "/add-balance" },
    { title: "الشكاوى", icon: <ChatBubbleOutline sx={{ color: '#0288D1' }} />, path: "/complaints" },
    { title: "البانرات", icon: <ViewCarouselIcon sx={{ color: '#D32F2F' }} />, path: "/banners" },
  ];

  const handleQuickAccess = (path: string) => {
    setQuickAccessAnchor(null);
    navigate(path);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : '#121212'
    }}>
      <CssBaseline />
      
      {/* Top Navigation Bar */}
      <NavBar title={title} />
      
      {/* Main Content */}
      <Main backgroundImage={backgroundImage}>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </Main>
      
      {/* زر الوصول السريع العائم */}
      <Zoom in={true} style={{ transitionDelay: '500ms' }}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 24, md: 32 },
            right: { xs: 24, md: 32 },
            zIndex: 1000,
          }}
        >
          <Fab
            color="primary"
            aria-label="وصول سريع"
            onClick={(e) => setQuickAccessAnchor(e.currentTarget)}
            sx={{
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
              backgroundImage: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              '&:hover': {
                backgroundImage: 'linear-gradient(45deg, #1976D2, #21CBF3)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <SpeedIcon />
          </Fab>
        </Box>
      </Zoom>
      
      {/* قائمة الوصول السريع */}
      <Menu
        anchorEl={quickAccessAnchor}
        open={Boolean(quickAccessAnchor)}
        onClose={() => setQuickAccessAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            mt: 1.5,
            width: { xs: 280, sm: 320 },
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              bottom: 0,
              right: 14,
              width: 12,
              height: 12,
              bgcolor: 'background.paper',
              transform: 'translateY(50%) rotate(45deg)',
              zIndex: 0,
            }
          }
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            الوصول السريع
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            انتقل مباشرة إلى أي صفحة
          </Typography>
        </Box>
        <Divider />
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
          {quickAccessLinks.map((link, index) => (
            <MenuItem 
              key={index}
              onClick={() => handleQuickAccess(link.path)}
              sx={{ 
                borderRadius: 2, 
                mb: 0.5, 
                p: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.08)',
                }
              }}
            >
              <ListItemIcon>{link.icon}</ListItemIcon>
              <ListItemText primary={link.title} />
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </Box>
  );
}