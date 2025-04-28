import React, { ReactNode } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  spacing?: number;
  sx?: any;
}

/**
 * حاوية متجاوبة تتكيف مع حجم الشاشة
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  spacing = 3,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // تحديد العرض الأقصى بناءً على الحجم المحدد
  const getMaxWidthValue = () => {
    if (!maxWidth) return '100%';

    const widthMap = {
      xs: '600px',
      sm: '960px',
      md: '1280px',
      lg: '1440px',
      xl: '1920px',
    };

    return widthMap[maxWidth];
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: getMaxWidthValue(),
        mx: 'auto',
        px: isMobile ? 2 : spacing,
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s ease',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveContainer;
