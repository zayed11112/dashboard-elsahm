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
  Badge,
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
  Notifications as NotificationsIcon,
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
import { doc, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

// OneSignal Configuration
const ONESIGNAL_APP_ID = '3136dbc6-c09c-4bca-b0aa-fe35421ac513';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_ge3nxrwatrf4vmfk7y2uegwfcoh7sdj2pttujimbv2rz3di7wkuasxw76ylt66ecvgc65sx4fuikh2dph23tq66ryq2gdog47mzg2ja';

// دالة لإرسال إشعار عبر OneSignal
const sendOneSignalNotification = async (
  userId: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
) => {
  try {
    console.log('Sending OneSignal notification to user:', userId);
    
    // تطهير معرف المستخدم من أي مسافات زائدة
    const cleanUserId = userId.trim();
    
    // تبسيط الطلب للتركيز على العناصر الأساسية فقط
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [cleanUserId],
      headings: { en: title },
      contents: { en: message },
      data: data,
      // إزالة الإعدادات الإضافية التي قد تسبب مشاكل
      priority: 10
    };
    
    console.log('OneSignal simplified payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('OneSignal API full response:', JSON.stringify(result, null, 2));
    
    // تحليل الاستجابة لمعرفة ما إذا كان الإرسال ناجحاً
    if (!response.ok) {
      console.error('OneSignal API error status:', response.status);
      if (result.errors) {
        console.error('OneSignal API detailed errors:', result.errors);
        throw new Error(`OneSignal API errors: ${JSON.stringify(result.errors)}`);
      } else {
        throw new Error(`OneSignal API HTTP Error: ${response.status}`);
      }
    }
    
    if (result.recipients === 0) {
      console.warn('Warning: No recipients received the notification. User may not have the app installed or token might be invalid.');
    } else {
      console.log(`Successfully sent to ${result.recipients} recipients`);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    throw error;
  }
};

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
  notes?: string;
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
  const [success, setSuccess] = useState<string | null>(null);

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
  const [notes, setNotes] = useState('');

  // حالة حوار إرسال الإشعار
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [inAppNotificationDialogOpen, setInAppNotificationDialogOpen] = useState(false);
  const [pushNotificationDialogOpen, setPushNotificationDialogOpen] = useState(false);
  const [requestToNotify, setRequestToNotify] = useState<CheckoutRequest | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');

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
    const request = checkoutRequests.find(r => r.id === id);
    setRequestToUpdateStatus(id);
    setNewStatus(currentStatus);
    setNotes(request?.notes || '');
    setStatusDialogOpen(true);
  };

  // إغلاق حوار تغيير الحالة
  const closeStatusDialog = () => {
    setRequestToUpdateStatus(null);
    setStatusDialogOpen(false);
    setNotes('');
  };

  // تحديث حالة طلب الحجز
  const handleUpdateStatus = async () => {
    if (!requestToUpdateStatus || !newStatus) return;

    try {
      setLoading(true);
      // تحديث الحالة والملاحظات
      await checkoutRequestsApi.updateStatus(requestToUpdateStatus, newStatus, notes);

      // تحديث القائمة
      const updatedRequest = checkoutRequests.find(r => r.id === requestToUpdateStatus);
      setCheckoutRequests(prev => prev.map(r =>
        r.id === requestToUpdateStatus ? { ...r, status: newStatus, notes: notes } : r
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

  // فتح حوار إرسال الإشعار
  const openNotificationDialog = (request: CheckoutRequest) => {
    setRequestToNotify(request);
    setNotificationTitle(`تأكيد حجز ${request.propertyName}`);
    setNotificationMessage(`تم الحجز بنجاح لـ ${request.propertyName}.لمزيد من التفاصيل يرجى التواصل معنا على الرقم 01093130120.`);
    setNotificationDialogOpen(true);
  };

  // فتح حوار إرسال الإشعار داخل التطبيق
  const openInAppNotificationDialog = (request: CheckoutRequest) => {
    setRequestToNotify(request);
    setNotificationTitle(`تأكيد حجز ${request.propertyName}`);
    setNotificationMessage(`تم الحجز بنجاح لـ ${request.propertyName}.لمزيد من التفاصيل يرجى التواصل معنا على الرقم 01093130120.`);
    setInAppNotificationDialogOpen(true);
  };

  // فتح حوار إرسال الإشعار خارج التطبيق
  const openPushNotificationDialog = (request: CheckoutRequest) => {
    setRequestToNotify(request);
    setNotificationTitle(`تأكيد حجز ${request.propertyName}`);
    setNotificationMessage(`تم الحجز بنجاح لـ ${request.propertyName}.لمزيد من التفاصيل يرجى التواصل معنا على الرقم 01093130120.`);
    setPushNotificationDialogOpen(true);
  };

  // إغلاق حوار إرسال الإشعار
  const closeNotificationDialog = () => {
    setRequestToNotify(null);
    setNotificationDialogOpen(false);
  };

  // إغلاق حوار إرسال الإشعار داخل التطبيق
  const closeInAppNotificationDialog = () => {
    setRequestToNotify(null);
    setInAppNotificationDialogOpen(false);
  };

  // إغلاق حوار إرسال الإشعار خارج التطبيق
  const closePushNotificationDialog = () => {
    setRequestToNotify(null);
    setPushNotificationDialogOpen(false);
  };

  // إرسال إشعار للمستخدم
  const handleSendNotification = async () => {
    if (!requestToNotify || !requestToNotify.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closeNotificationDialog();
      return;
    }

    try {
      setLoading(true);
      
      const notificationId = `reservation_${requestToNotify.id}_${Date.now()}`;
      
      // إضافة إشعار في Firestore للمستخدم
      await addDoc(collection(db, 'notifications'), {
        userId: requestToNotify.userId.trim(),
        title: notificationTitle,
        body: notificationMessage,
        type: 'reservation',
        timestamp: new Date(),
        isRead: false,
        additionalData: {
          requestId: requestToNotify.id,
          propertyName: requestToNotify.propertyName,
        },
        targetScreen: 'BookingDetails',
      });

      // إرسال إشعار خارجي باستخدام OneSignal
      try {
        const oneSignalResult = await sendOneSignalNotification(
          requestToNotify.userId.trim(),
          notificationTitle,
          notificationMessage,
          {
            type: 'reservation',
            requestId: requestToNotify.id,
            propertyName: requestToNotify.propertyName,
            targetScreen: 'BookingDetails'
          }
        );
        
        console.log('نتيجة إرسال إشعار OneSignal:', oneSignalResult);
        setSuccess(`تم إرسال الإشعار للمستخدم ${requestToNotify.customerName} بنجاح (داخل التطبيق وخارجه).`);
      } catch (pushError) {
        console.error('فشل إرسال إشعار OneSignal:', pushError);
        // في حالة فشل إرسال الإشعار الخارجي، نعتبر العملية ناجحة لأننا أضفنا الإشعار بنجاح في Firestore على الأقل
        setSuccess(`تم إرسال الإشعار للمستخدم ${requestToNotify.customerName} بنجاح (داخل التطبيق فقط). لم يتم إرسال إشعار خارجي.`);
      }

      // إضافة إشعار للمدير في لوحة التحكم
      await addNotification(`تم إرسال إشعار لـ ${requestToNotify.customerName} بخصوص طلب الحجز: ${requestToNotify.propertyName}`, 'reservation');
      
      closeNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');
      
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // إرسال إشعار داخل التطبيق فقط
  const handleSendInAppNotification = async () => {
    if (!requestToNotify || !requestToNotify.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closeInAppNotificationDialog();
      return;
    }

    try {
      setLoading(true);
      
      const notificationId = `reservation_${requestToNotify.id}_${Date.now()}`;
      
      // إضافة إشعار في Firestore للمستخدم
      await addDoc(collection(db, 'notifications'), {
        userId: requestToNotify.userId.trim(),
        title: notificationTitle,
        body: notificationMessage,
        type: 'reservation',
        timestamp: new Date(),
        isRead: false,
        additionalData: {
          requestId: requestToNotify.id,
          propertyName: requestToNotify.propertyName,
        },
        targetScreen: 'BookingDetails',
      });

      // إضافة إشعار للمدير في لوحة التحكم
      await addNotification(`تم إرسال إشعار داخلي لـ ${requestToNotify.customerName} بخصوص طلب الحجز: ${requestToNotify.propertyName}`, 'reservation');
      
      setSuccess(`تم إرسال الإشعار داخل التطبيق للمستخدم ${requestToNotify.customerName} بنجاح.`);
      closeInAppNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');
      
    } catch (err) {
      console.error('Error sending in-app notification:', err);
      setError('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // إرسال إشعار خارج التطبيق فقط
  const handleSendPushNotification = async () => {
    if (!requestToNotify || !requestToNotify.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closePushNotificationDialog();
      return;
    }

    try {
      setLoading(true);
      
      // إرسال إشعار خارجي باستخدام OneSignal
      const oneSignalResult = await sendOneSignalNotification(
        requestToNotify.userId.trim(),
        notificationTitle,
        notificationMessage,
        {
          type: 'reservation',
          requestId: requestToNotify.id,
          propertyName: requestToNotify.propertyName,
          targetScreen: 'BookingDetails'
        }
      );
      
      console.log('نتيجة إرسال إشعار OneSignal:', oneSignalResult);
      
      // إضافة إشعار للمدير في لوحة التحكم
      await addNotification(`تم إرسال إشعار خارجي لـ ${requestToNotify.customerName} بخصوص طلب الحجز: ${requestToNotify.propertyName}`, 'reservation');
      
      setSuccess(`تم إرسال الإشعار خارج التطبيق للمستخدم ${requestToNotify.customerName} بنجاح.`);
      closePushNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');
      
    } catch (err) {
      console.error('Error sending push notification:', err);
      setError('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="طلبات الحجز">
      <Box sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
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
            borderBottom: '2px solid #d0e3f7'
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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الطلب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العقار</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>اسم العميل</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العربون</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العمولة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الملاحظات</TableCell>
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
                        {request.notes ? 
                          <Tooltip title={request.notes}>
                            <span>{request.notes.length > 20 ? `${request.notes.substring(0, 20)}...` : request.notes}</span>
                          </Tooltip> 
                        : '—'}
                      </TableCell>
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
                            sx={{ }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="إرسال إشعار داخل التطبيق">
                          <IconButton
                            color="info"
                            onClick={() => openInAppNotificationDialog(request)}
                            sx={{ ml: 1 }}
                            disabled={!request.userId}
                          >
                            <Badge badgeContent="داخلي" color="info" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: '16px', minWidth: '16px' } }}>
                              <NotificationsIcon />
                            </Badge>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="إرسال إشعار خارج التطبيق">
                          <IconButton
                            color="primary"
                            onClick={() => openPushNotificationDialog(request)}
                            sx={{ ml: 1 }}
                            disabled={!request.userId}
                          >
                            <Badge badgeContent="خارجي" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: '16px', minWidth: '16px' } }}>
                              <NotificationsIcon />
                            </Badge>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف الطلب">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(request.id)}
                            sx={{ ml: 1 }}
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
        <DialogTitle>تغيير حالة طلب الحجز</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-select-label">الحالة</InputLabel>
            <Select
              labelId="status-select-label"
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
          <TextField
            margin="normal"
            fullWidth
            label="ملاحظات"
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} color="primary">
            إلغاء
          </Button>
          <Button onClick={handleUpdateStatus} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={closeNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إرسال إشعار للمستخدم</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار للمستخدم {requestToNotify?.customerName || ''} بخصوص طلب حجز {requestToNotify?.propertyName || ''}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNotificationDialog} color="primary">
            إلغاء
          </Button>
          <Button 
            onClick={handleSendNotification} 
            color="primary" 
            variant="contained"
            disabled={!notificationMessage || !notificationTitle}
          >
            إرسال
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-App Notification Dialog */}
      <Dialog
        open={inAppNotificationDialogOpen}
        onClose={closeInAppNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: 'info.main', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <NotificationsIcon />
          إرسال إشعار داخل التطبيق
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار داخل التطبيق فقط للمستخدم {requestToNotify?.customerName || ''} بخصوص طلب حجز {requestToNotify?.propertyName || ''}
          </DialogContentText>

          <Alert severity="info" sx={{ mb: 2 }}>
            هذا الإشعار سيظهر فقط داخل التطبيق في قائمة الإشعارات ولن يتم إرساله كإشعار دفعي.
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closeInAppNotificationDialog} 
            variant="outlined"
            color="inherit"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSendInAppNotification} 
            variant="contained"
            color="info"
            startIcon={<NotificationsIcon />}
            disabled={!notificationMessage || !notificationTitle || loading}
          >
            {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار داخل التطبيق'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Push Notification Dialog */}
      <Dialog
        open={pushNotificationDialogOpen}
        onClose={closePushNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: 'primary.main', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <NotificationsIcon />
          إرسال إشعار خارج التطبيق
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار خارج التطبيق (إشعار دفعي) للمستخدم {requestToNotify?.customerName || ''} بخصوص طلب حجز {requestToNotify?.propertyName || ''}
          </DialogContentText>

          <Alert severity="info" sx={{ mb: 2 }}>
            هذا الإشعار سيظهر خارج التطبيق كإشعار دفعي على جهاز المستخدم ولن يظهر في قائمة الإشعارات داخل التطبيق.
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={closePushNotificationDialog} 
            variant="outlined"
            color="inherit"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSendPushNotification} 
            variant="contained"
            color="primary"
            startIcon={<NotificationsIcon />}
            disabled={!notificationMessage || !notificationTitle || loading}
          >
            {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار خارج التطبيق'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CheckoutRequests;
