import React, { useState, ReactNode, useMemo } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import NavBar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

// إنشاء دالة لاختيار الخلفية المناسبة بناءً على عنوان الصفحة
const getBackgroundImage = (title: string): string => {
  // سيتم تطبيق خلفيات مخصصة لكل صفحة
  switch (title) {
    case 'لوحة التحكم':
      return 'url(/background1.webp)';
    case 'المستخدمين':
      return 'url(/background2.webp)';
    case 'العقارات':
      return 'url(/background3.webp)';
    case 'الأقسام':
      return 'url(/background4.webp)';
    case 'طلبات الحجز':
    case 'طلبات شحن رصيد':
      return 'url(/background5.webp)';
    default:
      // للصفحات الأخرى، استخدام خلفية عشوائية
      const randomBg = Math.floor(Math.random() * 5) + 1;
      return `url(/background${randomBg}.webp)`;
  }
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
  backgroundColor: theme.palette.mode === 'light' ? 'rgba(248, 250, 252, 0.6)' : 'rgba(15, 23, 42, 0.7)',
  minHeight: '100vh',
  backgroundImage: backgroundImage,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  backgroundRepeat: 'no-repeat',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.mode === 'light' 
      ? 'rgba(255, 255, 255, 0.6)' 
      : 'rgba(15, 23, 42, 0.65)',
    zIndex: -1,
  }
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // استخدام useMemo لتجنب إعادة حساب الخلفية في كل مرة يتم فيها إعادة تقديم المكون
  const backgroundImage = useMemo(() => getBackgroundImage(title), [title]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a'
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
    </Box>
  );
}