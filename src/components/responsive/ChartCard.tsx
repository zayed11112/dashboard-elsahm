import React, { ReactNode } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ResponsiveCard from './ResponsiveCard';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
  viewAllLink?: string;
  onViewAll?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  noData?: boolean;
  noDataMessage?: string;
  gradient?: string;
  icon?: ReactNode;
  sx?: any;
}

/**
 * بطاقة للرسوم البيانية متجاوبة مع تصميم محسن
 */
const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  viewAllLink,
  onViewAll,
  onRefresh,
  loading = false,
  noData = false,
  noDataMessage = 'لا توجد بيانات متاحة',
  gradient,
  icon,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // إجراء عرض الكل
  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  // إنشاء زر عرض الكل
  const viewAllButton = (viewAllLink || onViewAll) && (
    <Button
      size="small"
      endIcon={<ArrowForwardIcon />}
      onClick={handleViewAll}
      sx={{
        fontWeight: 500,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        }
      }}
    >
      عرض الكل
    </Button>
  );

  return (
    <ResponsiveCard
      title={title}
      subtitle={subtitle}
      onRefresh={onRefresh}
      action={viewAllButton}
      icon={icon}
      gradient={gradient}
      elevation={4}
      sx={{
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        ...sx,
      }}
      divider
    >
      <Box
        sx={{
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0 0 8px 8px',
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              جاري التحميل...
            </Typography>
          </Box>
        ) : noData ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {noDataMessage}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </ResponsiveCard>
  );
};

export default ChartCard;
