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

      // Mock data for payment requests
      const paymentRequestsCount = 15;
      const pendingPaymentRequestsCount = 8;
      const completedPaymentRequestsCount = 7;
      const totalPaymentAmount = 45000;

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
        {/* Header with refresh button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                marginBottom: 1
              }}
            >
              مرحباً بك في لوحة التحكم
            </Typography>
            <Typography variant="body1" color="text.secondary">
              اطلع على أحدث الإحصائيات وأدر نظامك بسهولة وفعالية
            </Typography>
          </Box>

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

        {/* Overview Cards */}
        <Box sx={{ mb: 5 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(25,118,210,0.08)',
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                  height: '100%'
                }}
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
                  boxShadow: '0 5px 20px rgba(25,118,210,0.08)',
                  background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                  height: '100%'
                }}
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
                  boxShadow: '0 5px 20px rgba(25,118,210,0.08)',
                  background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                  height: '100%'
                }}
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
                  boxShadow: '0 5px 20px rgba(25,118,210,0.08)',
                  background: 'linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)',
                  height: '100%'
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

            {/* إضافة بطاقة الشكاوى */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => navigate('/complaints')}
                elevation={2}
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(244,67,54,0.15)',
                  background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: '0 8px 25px rgba(244,67,54,0.25)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 700, color: '#D32F2F' }}
                    >
                      {stats?.complaintsCount || 0}
                    </Typography>
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        sx={{
                          bgcolor: '#D32F2F',
                          width: 40,
                          height: 40,
                          color: 'white',
                        }}
                      >
                        <ChatBubbleOutline />
                      </IconButton>
                      {(stats?.openComplaintsCount || 0) > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            bgcolor: '#D32F2F',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: '2px solid white',
                          }}
                        >
                          {stats?.openComplaintsCount}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>الشكاوى</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(stats?.openComplaintsCount || 0) > 0 ? `${stats?.openComplaintsCount} شكوى مفتوحة` : 'لا توجد شكاوى مفتوحة'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* الإضافات السريعة */}
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
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  backgroundImage: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                  mr: 2
                }}
              >
                <AddIcon
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 20, sm: 24 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  الإضافات السريعة
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.3, fontSize: '0.85rem' }}
                >
                  أضف عناصر جديدة وقم بإدارة النظام بشكل فعّال
                </Typography>
              </Box>
            </Box>

            <Chip
              label="إدارة سريعة"
              color="primary"
              variant="outlined"
              sx={{
                borderRadius: '10px',
                py: 0.5,
                px: 1,
                fontWeight: 600,
                bgcolor: 'rgba(33, 150, 243, 0.05)'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="إضافة عقار جديد"
                description=""
                icon={<HomeIcon />}
                onClick={() => navigate('/properties/new')}
                color={palette.primary.main}
                gradient="linear-gradient(to bottom right, rgba(33, 150, 243, 0.05), rgba(33, 150, 243, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="إضافة مالك جديد"
                description=""
                icon={<PersonIcon />}
                onClick={() => navigate('/owners')}
                color={palette.success.main}
                gradient="linear-gradient(to bottom right, rgba(76, 175, 80, 0.05), rgba(76, 175, 80, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="إضافة قسم جديد"
                description=""
                icon={<CategoryIcon />}
                onClick={() => navigate('/categories')}
                color={palette.warning.main}
                gradient="linear-gradient(to bottom right, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="إضافة مستخدم جديد"
                description=""
                icon={<PersonAddIcon />}
                onClick={() => navigate('/users/new')}
                color={palette.secondary.main}
                gradient="linear-gradient(to bottom right, rgba(156, 39, 176, 0.05), rgba(156, 39, 176, 0.1))"
              />
            </Grid>
          </Grid>
        </Paper>

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
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  backgroundImage: 'linear-gradient(45deg, #7B1FA2, #9C27B0)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
                  mr: 2
                }}
              >
                <PaymentIcon
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 20, sm: 24 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  إدارة المدفوعات
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.3, fontSize: '0.85rem' }}
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
                gradient="linear-gradient(to bottom right, rgba(106, 27, 154, 0.05), rgba(106, 27, 154, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="طلبات شحن رصيد"
                description={`${stats?.pendingPaymentRequestsCount || 0} قيد الانتظار`}
                icon={<WalletIcon />}
                onClick={() => navigate('/payment-requests')}
                color="#8E24AA"
                gradient="linear-gradient(to bottom right, rgba(142, 36, 170, 0.05), rgba(142, 36, 170, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="إضافة رصيد"
                description=""
                icon={<AttachMoneyIcon />}
                onClick={() => navigate('/add-balance')}
                color="#AB47BC"
                gradient="linear-gradient(to bottom right, rgba(171, 71, 188, 0.05), rgba(171, 71, 188, 0.1))"
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  backgroundImage: 'linear-gradient(45deg, #0288D1, #03A9F4)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(2, 136, 209, 0.15)',
                  mr: 2
                }}
              >
                <ChatBubbleOutline
                  sx={{
                    color: '#fff',
                    fontSize: { xs: 20, sm: 24 }
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    position: 'relative',
                    display: 'inline-block',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                  }}
                >
                  إدارة الشكاوي
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, fontSize: '0.85rem' }}
            >
              متابعة ومعالجة شكاوي العملاء والمستخدمين
            </Typography>
            <Chip
              label={`${stats?.openComplaintsCount || 0} شكوى مفتوحة`}
              color="info"
              variant="outlined"
              sx={{
                borderRadius: '8px',
                py: 0.3,
                px: 0.8,
                fontWeight: 500,
                fontSize: '0.8rem',
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
                gradient="linear-gradient(to bottom right, rgba(2, 136, 209, 0.05), rgba(2, 136, 209, 0.1))"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="شكاوي مفتوحة"
                description={`${stats?.openComplaintsCount || 0} قيد الانتظار`}
                icon={<FiberNew />}
                onClick={() => navigate('/complaints')}
                color="#03A9F4"
                gradient="linear-gradient(to bottom right, rgba(3, 169, 244, 0.05), rgba(3, 169, 244, 0.1))"
                badge={stats?.openComplaintsCount}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="قيد المعالجة"
                description={`${stats?.inProgressComplaintsCount || 0} شكوى`}
                icon={<HourglassEmpty />}
                onClick={() => navigate('/complaints')}
                color="#FF9800"
                gradient="linear-gradient(to bottom right, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.1))"
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Layout>
  );
};

export default Dashboard;