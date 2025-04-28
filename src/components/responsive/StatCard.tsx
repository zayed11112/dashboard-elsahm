import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ResponsiveCard from './ResponsiveCard';
import { palette } from '../../theme/palette';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  onClick?: () => void;
  gradient?: string;
  sx?: any;
}

/**
 * بطاقة إحصائيات متجاوبة مع تصميم محسن
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = palette.primary.main,
  trend,
  trendLabel,
  subtitle,
  onClick,
  gradient,
  sx = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // تحديد لون الاتجاه
  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    return trend > 0 ? palette.success.main : trend < 0 ? palette.error.main : 'text.secondary';
  };

  // تحديد أيقونة الاتجاه
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? (
      <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
    ) : trend < 0 ? (
      <ArrowDownward sx={{ fontSize: 16, mr: 0.5 }} />
    ) : null;
  };

  // تحديد تدرج اللون
  const getGradient = () => {
    // Si se proporciona un gradiente personalizado, usarlo
    if (gradient) {
      return gradient;
    }

    // Si no, usar el mapa de colores predefinido
    const colorMap: Record<string, string> = {
      [palette.primary.main]: palette.gradients.primary,
      [palette.secondary.main]: palette.gradients.secondary,
      [palette.success.main]: palette.gradients.success,
      [palette.info.main]: palette.gradients.info,
      [palette.warning.main]: palette.gradients.warning,
      [palette.error.main]: palette.gradients.error,
    };

    return colorMap[color] || `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`;
  };

  return (
    <ResponsiveCard
      gradient={getGradient()}
      elevation={4}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        ...sx,
      }}
      onClick={onClick}
      contentSx={{
        p: isMobile ? 2 : 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            gutterBottom
            sx={{
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: gradient ? 'transparent' : `linear-gradient(135deg, ${color} 30%, ${color}99 100%)`,
              WebkitBackgroundClip: gradient ? 'none' : 'text',
              WebkitTextFillColor: gradient ? 'inherit' : 'transparent',
            }}
          >
            {value}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Tooltip title={trend > 0 ? 'زيادة' : trend < 0 ? 'انخفاض' : 'ثابت'}>
                <Typography
                  variant="caption"
                  sx={{
                    color: getTrendColor(),
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: `${getTrendColor()}15`,
                  }}
                >
                  {getTrendIcon()}
                  {Math.abs(trend)}%
                </Typography>
              </Tooltip>
              {trendLabel && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    ml: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {trendLabel}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Avatar
          sx={{
            background: gradient || `linear-gradient(135deg, ${color}20, ${color}40)`,
            color: color,
            width: 60,
            height: 60,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </ResponsiveCard>
  );
};

export default StatCard;
