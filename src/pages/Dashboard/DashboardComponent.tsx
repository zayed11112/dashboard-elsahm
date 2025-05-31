import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  PersonAdd as PersonAddIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  ChatBubbleOutline,
  FiberNew,
  HourglassEmpty,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
  ViewCarousel as ViewCarouselIcon,
} from '@mui/icons-material';
import {
  PropertySearchIcon,
  UsersGroupIcon,
  BookingConfirmIcon,
  CommissionIcon
} from '../../components/icons/CustomIcons';
import Layout from '../../components/Layout';
import { dashboardApi, checkoutRequestsApi } from '../../services/api';
import { supabasePropertiesApi } from '../../services/supabaseApi';
import { categoriesApi } from '../../services/categoriesApi';
import { fetchAllComplaints } from '../../services/complaintsApi';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
  QuickActionCard,
} from '../../components/responsive';
import { palette } from '../../theme/palette';
import { supabase } from '../../supabase/client';

// Define types
interface DashboardStats {
  propertiesCount: number;
  usersCount: number;
  reservationsCount: number;
  pendingReservationsCount: number;
  revenue: number;
  totalCommission?: number;
  checkoutRequestsCount?: number;
  pendingCheckoutRequestsCount?: number;
  confirmedCheckoutRequestsCount?: number;
  checkoutCommissionTotal?: number;
  categoriesCount?: number;
  // Stats for payment-related items
  paymentRequestsCount?: number;
  pendingPaymentRequestsCount?: number;
  completedPaymentRequestsCount?: number;
  totalPaymentAmount?: number;
  // Stats for complaints
  complaintsCount?: number;
  openComplaintsCount?: number;
  inProgressComplaintsCount?: number;
  closedComplaintsCount?: number;
}

// Create a cache object for dashboard data
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
let dashboardDataCache = {
  data: null as DashboardStats | null,
  timestamp: 0,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAccessAnchor, setQuickAccessAnchor] = useState<null | HTMLElement>(null);

  // دالة لجلب بيانات لوحة التحكم
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (!forceRefresh &&
          dashboardDataCache.data &&
          (now - dashboardDataCache.timestamp) < CACHE_EXPIRY_TIME) {
        console.log('Using cached dashboard data');
        setStats(dashboardDataCache.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Use a unique timer name with timestamp
      const timerId = `dashboard-data-fetch-${Date.now()}`;
      console.time(timerId);

      // جلب البيانات الأساسية بشكل متوازي
      const [
        statsRes,
        propertiesWithCommissionRes,
        categoriesRes,
        checkoutRequestsResponse,
        complaintsData,
      ] = await Promise.all([
        dashboardApi.getStats(),
        supabasePropertiesApi.getAll(),
        categoriesApi.getAll(),
        checkoutRequestsApi.getAll(),
        fetchAllComplaints(),
      ]);

      // جلب طلبات الدفع من Supabase
      const { data: paymentRequestsData, error: paymentRequestsError } = await supabase
        .from('payment_requests')
        .select('*');

      if (paymentRequestsError) {
        console.error('Error fetching payment requests:', paymentRequestsError);
      }

      // حساب إجمالي العمولات
      const totalCommission = propertiesWithCommissionRes.data.reduce(
        (sum, property) => sum + (property.commission || 0),
        0
      );

      // عدد الأقسام
      const categoriesCount = categoriesRes.data.length;

      // معالجة بيانات طلبات الحجز
      const checkoutRequests = checkoutRequestsResponse.data;
      const pendingCheckoutRequestsCount = checkoutRequests.filter(r => r.status === 'جاري المعالجة').length;
      const confirmedCheckoutRequestsCount = checkoutRequests.filter(r => r.status === 'مؤكد').length;
      const checkoutCommissionTotal = checkoutRequests
        .filter(r => r.status === 'مؤكد')
        .reduce((sum, r) => sum + (r.commission || 0), 0);

      // معالجة بيانات طلبات الدفع
      const paymentRequests = paymentRequestsData || [];
      const paymentRequestsCount = paymentRequests.length;
      const pendingPaymentRequestsCount = paymentRequests.filter(r => r.status === 'pending').length;
      const completedPaymentRequestsCount = paymentRequests.filter(r => r.status === 'approved').length;
      const totalPaymentAmount = paymentRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      // معالجة بيانات الشكاوى
      const complaintsCount = complaintsData.length;
      const openComplaintsCount = complaintsData.filter(c => c.status === 'open').length;
      const inProgressComplaintsCount = complaintsData.filter(c => c.status === 'in-progress').length;
      const closedComplaintsCount = complaintsData.filter(c => c.status === 'closed').length;

      console.log('Complaints data:', {
        complaintsCount,
        openComplaintsCount,
        inProgressComplaintsCount,
        closedComplaintsCount
      });

      // تحديث الإحصائيات
      const updatedStats: DashboardStats = {
        ...statsRes.data,
        totalCommission,
        categoriesCount,
        propertiesCount: propertiesWithCommissionRes.data.length,
        checkoutRequestsCount: checkoutRequests.length,
        pendingCheckoutRequestsCount,
        confirmedCheckoutRequestsCount,
        checkoutCommissionTotal,
        // Add payment requests stats
        paymentRequestsCount,
        pendingPaymentRequestsCount,
        completedPaymentRequestsCount,
        totalPaymentAmount,
        // Add complaints stats
        complaintsCount,
        openComplaintsCount,
        inProgressComplaintsCount,
        closedComplaintsCount
      };

      // تخزين البيانات في الذاكرة المؤقتة
      dashboardDataCache = {
        data: updatedStats,
        timestamp: now
      };

      // تعيين البيانات
      setStats(updatedStats);
      setLoading(false);

      console.timeEnd(timerId);
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  }, []);

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchDashboardData();

    // إعداد تحديث تلقائي للبيانات
    const refreshInterval = setInterval(() => {
      fetchDashboardData(true);
    }, CACHE_EXPIRY_TIME);

    return () => clearInterval(refreshInterval);
  }, [fetchDashboardData]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price) + ' EGP';
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <Layout title="لوحة التحكم">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة التحكم">
        <Box sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh'
        }}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              width: '100%',
              maxWidth: 600,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Typography variant="body1">{error}</Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={handleRefresh}
            sx={{
              mt: 2,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            إعادة المحاولة
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="لوحة التحكم">
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative' }}>
        {/* Header with refresh button - تعديل لجعل العنوان في المنتصف */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            textAlign: 'center' // إضافة محاذاة نصية للمنتصف
          }}
        >
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // توسيط العناصر أفقياً
            width: '100%'
          }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                marginBottom: 1,
                textAlign: 'center' // تأكيد على المحاذاة النصية للمنتصف
              }}
            >
              مرحباً بك في لوحة التحكم
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
              اطلع على أحدث الإحصائيات وأدر نظامك بسهولة وفعالية
            </Typography>
          </Box>

          <Box sx={{ mt: { xs: 2, sm: 0 } }}>
            <Tooltip title="تحديث البيانات">
              <IconButton
                onClick={handleRefresh}
                color="primary"
                sx={{
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* زر الوصول السريع */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              zIndex: 10
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={(e) => setQuickAccessAnchor(e.currentTarget)}
              startIcon={<DashboardIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 3,
                boxShadow: '0 8px 20px rgba(33, 150, 243, 0.2)',
                fontWeight: 'bold',
                backgroundImage: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                '&:hover': {
                  backgroundImage: 'linear-gradient(45deg, #1976D2, #21CBF3)',
                  boxShadow: '0 10px 25px rgba(33, 150, 243, 0.3)',
                }
              }}
            >
              الوصول السريع للصفحات
            </Button>
            <Menu
              anchorEl={quickAccessAnchor}
              open={Boolean(quickAccessAnchor)}
              onClose={() => setQuickAccessAnchor(null)}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 3,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  mt: 1.5,
                  width: { xs: 300, sm: 350 },
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: 12,
                    height: 12,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg) translateX(-50%)',
                    zIndex: 0,
                  }
                }
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  الوصول السريع
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  اختر الصفحة التي تريد الانتقال إليها
                </Typography>
              </Box>
              <Divider />
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/dashboard')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><DashboardIcon sx={{ color: palette.primary.main }} /></ListItemIcon>
                  <ListItemText primary="لوحة التحكم الرئيسية" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/properties')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><HomeIcon sx={{ color: palette.primary.main }} /></ListItemIcon>
                  <ListItemText primary="العقارات" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/users')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><PersonIcon sx={{ color: palette.success.main }} /></ListItemIcon>
                  <ListItemText primary="المستخدمين" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/owners')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><PeopleIcon sx={{ color: palette.info.main }} /></ListItemIcon>
                  <ListItemText primary="المُلاك" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/categories')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><CategoryIcon sx={{ color: palette.warning.main }} /></ListItemIcon>
                  <ListItemText primary="الأقسام" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/places')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><LocationOnIcon sx={{ color: '#FF5722' }} /></ListItemIcon>
                  <ListItemText primary="الأماكن" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/checkout-requests')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><ReceiptIcon sx={{ color: '#FF9800' }} /></ListItemIcon>
                  <ListItemText primary="طلبات الحجز" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/payment-methods')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><CreditCardIcon sx={{ color: '#6A1B9A' }} /></ListItemIcon>
                  <ListItemText primary="طرق الدفع" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/payment-requests')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><WalletIcon sx={{ color: '#8E24AA' }} /></ListItemIcon>
                  <ListItemText primary="طلبات شحن رصيد" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/add-balance')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><AttachMoneyIcon sx={{ color: '#AB47BC' }} /></ListItemIcon>
                  <ListItemText primary="إضافة رصيد" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/complaints')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><ChatBubbleOutline sx={{ color: '#0288D1' }} /></ListItemIcon>
                  <ListItemText primary="الشكاوى" />
                </MenuItem>
                
                <MenuItem 
                  onClick={() => {setQuickAccessAnchor(null); navigate('/banners')}}
                  sx={{ borderRadius: 2, mb: 0.5, p: 1.5 }}
                >
                  <ListItemIcon><ViewCarouselIcon sx={{ color: '#D32F2F' }} /></ListItemIcon>
                  <ListItemText primary="البانرات" />
                </MenuItem>
              </Box>
            </Menu>
          </Box>
        </Box>

        {/* Overview Cards */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(25,118,210,0.15)',
                  background: 'linear-gradient(135deg, rgba(227,242,253,0.7) 0%, rgba(187,222,251,0.55) 100%)',
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(25,118,210,0.3)',
                    transform: 'translateY(-5px)'
                  }
                }}
                onClick={() => navigate('/properties')}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: palette.primary.main }}
                    >
                      {stats?.propertiesCount || 0}
                    </Typography>
                    <IconButton
                      sx={{
                        bgcolor: palette.primary.main,
                        width: 40,
                        height: 40,
                        color: 'white'
                      }}
                    >
                      <HomeIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>العقارات</Typography>
                  <Typography variant="caption" color="text.secondary">
                    إجمالي العقارات المسجلة في النظام
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(76,175,80,0.15)',
                  background: 'linear-gradient(135deg, rgba(232,245,233,0.7) 0%, rgba(200,230,201,0.55) 100%)',
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(76,175,80,0.3)',
                    transform: 'translateY(-5px)'
                  }
                }}
                onClick={() => navigate('/users')}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: palette.success.main }}
                    >
                      {stats?.usersCount || 0}
                    </Typography>
                    <IconButton
                      sx={{
                        bgcolor: palette.success.main,
                        width: 40,
                        height: 40,
                        color: 'white'
                      }}
                    >
                      <PersonIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>المستخدمين</Typography>
                  <Typography variant="caption" color="text.secondary">
                    إجمالي المستخدمين المسجلين
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(255,152,0,0.15)',
                  background: 'linear-gradient(135deg, rgba(255,243,224,0.7) 0%, rgba(255,224,178,0.55) 100%)',
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(255,152,0,0.3)',
                    transform: 'translateY(-5px)'
                  }
                }}
                onClick={() => navigate('/checkout-requests')}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: palette.warning.main }}
                    >
                      {stats?.checkoutRequestsCount || 0}
                    </Typography>
                    <IconButton
                      sx={{
                        bgcolor: palette.warning.main,
                        width: 40,
                        height: 40,
                        color: 'white'
                      }}
                    >
                      <ReceiptIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>طلبات الحجز</Typography>
                  <Typography variant="caption" color="text.secondary">
                    إجمالي طلبات الحجز
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(3,169,244,0.15)',
                  background: 'linear-gradient(135deg, rgba(225,245,254,0.7) 0%, rgba(179,229,252,0.55) 100%)',
                  backdropFilter: 'blur(8px)',
                  height: '100%',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: palette.info.main, direction: 'ltr' }}
                    >
                      {formatPrice(stats?.totalCommission || 0)}
                    </Typography>
                    <IconButton
                      sx={{
                        bgcolor: palette.info.main,
                        width: 40,
                        height: 40,
                        color: 'white'
                      }}
                    >
                      <AttachMoneyIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>إجمالي العمولات</Typography>
                  <Typography variant="caption" color="text.secondary">
                    العمولات من كافة المصادر
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* قسم إدارة المدفوعات - الجديد */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4,
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  bgcolor: 'primary.main',
                  borderRadius: '14px',
                  boxShadow: '0 5px 15px rgba(33, 150, 243, 0.2)',
                  mr: 2
                }}
              >
                <PaymentIcon
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 24, sm: 28 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    textAlign: 'center'
                  }}
                >
                  إدارة المدفوعات
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, textAlign: 'center' }}
                >
                  إدارة طرق الدفع وطلبات شحن الرصيد والعمليات المالية
                </Typography>
              </Box>
            </Box>

            <Chip
              label={`${stats?.pendingPaymentRequestsCount || 0} طلب جديد`}
              color="secondary"
              variant="outlined"
              sx={{
                borderRadius: '10px',
                py: 0.5,
                px: 1,
                fontWeight: 600,
                bgcolor: 'rgba(156, 39, 176, 0.05)'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="طرق الدفع"
                description=""
                icon={<CreditCardIcon />}
                onClick={() => navigate('/payment-methods')}
                color="#6A1B9A"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="طلبات شحن رصيد"
                description={`${stats?.pendingPaymentRequestsCount || 0} قيد الانتظار`}
                icon={<WalletIcon />}
                onClick={() => navigate('/payment-requests')}
                color="#8E24AA"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="إضافة رصيد"
                description=""
                icon={<AttachMoneyIcon />}
                onClick={() => navigate('/add-balance')}
                color="#AB47BC"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* قسم إدارة طلبات الحجز */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  backgroundImage: 'linear-gradient(45deg, #FF9800, #FFA726)',
                  borderRadius: '14px',
                  boxShadow: '0 5px 15px rgba(255, 152, 0, 0.2)',
                  mr: 2
                }}
              >
                <ReceiptIcon
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 24, sm: 28 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  إدارة طلبات الحجز
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              متابعة وإدارة طلبات الحجز والحجوزات المؤكدة
            </Typography>
            <Chip
              label={`${stats?.pendingCheckoutRequestsCount || 0} طلب جاري المعالجة`}
              color="warning"
              variant="outlined"
              sx={{
                borderRadius: '10px',
                py: 0.5,
                px: 1,
                fontWeight: 600,
                bgcolor: 'rgba(255, 152, 0, 0.05)'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="جميع طلبات الحجز"
                description={`${stats?.checkoutRequestsCount || 0} طلب`}
                icon={<ReceiptIcon />}
                onClick={() => navigate('/checkout-requests')}
                color="#FF9800"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="طلبات جاري المعالجة"
                description={`${stats?.pendingCheckoutRequestsCount || 0} طلب`}
                icon={<HourglassEmpty />}
                onClick={() => navigate('/checkout-requests')}
                color="#FFA726"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="طلبات مؤكدة"
                description={`${stats?.confirmedCheckoutRequestsCount || 0} طلب`}
                icon={<BookingConfirmIcon />}
                onClick={() => navigate('/checkout-requests')}
                color="#F57C00"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* قسم إدارة الشكاوي */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  backgroundImage: 'linear-gradient(45deg, #0288D1, #03A9F4)',
                  borderRadius: '14px',
                  boxShadow: '0 5px 15px rgba(2, 136, 209, 0.2)',
                  mr: 2
                }}
              >
                <ChatBubbleOutline
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 24, sm: 28 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  إدارة الشكاوي
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              متابعة ومعالجة شكاوي العملاء والمستخدمين
            </Typography>
            <Chip
              label={`${stats?.openComplaintsCount || 0} شكوى مفتوحة`}
              color="info"
              variant="outlined"
              sx={{
                borderRadius: '10px',
                py: 0.5,
                px: 1,
                fontWeight: 600,
                bgcolor: 'rgba(2, 136, 209, 0.05)'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="جميع الشكاوي"
                description={`${stats?.complaintsCount || 0} شكوى`}
                icon={<ChatBubbleOutline />}
                onClick={() => navigate('/complaints')}
                color="#0288D1"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="شكاوي مفتوحة"
                description={`${stats?.openComplaintsCount || 0} قيد الانتظار`}
                icon={<FiberNew />}
                onClick={() => navigate('/complaints')}
                color="#03A9F4"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="قيد المعالجة"
                description={`${stats?.inProgressComplaintsCount || 0} شكوى`}
                icon={<HourglassEmpty />}
                onClick={() => navigate('/complaints')}
                color="#FF9800"
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Layout>
  );
};

export default Dashboard;