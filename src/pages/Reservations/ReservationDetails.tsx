import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  PersonOutline as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  DateRange as DateRangeIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { reservationsApi } from '../../services/api';

// Define Reservation type
interface Reservation {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
  propertyBedrooms: number;
  propertyBathrooms: number;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Reservation status options
const reservationStatuses = [
  { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
  { value: 'approved', label: 'تمت الموافقة', color: 'success' },
  { value: 'rejected', label: 'مرفوض', color: 'error' },
];

const ReservationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status change dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'approved' | 'rejected' | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await reservationsApi.getById(id);
        setReservation(response.data);
      } catch (err) {
        console.error('Error fetching reservation:', err);
        setError('حدث خطأ أثناء تحميل بيانات الحجز. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Format price
  const formatPrice = (price: number) => {
    // تنسيق السعر بدون أصفار إضافية بالإنجليزية
    return new Intl.NumberFormat('en-US', {
      style: 'decimal', // استخدام تنسيق عشري بدلاً من تنسيق العملة
      maximumFractionDigits: 0, // بدون كسور عشرية
    }).format(price) + ' EGP'; // إضافة رمز العملة يدوياً
  };

  // Calculate duration in days
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusOption = reservationStatuses.find(s => s.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusOption = reservationStatuses.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Open status change dialog
  const openStatusDialog = (status: 'approved' | 'rejected') => {
    setNewStatus(status);
    setStatusNotes('');
    setStatusDialogOpen(true);
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!id || !newStatus) return;

    try {
      setIsUpdatingStatus(true);

      if (newStatus === 'approved') {
        await reservationsApi.approve(id);
      } else if (newStatus === 'rejected') {
        await reservationsApi.reject(id);
      }

      // Update reservation in state
      if (reservation) {
        setReservation({
          ...reservation,
          status: newStatus,
          adminNotes: statusNotes || reservation.adminNotes,
        });
      }

      // Close dialog
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('حدث خطأ أثناء تحديث حالة الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle reservation deletion
  const handleDeleteReservation = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await reservationsApi.delete(id);

      // Navigate back to reservations list
      navigate('/reservations');
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setError('حدث خطأ أثناء حذف الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="تفاصيل الحجز">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!reservation) {
    return (
      <Layout title="تفاصيل الحجز">
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {error || 'لم يتم العثور على الحجز المطلوب.'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/reservations')}
            sx={{ mt: 2 }}
          >
            العودة للقائمة
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="تفاصيل الحجز">
      <Box sx={{ p: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Header with back button and actions */}
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/reservations')}
              >
                العودة للقائمة
              </Button>
            </Grid>

            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Typography variant="h6">
                حجز رقم: {id?.substring(0, 8)}...
              </Typography>
              <Chip
                label={getStatusLabel(reservation.status)}
                color={getStatusColor(reservation.status) as any}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {/* Show action buttons based on status */}
              {reservation.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openStatusDialog('approved')}
                  >
                    قبول
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => openStatusDialog('rejected')}
                  >
                    رفض
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                حذف
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Main content */}
        <Grid container spacing={3}>
          {/* Reservation Summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <DateRangeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  تفاصيل الحجز
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ البداية
                    </Typography>
                    <Typography variant="body1">{formatDate(reservation.startDate)}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ النهاية
                    </Typography>
                    <Typography variant="body1">{formatDate(reservation.endDate)}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      المدة
                    </Typography>
                    <Typography variant="body1">
                      {calculateDuration(reservation.startDate, reservation.endDate)} يوم
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      السعر الإجمالي
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      {formatPrice(reservation.totalPrice)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      تاريخ إنشاء الحجز
                    </Typography>
                    <Typography variant="body1">{formatDate(reservation.createdAt)}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      آخر تحديث
                    </Typography>
                    <Typography variant="body1">
                      {reservation.updatedAt ? formatDate(reservation.updatedAt) : 'لا يوجد'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ملاحظات العميل
                    </Typography>
                    <Typography variant="body1">
                      {reservation.notes || 'لا توجد ملاحظات'}
                    </Typography>
                  </Grid>

                  {reservation.adminNotes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ملاحظات الإدارة
                      </Typography>
                      <Typography variant="body1">{reservation.adminNotes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* User Info */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  بيانات العميل
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {reservation.userName.charAt(0)}
                  </Avatar>
                  <Typography variant="h6">{reservation.userName}</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{reservation.userEmail}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{reservation.userPhone}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/users/${reservation.userId}`)}
                    >
                      عرض بيانات العميل الكاملة
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <HomeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  بيانات العقار
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {reservation.propertyName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{reservation.propertyAddress}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      النوع
                    </Typography>
                    <Typography variant="body1">{reservation.propertyType}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      غرف النوم
                    </Typography>
                    <Typography variant="body1">{reservation.propertyBedrooms}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      الحمامات
                    </Typography>
                    <Typography variant="body1">{reservation.propertyBathrooms}</Typography>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/properties/${reservation.propertyId}`)}
                    >
                      عرض بيانات العقار الكاملة
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Change Dialog */}
        <Dialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
        >
          <DialogTitle>
            {newStatus === 'approved' ? 'تأكيد قبول الحجز' : 'تأكيد رفض الحجز'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              {newStatus === 'approved'
                ? 'هل أنت متأكد من رغبتك في قبول هذا الحجز؟'
                : 'هل أنت متأكد من رغبتك في رفض هذا الحجز؟'}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="ملاحظات الإدارة (اختياري)"
              fullWidth
              multiline
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setStatusDialogOpen(false)}
              color="primary"
              disabled={isUpdatingStatus}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleStatusChange}
              color={newStatus === 'approved' ? 'success' : 'error'}
              disabled={isUpdatingStatus}
              variant="contained"
              startIcon={isUpdatingStatus ? <CircularProgress size={20} /> : null}
            >
              {isUpdatingStatus
                ? 'جاري التحديث...'
                : newStatus === 'approved'
                ? 'قبول'
                : 'رفض'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من رغبتك في حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              color="primary"
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteReservation}
              color="error"
              disabled={isDeleting}
              variant="contained"
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ReservationDetails;