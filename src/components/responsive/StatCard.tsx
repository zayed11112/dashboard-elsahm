import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  styled,
  Card,
  CardProps,
  CardContent,
} from '@mui/material';
import { palette } from '../../theme/palette';

// الكارد المتجاوب المحسن
const ResponsiveCard = styled(Card)<CardProps & { gradient?: string; contentSx?: object }>(
  ({ theme, gradient }) => ({
    background: gradient || theme.palette.background.paper,
    position: 'relative',
    overflow: 'visible',
    borderRadius: theme.shape.borderRadius * 2.5,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
    },
  }),
);

// محتوى الكارد المتجاوب
const ResponsiveCardContent = styled(CardContent, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})<{ isMobile?: boolean }>(
  ({ theme, isMobile }) => ({
    padding: isMobile ? theme.spacing(2) : theme.spacing(2.5),
    '&:last-child': {
      paddingBottom: isMobile ? theme.spacing(2) : theme.spacing(2.5),
    },
  }),
);

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  gradient?: [string, string] | string;
  onClick?: () => void;
  textColor?: string;
  sx?: object;
}

/**
 * بطاقة إحصائيات متجاوبة مع تصميم محسن
 */
const StatCard = ({
  title,
  value,
  icon,
  color = palette.primary.main,
  subtitle,
  gradient,
  onClick,
  textColor,
  sx = {},
}: StatCardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // تحديد الخلفية المتدرجة للبطاقة
  const getGradient = () => {
    if (!gradient) return '';
    if (typeof gradient === 'string') return gradient;
    return `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
  };

  return (
    <ResponsiveCard
      gradient={getGradient()}
      elevation={0}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        backdropFilter: 'blur(8px)',
        ...sx,
      }}
      onClick={onClick}
    >
      <ResponsiveCardContent isMobile={isMobile}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          height: '100%'
        }}>
          <Box sx={{ 
            width: '65%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%'
          }}>
            <Typography
              variant="subtitle1"
              color={textColor || "text.secondary"}
              gutterBottom
              sx={{
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontSize: '0.85rem',
                position: 'relative',
                display: 'inline-block',
                pb: 0.5,
                mb: 1.5,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: 20,
                  height: 2,
                  background: textColor || color,
                  borderRadius: 3,
                  opacity: 0.7,
                }
              }}
            >
              {title}
            </Typography>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  mb: subtitle ? 0.5 : 0,
                  background: gradient && !textColor ? 'transparent' : textColor ? 'none' : `linear-gradient(135deg, ${color} 30%, ${color}99 100%)`,
                  WebkitBackgroundClip: gradient || textColor ? 'none' : 'text',
                  WebkitTextFillColor: gradient || textColor ? 'inherit' : 'transparent',
                  letterSpacing: '0.5px',
                  fontSize: { xs: '2.2rem', md: '2.5rem' },
                  lineHeight: 1.1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  fontFamily: "'Cairo', sans-serif",
                  color: textColor || 'inherit'
                }}
              >
                {value}
              </Typography>

              {subtitle && (
                <Typography
                  variant="body2"
                  color={textColor || "text.secondary"}
                  sx={{
                    mb: 1,
                    opacity: 0.8,
                    fontWeight: 500,
                    fontSize: '0.85rem'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          <Avatar
            sx={{
              background: gradient ? 
                `linear-gradient(135deg, ${typeof gradient === 'string' ? 'rgba(255,255,255,0.2)' : gradient[0] + '30'}, ${typeof gradient === 'string' ? 'rgba(255,255,255,0.1)' : gradient[1] + '15'})` : 
                `linear-gradient(135deg, ${color}20, ${color}40)`,
              color: textColor || color,
              width: 60,
              height: 60,
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              border: `2px solid ${color}20`,
              transition: 'all 0.4s ease',
              '&:hover': {
                transform: 'scale(1.08) rotate(5deg)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              },
              padding: 1.8,
              backdropFilter: 'blur(10px)',
              fontSize: 32
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </ResponsiveCardContent>
    </ResponsiveCard>
  );
};

export default StatCard;
