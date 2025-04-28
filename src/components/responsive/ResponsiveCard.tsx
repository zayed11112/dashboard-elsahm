import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ResponsiveCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  onRefresh?: () => void;
  onMoreClick?: () => void;
  onClick?: () => void;
  elevation?: number;
  minHeight?: number | string;
  sx?: any;
  headerSx?: any;
  contentSx?: any;
  footerSx?: any;
  noPadding?: boolean;
  noHeader?: boolean;
  noBodyPadding?: boolean;
  divider?: boolean;
  gradient?: string;
}

/**
 * بطاقة متجاوبة مع تصميم محسن
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  action,
  footer,
  onRefresh,
  onMoreClick,
  onClick,
  elevation = 3,
  minHeight,
  sx = {},
  headerSx = {},
  contentSx = {},
  footerSx = {},
  noPadding = false,
  noHeader = false,
  noBodyPadding = false,
  divider = false,
  gradient,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // تحديد الإجراءات الافتراضية للبطاقة
  const defaultActions = (
    <>
      {onRefresh && (
        <Tooltip title="تحديث">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onMoreClick && (
        <Tooltip title="المزيد">
          <IconButton size="small" onClick={onMoreClick}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  return (
    <Card
      elevation={elevation}
      onClick={onClick}
      sx={{
        minHeight,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 2,
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[elevation + 2],
        },
        ...(gradient && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '5px',
            background: gradient,
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            opacity: 0.02,
            zIndex: 0,
          },
        }),
        ...sx,
      }}
    >
      {!noHeader && (title || subtitle || icon) && (
        <>
          <CardHeader
            avatar={icon}
            title={
              title && (
                <Typography
                  variant="h6"
                  fontWeight="600"
                  sx={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  {title}
                </Typography>
              )
            }
            subheader={
              subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    opacity: 0.8,
                    mt: 0.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )
            }
            action={action || defaultActions}
            sx={{
              p: isMobile ? 2 : 3,
              pb: divider ? (isMobile ? 1.5 : 2) : 0,
              position: 'relative',
              zIndex: 2,
              ...headerSx,
            }}
          />
          {divider && <Divider />}
        </>
      )}

      <CardContent
        sx={{
          p: noPadding || noBodyPadding ? 0 : (isMobile ? 2 : 3),
          '&:last-child': {
            pb: noPadding || noBodyPadding ? 0 : (isMobile ? 2 : 3),
          },
          position: 'relative',
          zIndex: 2,
          ...contentSx,
        }}
      >
        {children}
      </CardContent>

      {footer && (
        <>
          {divider && <Divider />}
          <CardActions
            sx={{
              p: isMobile ? 2 : 3,
              pt: divider ? (isMobile ? 1.5 : 2) : 0,
              position: 'relative',
              zIndex: 2,
              ...footerSx,
            }}
          >
            {typeof footer === 'string' ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  opacity: 0.8,
                }}
              >
                {footer}
              </Typography>
            ) : (
              footer
            )}
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default ResponsiveCard;
