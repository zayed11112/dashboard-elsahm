import React, { ReactNode } from 'react';
import { Grid, useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveGridProps {
  children: ReactNode;
  spacing?: number;
  container?: boolean;
  item?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  sx?: any;
}

/**
 * شبكة متجاوبة تتكيف مع حجم الشاشة
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 3,
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // تعديل التباعد بناءً على حجم الشاشة
  const responsiveSpacing = isMobile ? 2 : spacing;
  
  return (
    <Grid
      container={container}
      item={item}
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      spacing={container ? responsiveSpacing : undefined}
      sx={sx}
    >
      {children}
    </Grid>
  );
};

export default ResponsiveGrid;
