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
  Payment as PaymentIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { checkoutRequestsApi } from '../../services/api';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';
import { useNotifications } from '../../contexts/NotificationsContext';

// تعريف واجهة طلب الحجز
interface CheckoutRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  customerName: string;
  customerPhone: string;
  universityId: string;
  college: string;
  status: string;
  commission: number;
  deposit: number;
  propertyPrice: number;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

// خيارات حالة طلب الحجز
const checkoutStatuses = [
  { value: 'جاري المعالجة', label: 'جاري المعالجة', color: 'warning' },
  { value: 'مؤكد', label: 'مؤكد', color: 'success' },
  { value: 'ملغي', label: 'ملغي', color: 'error' },
];

const CheckoutRequests: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  // حالة البيانات
  const [checkoutRequests, setCheckoutRequests] = useState<CheckoutRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // حالة الصفحة
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // حالة البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // حالة حوار الحذف
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  // حالة حوار تغيير الحالة
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [requestToUpdateStatus, setRequestToUpdateStatus] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // إحصائيات طلبات الحجز
  const checkoutStats = useMemo(() => {
    const totalRequests = checkoutRequests.length;
    const pendingRequests = checkoutRequests.filter(r => r.status === 'جاري المعالجة').length;
    const confirmedRequests = checkoutRequests.filter(r => r.status === 'مؤكد').length;
    const cancelledRequests = checkoutRequests.filter(r => r.status === 'ملغي').length;

    // حساب إجمالي العمولات
    const totalCommission = checkoutRequests
      .filter(r => r.status === 'مؤكد')
      .reduce((sum, r) => sum + (r.commission || 0), 0);

    // حساب إجمالي العربون
    const totalDeposit = checkoutRequests
      .reduce((sum, r) => sum + (r.deposit || 0), 0);

    return {
      totalRequests,
      pendingRequests,
      confirmedRequests,
      cancelledRequests,
      totalCommission,
      totalDeposit
    };
  }, [checkoutRequests]);

  // جلب البيانات
  const fetchCheckoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await checkoutRequestsApi.getAll();
      setCheckoutRequests(response.data);
    } catch (err) {
      console.error('Error fetching checkout requests:', err);
      setError('حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchCheckoutRequests();
  }, []);

  // تصفية البيانات حسب البحث والفلاتر
  const filteredRequests = useMemo(() => {
    return checkoutRequests.filter(request => {
      // تصفية حسب البحث
      const matchesSearch = searchQuery === '' ||
        request.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customerPhone.includes(searchQuery);

      // تصفية حسب الحالة
      const matchesStatus = statusFilter === '' || request.status === statusFilter;

      // تصفية حسب التاريخ
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const requestDate = new Date(request.createdAt);
        const today = new Date();

        if (dateFilter === 'today') {
          matchesDate = requestDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = requestDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = requestDate >= monthAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [checkoutRequests, searchQuery, statusFilter, dateFilter]);

  // البيانات المعروضة في الصفحة الحالية
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredRequests, page, rowsPerPage]);

  // التعامل مع تغيير الصفحة
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // التعامل مع تغيير عدد الصفوف في الصفحة
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // فتح حوار الحذف
  const openDeleteDialog = (id: string) => {
    setRequestToDelete(id);
    setDeleteDialogOpen(true);
  };

  // إغلاق حوار الحذف
  const closeDeleteDialog = () => {
    setRequestToDelete(null);
    setDeleteDialogOpen(false);
  };

  // حذف طلب الحجز
  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      setLoading(true);
      const requestToRemove = checkoutRequests.find(r => r.id === requestToDelete);
      await checkoutRequestsApi.delete(requestToDelete);

      // تحديث القائمة
      setCheckoutRequests(prev => prev.filter(r => r.id !== requestToDelete));

      // إضافة إشعار
      if (requestToRemove) {
        await addNotification(`تم حذف طلب الحجز للعقار: ${requestToRemove.propertyName}`, 'reservation');
      }

      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting checkout request:', err);
      setError('حدث خطأ أثناء حذف الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // فتح حوار تغيير الحالة
  const openStatusDialog = (id: string, currentStatus: string) => {
    setRequestToUpdateStatus(id);
    setNewStatus(currentStatus);
    setStatusDialogOpen(true);
  };

  // إغلاق حوار تغيير الحالة
  const closeStatusDialog = () => {
    setRequestToUpdateStatus(null);
    setStatusDialogOpen(false);
  };

  // تحديث حالة طلب الحجز
  const handleUpdateStatus = async () => {
    if (!requestToUpdateStatus || !newStatus) return;

    try {
      setLoading(true);
      await checkoutRequestsApi.updateStatus(requestToUpdateStatus, newStatus);

      // تحديث القائمة
      const updatedRequest = checkoutRequests.find(r => r.id === requestToUpdateStatus);
      setCheckoutRequests(prev => prev.map(r =>
        r.id === requestToUpdateStatus ? { ...r, status: newStatus } : r
      ));

      // إضافة إشعار
      if (updatedRequest) {
        if (newStatus === 'مؤكد') {
          await addNotification(`تم تأكيد طلب الحجز للعقار: ${updatedRequest.propertyName}`, 'reservation');
        } else if (newStatus === 'ملغي') {
          await addNotification(`تم إلغاء طلب الحجز للعقار: ${updatedRequest.propertyName}`, 'reservation');
        } else {
          await addNotification(`تم تغيير حالة طلب الحجز للعقار: ${updatedRequest.propertyName}`, 'reservation');
        }
      }

      closeStatusDialog();
    } catch (err) {
      console.error('Error updating checkout request status:', err);
      setError('حدث خطأ أثناء تحديث حالة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'مؤكد':
        return 'success';
      case 'جاري المعالجة':
        return 'warning';
      case 'ملغي':
        return 'error';
      default:
        return 'default';
    }
  };

  // تنسيق السعر
  const formatPrice = (price: number): string => {
    return `${price.toLocaleString('en-US')} EGP`;
  };

  return (
    <Layout title="طلبات الحجز">
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
            <ResponsiveGrid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="قيد المعالجة"
                value={checkoutStats.pendingRequests}
                icon={<PendingActionsIcon />}
                color={palette.warning.main}
                onClick={() => setStatusFilter('جاري المعالجة')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="مؤكدة"
                value={checkoutStats.confirmedRequests}
                icon={<EventAvailableIcon />}
                color={palette.success.main}
                onClick={() => setStatusFilter('مؤكد')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="ملغية"
                value={checkoutStats.cancelledRequests}
                icon={<EventBusyIcon />}
                color={palette.error.main}
                onClick={() => setStatusFilter('ملغي')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="إجمالي العمولات"
                value={formatPrice(checkoutStats.totalCommission)}
                icon={<BookOnlineIcon />}
                color="#8e44ad"
                onClick={() => {
                  setStatusFilter('مؤكد');
                }}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={2.4}>
              <StatCard
                title="إجمالي العربون"
                value={formatPrice(checkoutStats.totalDeposit)}
                icon={<PaymentIcon />}
                color="#2980b9"
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('all');
                }}
                gradient="linear-gradient(135deg, #3498db 0%, #2980b9 100%)"
              />
            </ResponsiveGrid>
          </ResponsiveGrid>
        </ResponsiveContainer>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="البحث بالاسم أو رقم الهاتف أو العقار"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>حالة الطلب</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="حالة الطلب"
                >
                  <MenuItem value="">الكل</MenuItem>
                  {checkoutStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>التاريخ</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as string)}
                  label="التاريخ"
                >
                  <MenuItem value="all">كل الفترات</MenuItem>
                  <MenuItem value="today">اليوم</MenuItem>
                  <MenuItem value="week">آخر أسبوع</MenuItem>
                  <MenuItem value="month">آخر شهر</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setDateFilter('all');
                }}
                startIcon={<FilterListIcon />}
              >
                إعادة ضبط
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Checkout Requests Table */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #d0e3f7',
            background: `linear-gradient(135deg, ${palette.primary.main}15 0%, ${palette.primary.light}15 100%)`
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
              قائمة طلبات الحجز
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredRequests.length > 0 ? `إجمالي الطلبات: ${filteredRequests.length}` : ''}
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
            ) : filteredRequests.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <BookOnlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا توجد طلبات حجز
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي طلبات حجز مطابقة لمعايير البحث
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ backgroundColor: `${palette.primary.main}08` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الطلب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العقار</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>اسم العميل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العربون</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العمولة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${palette.primary.main}05`,
                        }
                      }}
                    >
                      <TableCell>
                        {request.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{request.propertyName}</TableCell>
                      <TableCell>{request.customerName}</TableCell>
                      <TableCell>{request.customerPhone}</TableCell>
                      <TableCell>{formatPrice(request.deposit || 0)}</TableCell>
                      <TableCell>{formatPrice(request.commission)}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="تغيير الحالة">
                          <IconButton
                            color="primary"
                            onClick={() => openStatusDialog(request.id, request.status)}
                            sx={{ backgroundColor: `${palette.primary.main}15` }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف الطلب">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(request.id)}
                            sx={{ backgroundColor: `${palette.error.main}15`, ml: 1 }}
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
            count={filteredRequests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الطلبات في الصفحة:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            إلغاء
          </Button>
          <Button onClick={handleDeleteRequest} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
      >
        <DialogTitle>تغيير حالة الطلب</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            يرجى اختيار الحالة الجديدة للطلب:
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="الحالة"
            >
              {checkoutStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} color="primary">
            إلغاء
          </Button>
          <Button onClick={handleUpdateStatus} color="primary" variant="contained">
            تحديث
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CheckoutRequests;
