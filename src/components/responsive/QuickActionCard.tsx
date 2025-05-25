import React from 'react';
import {
  Box,
  Typography,
  styled,
  Card,
  CardProps,
  CardContent,
  IconButton,
  keyframes,
  Badge,
} from '@mui/material';
import { palette } from '../../theme/palette';

// تأثير النبض للزر عند التحويم
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
`;

// تأثير الظل الخلفي
const glow = keyframes`
  0% {
    opacity: 0.4;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.95);
  }
`;

// الكارد المتجاوب للإضافة السريعة
const QuickActionCardStyled = styled(Card)<CardProps & { gradient?: string }>(
  ({ theme, gradient }) => ({
    background: gradient || 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(8px)',
    position: 'relative',
    overflow: 'visible',
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
    border: '1px solid rgba(255,255,255,0.3)',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
      '& .glowEffect': {
        opacity: 0.5,
      }
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '35%',
      borderRadius: 'inherit',
      opacity: 0.1,
      backgroundImage: 'linear-gradient(to top, transparent, rgba(255,255,255,0.8))',
    }
  }),
);

// محتوى الكارد
const QuickActionCardContent = styled(CardContent)(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
    height: '100%',
    textAlign: 'center',
    zIndex: 2,
    position: 'relative',
    '&:last-child': {
      paddingBottom: theme.spacing(3),
    },
  }),
);

// زر الإضافة المستدير
const AddButton = styled(IconButton)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: palette.primary.main,
  color: '#fff',
  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
  transition: 'all 0.4s ease',
  marginBottom: theme.spacing(2.5),
  '&:hover': {
    backgroundColor: palette.primary.dark,
    transform: 'scale(1.08) rotate(5deg)',
    animation: `${pulse} 1.5s infinite`,
  },
  '& svg': {
    fontSize: 28,
    transition: 'transform 0.3s ease',
  },
  '&:hover svg': {
    transform: 'rotate(90deg)',
  }
}));

// خط فاصل مزخرف
const Divider = styled('div')(() => ({
  width: '40%',
  height: 3,
  background: `linear-gradient(to right, ${palette.primary.light}, transparent)`,
  borderRadius: 3,
  margin: '12px auto',
}));

// تأثير الوهج الخلفي
const GlowEffect = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: '10%',
  width: '80%',
  height: '50%',
  borderRadius: '50%',
  background: palette.primary.main,
  filter: 'blur(35px)',
  opacity: 0.2,
  zIndex: 0,
  animation: `${glow} 3s infinite ease-in-out`,
  transition: 'opacity 0.5s ease',
}));

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient?: string;
  color?: string;
  sx?: object;
  badge?: number;
}

/**
 * بطاقة للإضافات السريعة بتصميم احترافي
 */
const QuickActionCard = ({
  title,
  description,
  icon,
  onClick,
  gradient,
  color = palette.primary.main,
  sx = {},
  badge,
}: QuickActionCardProps) => {
  return (
    <QuickActionCardStyled
      gradient={gradient}
      elevation={0}
      sx={{
        cursor: 'pointer',
        ...sx,
      }}
      onClick={onClick}
    >
      <GlowEffect 
        className="glowEffect" 
        sx={{ background: color }}
      />
      <QuickActionCardContent>
        {badge && badge > 0 ? (
          <Badge
            badgeContent={badge}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: 22,
                minWidth: 22,
                fontWeight: 'bold',
                right: -5,
                top: 5
              }
            }}
          >
            <AddButton aria-label="إضافة" sx={{ backgroundColor: color }}>
              {icon}
            </AddButton>
          </Badge>
        ) : (
          <AddButton aria-label="إضافة" sx={{ backgroundColor: color }}>
            {icon}
          </AddButton>
        )}
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mb: 0.5, color: palette.text.primary }}
        >
          {title}
        </Typography>
        <Divider sx={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
        {description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontSize: '1.5rem',
              fontWeight: 700,
              opacity: 0.9,
              mt: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.1)',
              color: color || palette.text.primary
            }}
          >
            {description}
          </Typography>
        )}
      </QuickActionCardContent>
    </QuickActionCardStyled>
  );
};

export default QuickActionCard; 