import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ResponsiveCard from './ResponsiveCard';

interface ListItemData {
  id: string;
  primary: string;
  secondary?: string | ReactNode;
  avatar?: ReactNode;
  action?: ReactNode;
  color?: string;
  onClick?: () => void;
}

interface ListCardProps {
  title: string;
  subtitle?: string;
  items: ListItemData[];
  viewAllLink?: string;
  onViewAll?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  maxItems?: number;
  noDataMessage?: string;
  gradient?: string;
  icon?: ReactNode;
  sx?: any;
}

/**
 * بطاقة للقوائم متجاوبة مع تصميم محسن
 */
const ListCard: React.FC<ListCardProps> = ({
  title,
  subtitle,
  items,
  viewAllLink,
  onViewAll,
  onRefresh,
  loading = false,
  maxItems = 5,
  noDataMessage = 'لا توجد عناصر متاحة',
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

  // تحديد العناصر التي سيتم عرضها
  const displayItems = items.slice(0, maxItems);

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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : displayItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {noDataMessage}
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {displayItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  py: 2,
                  px: 2,
                  cursor: item.onClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                }}
                onClick={item.onClick}
              >
                {item.avatar && (
                  <ListItemAvatar>
                    {typeof item.avatar === 'string' ? (
                      <Avatar
                        sx={{
                          bgcolor: item.color || theme.palette.primary.main,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        {item.avatar}
                      </Avatar>
                    ) : (
                      item.avatar
                    )}
                  </ListItemAvatar>
                )}

                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {item.primary}
                    </Typography>
                  }
                  secondary={
                    item.secondary && (
                      typeof item.secondary === 'string' ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'inline' }}
                        >
                          {item.secondary}
                        </Typography>
                      ) : (
                        item.secondary
                      )
                    )
                  }
                />

                {item.action && (
                  <ListItemSecondaryAction>
                    {item.action}
                  </ListItemSecondaryAction>
                )}
              </ListItem>

              {index < displayItems.length - 1 && (
                <Divider variant={item.avatar ? "inset" : "fullWidth"} component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </ResponsiveCard>
  );
};

export default ListCard;
