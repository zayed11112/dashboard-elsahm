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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // استخدام useMemo لتجنب إعادة حساب الخلفية في كل مرة يتم فيها إعادة تقديم المكون
  const backgroundImage = useMemo(() => getBackgroundImage(title), [title]);

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
    </Box>
  );
}