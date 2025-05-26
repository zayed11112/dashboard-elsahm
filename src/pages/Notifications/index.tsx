import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  MarkEmailRead as MarkEmailReadIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  EventNote as EventNoteIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  CheckCircleOutline as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationsContext';
import { collection, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Layout from '../../components/Layout';

const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications, loading } = useNotifications();
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // دالة لحذف جميع الإشعارات
  const handleDeleteAllNotifications = async () => {
    try {
      setDeleting(true);

      // استخدام دالة الحذف من الكونتكست
      await deleteAllNotifications();

      setSuccess('تم حذف جميع الإشعارات بنجاح');
      setDeleteAllDialogOpen(false);

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error) {
      console.error('Error deleting all notifications:', error);
      setError('حدث خطأ أثناء حذف الإشعارات');

      // إخفاء رسالة الخطأ بعد 3 ثوان
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setDeleting(false);
    }
  };

  // دالة لحذف إشعار واحد
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      setSuccess('تم حذف الإشعار بنجاح');

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('حدث خطأ أثناء حذف الإشعار');

      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // دالة للحصول على أيقونة حسب نوع الإشعار
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <PersonIcon />;
      case 'property':
        return <HomeIcon />;
      case 'reservation':
        return <EventNoteIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'wallet':
        return <PaymentIcon />;
      case 'system':
      default:
        return <SettingsIcon />;
    }
  };

  // دالة للحصول على لون حسب نوع الإشعار
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'primary';
      case 'property':
        return 'secondary';
      case 'reservation':
        return 'info';
      case 'payment':
        return 'warning';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'wallet':
        return 'warning';
      case 'system':
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Layout title="الإشعارات">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="الإشعارات">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  الإشعارات
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إدارة جميع الإشعارات والتنبيهات
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Badge badgeContent={unreadCount} color="error">
                <Chip
                  icon={<CircleIcon />}
                  label={`${unreadCount} غير مقروء`}
                  color="primary"
                  variant="outlined"
                />
              </Badge>
              <Chip
                icon={<NotificationsIcon />}
                label={`${notifications.length} إجمالي`}
                color="default"
                variant="outlined"
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Actions */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<MarkEmailReadIcon />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            size="small"
          >
            تعليم الكل كمقروء
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={notifications.length === 0}
            size="small"
          >
            حذف جميع الإشعارات
          </Button>
        </Stack>
      </Paper>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            لا توجد إشعارات
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ستظهر الإشعارات الجديدة هنا عند وصولها
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              elevation={notification.read ? 1 : 3}
              sx={{
                borderRadius: 2,
                border: notification.read ? '1px solid #e0e0e0' : '2px solid #1976d2',
                backgroundColor: notification.read ? 'background.paper' : 'rgba(25, 118, 210, 0.02)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs="auto">
                    <Avatar
                      sx={{
                        bgcolor: `${getNotificationColor(notification.type)}.main`,
                        width: 40,
                        height: 40
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </Grid>

                  <Grid item xs>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={notification.type}
                          size="small"
                          color={getNotificationColor(notification.type) as any}
                          variant="outlined"
                        />
                        {!notification.read && (
                          <Chip
                            icon={<CircleIcon sx={{ fontSize: 12 }} />}
                            label="جديد"
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        )}
                      </Stack>

                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: notification.read ? 'text.primary' : 'primary.main',
                          lineHeight: 1.5
                        }}
                      >
                        {notification.message}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {notification.time}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Grid>

                  <Grid item xs="auto">
                    <Stack direction="row" spacing={1}>
                      {!notification.read && (
                        <Tooltip title="تعليم كمقروء">
                          <IconButton
                            size="small"
                            onClick={() => markAsRead(notification.id)}
                            color="primary"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="حذف الإشعار">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotification(notification.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <DeleteSweepIcon color="error" />
            <Typography variant="h6">تأكيد حذف جميع الإشعارات</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            هل أنت متأكد من أنك تريد حذف جميع الإشعارات؟
          </Typography>
          <Typography variant="body2" color="text.secondary">
            هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع الإشعارات ({notifications.length}) نهائياً.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteAllDialogOpen(false)}
            disabled={deleting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteAllNotifications}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
          >
            {deleting ? 'جاري الحذف...' : 'حذف الكل'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Layout>
  );
};

export default NotificationsPage;
