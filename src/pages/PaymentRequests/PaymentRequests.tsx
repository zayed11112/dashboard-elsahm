import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Paper,
  Link,
  Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Phone as PhoneIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AttachMoney as AttachMoneyIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabase } from '../../supabase/client';
import { palette } from '../../theme/palette';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNotifications } from '../../contexts/NotificationsContext';

// تعريف واجهة لطلب الدفع
interface PaymentRequest {
  id: number;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  amount: number;
  payment_method: string;
  source_phone: string;
  payment_proof_url: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  user_name: string;
  university_id: string | null;
  faculty: string | null;
  branch: string | null;
  current_balance: number | null;
}

// مكون صفحة طلبات شحن الرصيد
const PaymentRequests: React.FC = () => {
  // حالة البيانات
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // حالة فلتر التبويب
  const [tabValue, setTabValue] = useState<string>('pending');
  
  // حالة مربعات الحوار
  const [previewDialogOpen, setPreviewDialogOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [currentRequest, setCurrentRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // للتعامل مع الإشعارات
  const { addNotification } = useNotifications();

  // تنسيق العملة بالأرقام الإنجليزية
  const formatCurrency = useCallback((amount: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount) + ' جنيه';
  }, []);

  // تنسيق التاريخ بالميلادي
  const formatDate = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'غير محدد';
    
    const date = new Date(timestamp);
    
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }, []);

  // جلب طلبات الدفع من Supabase - استخدام useCallback لمنع إعادة إنشاء الدالة مع كل تحديث
  const fetchPaymentRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPaymentRequests(data || []);
      
      // تطبيق الفلتر الأولي
      if (data) {
        if (tabValue === 'all') {
          setFilteredRequests(data);
        } else {
          setFilteredRequests(data.filter(req => req.status === tabValue));
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment requests:', err);
      setError('حدث خطأ أثناء جلب طلبات الدفع: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [tabValue]); // إضافة tabValue كتبعية للدالة

  useEffect(() => {
    fetchPaymentRequests();
  }, [fetchPaymentRequests]); // إضافة fetchPaymentRequests كتبعية

  // إضافة listener للطلبات الجديدة
  useEffect(() => {
    // إعداد الاستماع للتغييرات في طلبات الدفع
    let lastRequestId: number | null = null;
    
    const createSubscription = () => {
      // استخدام ميزة subscriptions من Supabase
      const subscription = supabase
        .channel('payment_requests_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'payment_requests',
          },
          (payload) => {
            // عند إضافة طلب دفع جديد
            const newRequest = payload.new as PaymentRequest;
            
            // تجنب معالجة نفس الطلب مرتين
            if (lastRequestId === newRequest.id) return;
            lastRequestId = newRequest.id;
            
            // تحديث قائمة الطلبات
            setPaymentRequests(prev => [newRequest, ...prev]);
            
            // إضافة إشعار
            addNotification({
              id: `new_payment_request_${newRequest.id}`,
              message: `طلب شحن رصيد جديد من ${newRequest.user_name} بمبلغ ${formatCurrency(newRequest.amount)}`,
              time: new Date().toISOString(),
              read: false,
              type: 'payment'
            });
            
            // تحديث الصوت إذا كان متاحًا
            const notificationSound = new Audio('/notification.mp3');
            notificationSound.play().catch(e => console.log('Sound play error:', e));
          }
        )
        .subscribe();
        
      return subscription;
    };
    
    const subscription = createSubscription();
    
    // إلغاء الاشتراك عند إزالة المكون
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [addNotification, formatCurrency]); // إضافة formatCurrency كتبعية

  // تصفية الطلبات حسب التبويب المحدد
  useEffect(() => {
    if (paymentRequests.length > 0) {
      if (tabValue === 'all') {
        setFilteredRequests(paymentRequests);
      } else {
        setFilteredRequests(paymentRequests.filter(req => req.status === tabValue));
      }
    }
  }, [tabValue, paymentRequests]);

  // تغيير التبويب
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  // للحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // للحصول على ترجمة الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'غير معروف';
    }
  };

  // معاينة صورة إثبات الدفع
  const handlePreviewProof = (url: string | null) => {
    if (url) {
      setPreviewUrl(url);
      setPreviewDialogOpen(true);
    }
  };

  // فتح مربع حوار الموافقة
  const handleOpenApproveDialog = (request: PaymentRequest) => {
    setCurrentRequest(request);
    setApproveDialogOpen(true);
  };

  // فتح مربع حوار الرفض
  const handleOpenRejectDialog = (request: PaymentRequest) => {
    setCurrentRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  // الموافقة على طلب الدفع
  const approvePaymentRequest = async () => {
    if (!currentRequest) return;
    
    try {
      setActionLoading(true);
      
      // 1. تحديث حالة الطلب في Supabase
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', currentRequest.id);
        
      if (updateError) throw updateError;
      
      // 2. تحديث رصيد المستخدم في Firebase
      if (currentRequest.user_id) {
        const userRef = doc(db, 'users', currentRequest.user_id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentBalance = userData.balance || 0;
          const newBalance = currentBalance + currentRequest.amount;
          
          // تحديث الرصيد
          await updateDoc(userRef, { balance: newBalance });
          
          // إضافة سجل معاملة - استخدام setDoc بدلاً من updateDoc
          const transactionRef = doc(db, 'balance_transactions', `payment_request_${currentRequest.id}`);
          const transactionData = {
            userId: currentRequest.user_id,
            amount: currentRequest.amount,
            previousBalance: currentBalance,
            newBalance,
            timestamp: new Date(),
            adminName: 'Admin', // يمكن تحديث هذا بالمشرف الفعلي
            type: 'deposit',
            paymentRequestId: currentRequest.id,
            paymentMethod: currentRequest.payment_method
          };
          
          // استخدام setDoc بدلاً من updateDoc
          await setDoc(transactionRef, transactionData);
        }
      }
      
      // 3. تحديث حالة الطلبات المحلية
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === currentRequest.id 
            ? { ...req, status: 'approved', approved_at: new Date().toISOString() } 
            : req
        )
      );
      
      // 4. إغلاق مربع الحوار وعرض رسالة النجاح
      setSuccess(`تمت الموافقة على طلب الدفع بنجاح وتم إضافة ${formatCurrency(currentRequest.amount)} إلى رصيد المستخدم.`);
      setApproveDialogOpen(false);
      
      // 5. إرسال إشعار للمستخدم عبر السياق
      addNotification({
        id: `payment_approved_${currentRequest.id}`,
        message: `تمت الموافقة على طلب شحن رصيدك بمبلغ ${formatCurrency(currentRequest.amount)}`,
        time: new Date().toISOString(),
        read: false,
        type: 'success'
      });
      
    } catch (err: any) {
      console.error('Error approving payment request:', err);
      setError('حدث خطأ أثناء الموافقة على طلب الدفع: ' + err.message);
    } finally {
      setActionLoading(false);
      setCurrentRequest(null);
    }
  };
  
  // رفض طلب الدفع
  const rejectPaymentRequest = async () => {
    if (!currentRequest) return;
    
    if (!rejectionReason.trim()) {
      setError('يرجى إدخال سبب الرفض');
      return;
    }
    
    try {
      setActionLoading(true);
      
      // 1. تحديث حالة الطلب في Supabase
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', currentRequest.id);
        
      if (updateError) throw updateError;
      
      // 2. تحديث حالة الطلبات المحلية
      setPaymentRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === currentRequest.id 
            ? { ...req, status: 'rejected', rejection_reason: rejectionReason } 
            : req
        )
      );
      
      // 3. إغلاق مربع الحوار وعرض رسالة النجاح
      setSuccess('تم رفض طلب الدفع بنجاح.');
      setRejectDialogOpen(false);
      
      // 4. إرسال إشعار للمستخدم عبر السياق
      addNotification({
        id: `payment_rejected_${currentRequest.id}`,
        message: `تم رفض طلب شحن رصيدك بسبب: ${rejectionReason}`,
        time: new Date().toISOString(),
        read: false,
        type: 'error'
      });
      
    } catch (err: any) {
      console.error('Error rejecting payment request:', err);
      setError('حدث خطأ أثناء رفض طلب الدفع: ' + err.message);
    } finally {
      setActionLoading(false);
      setCurrentRequest(null);
    }
  };

  // عرض الصفحة
  return (
    <Layout title="طلبات شحن رصيد">
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        {/* العنوان وأزرار الإجراءات */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            mb: 4,
            gap: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="700"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              color: 'primary.main'
            }}
          >
            <ReceiptIcon fontSize="large" />
            طلبات شحن الرصيد
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchPaymentRequests}
            disabled={loading}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'جاري التحميل...' : 'تحديث الطلبات'}
          </Button>
        </Box>
        
        {/* رسائل الخطأ والنجاح */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        
        {/* تبويبات الفلترة */}
        <Paper 
          sx={{ 
            mb: 3, 
            borderRadius: 3, 
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
                fontSize: '0.9rem',
                textTransform: 'none',
                py: 1.8,
                '&.Mui-selected': {
                  fontWeight: 700
                }
              }
            }}
          >
            <Tab 
              value="pending" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={paymentRequests.filter(r => r.status === 'pending').length} color="warning">
                    <ScheduleIcon fontSize="small" />
                  </Badge>
                  <Typography>قيد الانتظار</Typography>
                </Box>
              } 
            />
            <Tab 
              value="approved" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                  <Typography>تمت الموافقة</Typography>
                </Box>
              }
            />
            <Tab 
              value="rejected" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon fontSize="small" color="error" />
                  <Typography>مرفوضة</Typography>
                </Box>
              }
            />
            <Tab 
              value="all" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon fontSize="small" />
                  <Typography>جميع الطلبات</Typography>
                </Box>
              }
            />
          </Tabs>
        </Paper>
        
        {/* بطاقة جدول طلبات الدفع */}
        <Card
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 6px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <Box 
            sx={{ 
              p: 2.5, 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundImage: 'linear-gradient(to right, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))'
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="600"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                '&::before': {
                  content: '""',
                  display: 'block',
                  width: '4px',
                  height: '20px',
                  backgroundColor: 'primary.main',
                  borderRadius: '4px'
                }
              }}
            >
              {tabValue === 'pending' ? 'طلبات قيد الانتظار' : 
              tabValue === 'approved' ? 'الطلبات الموافق عليها' : 
              tabValue === 'rejected' ? 'الطلبات المرفوضة' : 
              'جميع الطلبات'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Badge 
                badgeContent={filteredRequests.length} 
                color="primary"
                showZero
                sx={{ mr: 2 }}
              >
                <Chip 
                  label="إجمالي الطلبات" 
                  size="small" 
                  color="default" 
                  sx={{ fontWeight: 500 }}
                />
              </Badge>
            </Box>
          </Box>
          
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ 
                background: 'linear-gradient(to bottom, #f9f9f9, #f5f5f5)',
                borderBottom: '2px solid rgba(25, 118, 210, 0.1)'
              }}>
                <TableRow>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>المستخدم</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>المبلغ</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>طريقة الدفع</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>تاريخ الطلب</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>الحالة</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>إثبات الدفع</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                        جاري تحميل طلبات الدفع...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'text.secondary',
                        gap: 1,
                        p: 2
                      }}>
                        <ReceiptIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>
                          لا توجد طلبات دفع
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {tabValue === 'pending' 
                            ? 'لا توجد طلبات دفع قيد الانتظار حالياً' 
                            : tabValue === 'approved' 
                            ? 'لا توجد طلبات دفع موافق عليها حالياً'
                            : tabValue === 'rejected'
                            ? 'لا توجد طلبات دفع مرفوضة حالياً'
                            : 'لا توجد طلبات دفع في النظام'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request, index) => (
                    <TableRow 
                      key={request.id} 
                      hover
                      sx={{ 
                        bgcolor: index % 2 === 0 ? 'background.default' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(25, 118, 210, 0.04)',
                          boxShadow: 'inset 0 0 0 1px rgba(25, 118, 210, 0.1)',
                        }
                      }}
                    >
                      {/* المستخدم */}
                      <TableCell sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                        textAlign: 'center'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 0.5 
                        }}>
                          <Avatar 
                            src="/user.png"
                            alt={request.user_name}
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              mb: 0.5,
                              boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)',
                            }}
                          />
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            sx={{ 
                              lineHeight: 1.2,
                              color: 'text.primary',
                              textAlign: 'center'
                            }}
                          >
                            {request.user_name}
                          </Typography>
                          {request.university_id && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.7rem'
                              }}
                            >
                              <SchoolIcon sx={{ fontSize: '0.8rem' }} />
                              {request.university_id}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      {/* المبلغ */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                      }}>
                        <Typography 
                          color="success.main" 
                          fontWeight="600"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: 'success.lighter',
                            width: 'fit-content',
                            mx: 'auto',
                            fontSize: '0.875rem',
                            direction: 'ltr'
                          }}
                        >
                          <AttachMoneyIcon fontSize="small" />
                          {formatCurrency(request.amount)}
                        </Typography>
                        {request.current_balance !== null && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              textAlign: 'center',
                              mt: 0.5,
                              direction: 'ltr',
                              fontSize: '0.7rem'
                            }}
                          >
                            الرصيد الحالي: {formatCurrency(request.current_balance)}
                          </Typography>
                        )}
                      </TableCell>
                      
                      {/* طريقة الدفع */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                      }}>
                        <Chip 
                          label={request.payment_method}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<PaymentIcon fontSize="small" />}
                          sx={{ fontWeight: 500 }}
                        />
                        {request.source_phone && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              mt: 1,
                              direction: 'ltr',
                              fontSize: '0.7rem'
                            }}
                          >
                            <PhoneIcon sx={{ fontSize: '0.8rem' }} />
                            {request.source_phone}
                          </Typography>
                        )}
                      </TableCell>
                      
                      {/* تاريخ الطلب */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                        fontSize: '0.875rem'
                      }}>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          bgcolor: 'background.neutral',
                          p: 0.7,
                          px: 1.5,
                          borderRadius: 2,
                          color: 'text.secondary',
                          fontSize: '0.8rem'
                        }}>
                          {formatDate(request.created_at)}
                        </Box>
                        {request.approved_at && request.status === 'approved' && (
                          <Typography 
                            variant="caption" 
                            color="success.main"
                            sx={{ 
                              display: 'block',
                              textAlign: 'center',
                              mt: 1,
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            تمت الموافقة: {formatDate(request.approved_at)}
                          </Typography>
                        )}
                      </TableCell>
                      
                      {/* الحالة */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                      }}>
                        <Chip
                          label={getStatusText(request.status)}
                          color={getStatusColor(request.status) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {request.rejection_reason && request.status === 'rejected' && (
                          <Tooltip title={request.rejection_reason} arrow>
                            <Typography 
                              variant="caption" 
                              color="error"
                              sx={{ 
                                display: 'block',
                                textAlign: 'center',
                                mt: 1,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                                fontSize: '0.7rem'
                              }}
                            >
                              عرض سبب الرفض
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                      
                      {/* إثبات الدفع */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                      }}>
                        {request.payment_proof_url ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handlePreviewProof(request.payment_proof_url)}
                            startIcon={<VisibilityIcon fontSize="small" />}
                            sx={{ 
                              borderRadius: 6, 
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              py: 0.5
                            }}
                          >
                            معاينة
                          </Button>
                        ) : (
                          <Chip
                            label="لا يوجد"
                            size="small"
                            color="default"
                            variant="outlined"
                            icon={<VisibilityOffIcon fontSize="small" />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>
                      
                      {/* الإجراءات */}
                      <TableCell align="center" sx={{ 
                        borderBottom: '1px solid rgba(224, 224, 224, 0.5)'
                      }}>
                        {request.status === 'pending' ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="موافقة">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleOpenApproveDialog(request)}
                                sx={{ 
                                  bgcolor: 'success.lighter', 
                                  '&:hover': { 
                                    bgcolor: 'success.light',
                                    transform: 'scale(1.1)' 
                                  }
                                }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="رفض">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenRejectDialog(request)}
                                sx={{ 
                                  bgcolor: 'error.lighter', 
                                  '&:hover': { 
                                    bgcolor: 'error.light',
                                    transform: 'scale(1.1)' 
                                  }
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Chip
                            label={request.status === 'approved' ? 'تمت الموافقة' : 'تم الرفض'}
                            size="small"
                            color={request.status === 'approved' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        {/* مربع حوار معاينة إثبات الدفع */}
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              p: 0
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2,
              bgcolor: 'primary.main',
              color: 'white'
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              معاينة إثبات الدفع
            </Typography>
            <IconButton 
              onClick={() => setPreviewDialogOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box 
              sx={{ 
                width: '100%', 
                maxHeight: '70vh', 
                overflow: 'auto',
                position: 'relative'
              }}
            >
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="إثبات الدفع" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block',
                    minHeight: '300px',
                    objectFit: 'contain',
                    padding: '16px'
                  }} 
                />
              )}
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                p: 2,
                zIndex: 10
              }}>
                <Tooltip title="فتح في نافذة جديدة">
                  <IconButton 
                    component="a" 
                    href={previewUrl || '#'} 
                    target="_blank"
                    color="primary" 
                    sx={{ 
                      bgcolor: 'white', 
                      boxShadow: 2,
                      '&:hover': { transform: 'scale(1.1)' } 
                    }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
        
        {/* مربع حوار تأكيد الموافقة */}
        <Dialog
          open={approveDialogOpen}
          onClose={() => setApproveDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            color: 'success.main', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1 
          }}>
            <CheckCircleIcon />
            تأكيد الموافقة على طلب الدفع
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              هل أنت متأكد من الموافقة على طلب الدفع التالي؟ سيتم إضافة المبلغ إلى رصيد المستخدم.
            </DialogContentText>
            
            {currentRequest && (
              <Box sx={{ 
                bgcolor: 'background.neutral', 
                p: 2, 
                borderRadius: 2, 
                mb: 2,
                textAlign: 'center'
              }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      المستخدم
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {currentRequest.user_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      المبلغ
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight={700} 
                      color="success.main"
                      sx={{ direction: 'ltr' }}
                    >
                      {formatCurrency(currentRequest.amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      طريقة الدفع
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {currentRequest.payment_method}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      تاريخ الطلب
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentRequest.created_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              تأكد من استلام المبلغ فعلياً قبل الموافقة على الطلب.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setApproveDialogOpen(false)} 
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              إلغاء
            </Button>
            <Button
              onClick={approvePaymentRequest}
              variant="contained"
              color="success"
              disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(76, 175, 80, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 18px rgba(76, 175, 80, 0.35)'
                }
              }}
            >
              {actionLoading ? 'جاري الموافقة...' : 'تأكيد الموافقة'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* مربع حوار تأكيد الرفض */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 600, 
            color: 'error.main', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1 
          }}>
            <CancelIcon />
            رفض طلب الدفع
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              يرجى كتابة سبب رفض طلب الدفع. سيتم إشعار المستخدم بسبب الرفض.
            </DialogContentText>
            
            {currentRequest && (
              <Box sx={{ 
                bgcolor: 'background.neutral', 
                p: 2, 
                borderRadius: 2, 
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    المستخدم
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {currentRequest.user_name}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    المبلغ
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight={700}
                    sx={{ direction: 'ltr' }}
                  >
                    {formatCurrency(currentRequest.amount)}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    طريقة الدفع
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {currentRequest.payment_method}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <TextField
              label="سبب الرفض"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              fullWidth
              required
              variant="outlined"
              multiline
              rows={3}
              error={!rejectionReason.trim()}
              helperText={!rejectionReason.trim() ? 'سبب الرفض مطلوب' : ''}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setRejectDialogOpen(false)} 
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              إلغاء
            </Button>
            <Button
              onClick={rejectPaymentRequest}
              variant="contained"
              color="error"
              disabled={actionLoading || !rejectionReason.trim()}
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(211, 47, 47, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 18px rgba(211, 47, 47, 0.35)'
                }
              }}
            >
              {actionLoading ? 'جاري الرفض...' : 'تأكيد الرفض'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default PaymentRequests; 