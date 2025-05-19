import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  BookOnline as BookOnlineIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  PendingActions as PendingActionsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { reservationsApi } from '../../services/api';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

// Define Reservation type
interface Reservation {
  id: string;
  propertyId: string;
  propertyName: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

// Reservation status options
const reservationStatuses = [
  { value: 'pending', label: 'قيد الانتظار', color: 'warning' },
  { value: 'approved', label: 'تمت الموافقة', color: 'success' },
  { value: 'rejected', label: 'مرفوض', color: 'error' },
];

const Reservations: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status change dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reservationToUpdate, setReservationToUpdate] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'approved' | 'rejected' | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch reservations on mount and when filters change
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);

        // Create filter parameters
        const params: Record<string, any> = {};
        if (searchQuery) params.search = searchQuery;
        if (statusFilter) params.status = statusFilter;
        if (dateFilter) params.dateFilter = dateFilter;

        const response = await reservationsApi.getAll(params);
        setReservations(response.data);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('حدث خطأ أثناء تحميل الحجوزات. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [searchQuery, statusFilter, dateFilter]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle reservation deletion
  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      setIsDeleting(true);
      await reservationsApi.delete(reservationToDelete);

      // Update the reservations list
      setReservations(reservations.filter(reservation => reservation.id !== reservationToDelete));

      // Close dialog
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setError('حدث خطأ أثناء حذف الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setReservationToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Open status change dialog
  const openStatusDialog = (id: string, status: 'approved' | 'rejected') => {
    setReservationToUpdate(id);
    setNewStatus(status);
    setStatusNotes('');
    setStatusDialogOpen(true);
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!reservationToUpdate || !newStatus) return;

    try {
      setIsUpdatingStatus(true);

      if (newStatus === 'approved') {
        await reservationsApi.approve(reservationToUpdate);
      } else if (newStatus === 'rejected') {
        await reservationsApi.reject(reservationToUpdate);
      }

      // Update the reservation in the list
      setReservations(reservations.map(reservation =>
        reservation.id === reservationToUpdate
          ? { ...reservation, status: newStatus }
          : reservation
      ));

      // Close dialog
      setStatusDialogOpen(false);
      setReservationToUpdate(null);
      setNewStatus('');
      setStatusNotes('');
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('حدث خطأ أثناء تحديث حالة الحجز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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

  // Calculate reservation statistics
  const reservationStats = useMemo(() => {
    if (!reservations.length) return {
      totalReservations: 0,
      pendingReservations: 0,
      approvedReservations: 0,
      rejectedReservations: 0,
    };

    const pendingReservations = reservations.filter(reservation => reservation.status === 'pending').length;
    const approvedReservations = reservations.filter(reservation => reservation.status === 'approved').length;
    const rejectedReservations = reservations.filter(reservation => reservation.status === 'rejected').length;

    return {
      totalReservations: reservations.length,
      pendingReservations,
      approvedReservations,
      rejectedReservations,
    };
  }, [reservations]);

  // Get paginated reservations
  const paginatedReservations = reservations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Refresh reservations data
  const refreshReservations = () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.dateFilter = dateFilter;

    reservationsApi.getAll(params)
      .then(response => {
        setReservations(response.data);
      })
      .catch(err => {
        console.error('Error refreshing reservations:', err);
        setError('حدث خطأ أثناء تحديث بيانات الحجوزات. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Layout title="الحجوزات">
      <Box sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <ResponsiveContainer>
          <ResponsiveGrid container spacing={3} sx={{ mb: 4 }}>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="إجمالي الحجوزات"
                value={reservationStats.totalReservations}
                icon={<BookOnlineIcon />}
                color={palette.primary.main}
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('all');
                }}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الحجوزات المعلقة"
                value={reservationStats.pendingReservations}
                icon={<PendingActionsIcon />}
                color={palette.warning.main}
                onClick={() => setStatusFilter('pending')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الحجوزات المقبولة"
                value={reservationStats.approvedReservations}
                icon={<EventAvailableIcon />}
                color={palette.success.main}
                onClick={() => setStatusFilter('approved')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الحجوزات المرفوضة"
                value={reservationStats.rejectedReservations}
                icon={<EventBusyIcon />}
                color={palette.error.main}
                onClick={() => setStatusFilter('rejected')}
              />
            </ResponsiveGrid>
          </ResponsiveGrid>
        </ResponsiveContainer>

        {/* Action Bar */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: `linear-gradient(to right, ${palette.primary.light}15, ${palette.primary.light}05)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${palette.primary.light}30`,
          }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              تصفية الحجوزات
            </Typography>

            <Box>
              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    onClick={refreshReservations}
                    disabled={loading}
                    sx={{
                      mr: 1,
                      backgroundColor: `${palette.primary.main}15`,
                      '&:hover': { backgroundColor: `${palette.primary.main}25` }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                variant="contained"
                color="primary"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setDateFilter('upcoming');
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 3,
                  fontWeight: 'bold',
                  boxShadow: 2,
                  backgroundImage: palette.gradients.primary,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                إعادة ضبط التصفية
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="بحث"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث باسم العقار أو المستخدم أو الهاتف"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2,
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: 'primary.main'
                  }
                }
              }}>
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={statusFilter}
                  label="الحالة"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {reservationStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: 'primary.main'
                  }
                }
              }}>
                <InputLabel>التاريخ</InputLabel>
                <Select
                  value={dateFilter}
                  label="التاريخ"
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="all">جميع التواريخ</MenuItem>
                  <MenuItem value="upcoming">الحجوزات القادمة</MenuItem>
                  <MenuItem value="past">الحجوزات السابقة</MenuItem>
                  <MenuItem value="current">الحجوزات الحالية</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Reservations Table */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 6px 25px rgba(25, 118, 210, 0.12)',
            border: '1px solid #d0e3f7'
          }}
        >
          <Box sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #d0e3f7',
          }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: palette.primary.main,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <BookOnlineIcon sx={{ mr: 1, color: palette.primary.main }} />
              قائمة الحجوزات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reservations.length > 0 ? `إجمالي الحجوزات: ${reservations.length}` : ''}
            </Typography>
          </Box>

          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, minHeight: 300 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
                  جاري تحميل البيانات...
                </Typography>
              </Box>
            ) : reservations.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <BookOnlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا توجد حجوزات
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي حجوزات مطابقة لمعايير البحث
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ backgroundColor: `${palette.primary.main}08` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الحجز</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العقار</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>المستخدم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>تاريخ البداية</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>تاريخ النهاية</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>السعر الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedReservations.map((reservation) => (
                    <TableRow
                      key={reservation.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${palette.primary.main}05`,
                        }
                      }}
                    >
                      <TableCell>
                        {reservation.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{reservation.propertyName}</TableCell>
                      <TableCell>
                        <Tooltip title={`${reservation.userEmail} - ${reservation.userPhone}`}>
                          <Typography variant="body2">{reservation.userName}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{formatDate(reservation.startDate)}</TableCell>
                      <TableCell>{formatDate(reservation.endDate)}</TableCell>
                      <TableCell>{formatPrice(reservation.totalPrice)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(reservation.status)}
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            color="info"
                            onClick={() => navigate(`/reservations/${reservation.id}`)}
                            sx={{ backgroundColor: `${palette.info.main}15`, mr: 1 }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        {reservation.status === 'pending' && (
                          <>
                            <Tooltip title="قبول الحجز">
                              <IconButton
                                color="success"
                                onClick={() => openStatusDialog(reservation.id, 'approved')}
                                sx={{ backgroundColor: `${palette.success.main}15`, mr: 1 }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="رفض الحجز">
                              <IconButton
                                color="error"
                                onClick={() => openStatusDialog(reservation.id, 'rejected')}
                                sx={{ backgroundColor: `${palette.error.main}15`, mr: 1 }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip title="حذف الحجز">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(reservation.id)}
                            sx={{ backgroundColor: `${palette.error.main}15` }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={reservations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الحجوزات في الصفحة:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>

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
              label="ملاحظات (اختياري)"
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
      </Box>
    </Layout>
  );
};

export default Reservations;