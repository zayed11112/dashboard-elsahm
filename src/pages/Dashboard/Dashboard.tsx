import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  BookOnline as BookOnlineIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Payments as PaymentsIcon,
  RecentActors as RecentActorsIcon,
  School as SchoolIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import {
  PropertySearchIcon,
  UsersGroupIcon,
  BookingConfirmIcon,
  CommissionIcon
} from '../../components/icons/CustomIcons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Layout from '../../components/Layout';
import { dashboardApi } from '../../services/api';
import { supabasePropertiesApi } from '../../services/supabaseApi';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
  ChartCard,
  ListCard,
} from '../../components/responsive';
import { palette } from '../../theme/palette';

// Importar Pie chart con carga diferida
const LazyPieChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define types
interface DashboardStats {
  propertiesCount: number;
  usersCount: number;
  reservationsCount: number;
  pendingReservationsCount: number;
  revenue: number;
  totalCommission?: number; // Suma total de comisiones
}

interface RecentReservation {
  id: string;
  propertyName: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  totalPrice: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface TopProperty {
  id: string;
  name: string;
  reservationsCount: number;
}



// تم استبدال مكون StatCard بالمكون المتجاوب من المكتبة

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // دالة لجلب بيانات لوحة التحكم
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.time('dashboard-data-fetch'); // بدء قياس الوقت

      // جلب جميع البيانات في وقت واحد
      const [
        statsRes,
        reservationsRes,
        propertiesWithCommissionRes,
        recentPropertiesRes
      ] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentReservations(),
        supabasePropertiesApi.getAll(), // الحصول على العقارات لحساب العمولات
        supabasePropertiesApi.getAll({ limit: 3 }) // الحصول على أحدث 3 عقارات
      ]);

      // حساب إجمالي العمولات
      const totalCommission = propertiesWithCommissionRes.data.reduce(
        (sum, property) => sum + (property.commission || 0),
        0
      );

      // تحديث الإحصائيات مع إجمالي العمولات
      const updatedStats: DashboardStats = {
        ...statsRes.data,
        totalCommission
      };

      // تعيين البيانات في الحالة
      setStats(updatedStats);
      setRecentReservations(reservationsRes.data);
      setRecentProperties(recentPropertiesRes.data.slice(0, 3)); // أحدث 3 عقارات

      // تحديث حالة التحميل
      setLoading(false);

      console.timeEnd('dashboard-data-fetch'); // إنهاء قياس الوقت
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
      setLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepare chart data with improved visuals

  const pieChartData = {
    labels: ['قيد الانتظار', 'تمت الموافقة', 'مرفوضة'],
    datasets: [
      {
        data: [
          stats?.pendingReservationsCount || 0,
          (stats?.reservationsCount || 0) - (stats?.pendingReservationsCount || 0) - 5, // Approved count
          5, // Rejected count
        ],
        backgroundColor: [
          'rgba(255, 152, 0, 0.8)',  // Amber for pending
          'rgba(76, 175, 80, 0.8)',  // Green for approved
          'rgba(244, 67, 54, 0.8)',  // Red for rejected
        ],
        borderColor: [
          'rgba(255, 152, 0, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };



  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'rejected':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة';
      case 'pending':
        return 'قيد الانتظار';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    // تنسيق السعر بدون أصفار إضافية
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal', // استخدام تنسيق عشري بدلاً من تنسيق العملة
      maximumFractionDigits: 0, // بدون كسور عشرية
    }).format(price) + ' ج.م'; // إضافة رمز العملة يدوياً
  };

  if (loading) {
    return (
      <Layout title="لوحة التحكم">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة التحكم">
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            إعادة المحاولة
          </Button>
        </Box>
      </Layout>
    );
  }



  return (
    <Layout title="لوحة التحكم">
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        {/* Header Section with Gradient Background */}
        <Paper
          elevation={3}
          sx={{
            p: isMobile ? 3 : 4,
            mb: 4,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${palette.primary.main}15, ${palette.primary.light}05)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${palette.primary.light}30`,
          }}
        >
          <ResponsiveContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  لوحة التحكم
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  مرحباً بك في لوحة تحكم السهم للتسكين
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: palette.gradients.primary,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <DashboardIcon sx={{ fontSize: 32, color: '#fff' }} />
              </Box>
            </Box>
          </ResponsiveContainer>
        </Paper>

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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Stats Cards */}
            <ResponsiveContainer>
              <ResponsiveGrid container spacing={3} sx={{ mb: 4 }}>
                <ResponsiveGrid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="العقارات"
                    value={stats?.propertiesCount ?? 0}
                    icon={<PropertySearchIcon sx={{ fontSize: 40 }} />}
                    color={palette.primary.main}
                    trend={5}
                    trendLabel="منذ الشهر الماضي"
                    onClick={() => navigate('/properties')}
                    gradient={palette.gradients.primary}
                  />
                </ResponsiveGrid>
                <ResponsiveGrid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="المستخدمين"
                    value={stats?.usersCount ?? 0}
                    icon={<UsersGroupIcon sx={{ fontSize: 40 }} />}
                    color={palette.success.main}
                    trend={12}
                    trendLabel="منذ الشهر الماضي"
                    onClick={() => navigate('/users')}
                    gradient={palette.gradients.success}
                  />
                </ResponsiveGrid>
                <ResponsiveGrid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="الحجوزات"
                    value={stats?.reservationsCount ?? 0}
                    icon={<BookingConfirmIcon sx={{ fontSize: 40 }} />}
                    color={palette.warning.main}
                    trend={-3}
                    trendLabel="منذ الشهر الماضي"
                    onClick={() => navigate('/reservations')}
                    gradient={palette.gradients.warning}
                  />
                </ResponsiveGrid>
                <ResponsiveGrid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="العمولات"
                    value={formatPrice(stats?.totalCommission ?? 0)}
                    icon={<CommissionIcon sx={{ fontSize: 40 }} />}
                    color={palette.secondary.main}
                    trend={8}
                    trendLabel="منذ الشهر الماضي"
                    subtitle="إجمالي العمولات"
                    gradient={palette.gradients.secondary}
                  />
                </ResponsiveGrid>
              </ResponsiveGrid>
            </ResponsiveContainer>

            {/* Charts and Tables */}
            <ResponsiveContainer>
              <ResponsiveGrid container spacing={3}>


                {/* Reservation Status Chart */}
                <ResponsiveGrid item xs={12} md={12}>
                  <ChartCard
                    title="حالة الحجوزات"
                    subtitle="توزيع الحجوزات حسب الحالة"
                    onViewAll={() => navigate('/reservations')}
                    onRefresh={() => fetchDashboardData()}
                    noData={!stats}
                    height={320}
                    gradient={palette.gradients.purple}
                    icon={<PieChartIcon />}
                  >
                    <Box sx={{ p: 2, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Suspense fallback={<Box sx={{ textAlign: 'center', p: 3 }}>جاري تحميل الرسم البياني...</Box>}>
                        <LazyPieChart
                          data={pieChartData}
                          options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                font: {
                                  size: 12,
                                  family: 'Cairo, sans-serif'
                                },
                                color: theme.palette.text.primary,
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              titleColor: theme.palette.text.primary,
                              bodyColor: theme.palette.text.secondary,
                              borderColor: theme.palette.divider,
                              borderWidth: 1,
                              padding: 12,
                              boxWidth: 10,
                              boxHeight: 10,
                              usePointStyle: true,
                              titleFont: {
                                size: 14,
                                family: 'Cairo, sans-serif'
                              },
                              bodyFont: {
                                size: 12,
                                family: 'Cairo, sans-serif'
                              }
                            }
                          }
                        }}
                        />
                      </Suspense>
                    </Box>
                  </ChartCard>
                </ResponsiveGrid>

                {/* Recent Reservations */}
                <ResponsiveGrid item xs={12} md={6}>
                  <ListCard
                    title="أحدث الحجوزات"
                    subtitle="آخر الحجوزات المضافة للنظام"
                    onViewAll={() => navigate('/reservations')}
                    onRefresh={() => fetchDashboardData()}
                    loading={loading}
                    noDataMessage="لا توجد حجوزات حديثة"
                    icon={<BookingConfirmIcon />}
                    gradient={palette.gradients.warning}
                    items={recentReservations.map(reservation => ({
                      id: reservation.id,
                      primary: reservation.propertyName,
                      secondary: (
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {reservation.userName}
                          </Typography>
                          {' — '}
                          <Typography
                            component="span"
                            variant="body2"
                            color={getStatusColor(reservation.status)}
                            sx={{ fontWeight: 600 }}
                          >
                            {getStatusText(reservation.status)}
                          </Typography>
                          {' — '}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {formatPrice(reservation.totalPrice)}
                          </Typography>
                        </React.Fragment>
                      ),
                      avatar: reservation.propertyName.charAt(0),
                      color: getStatusColor(reservation.status),
                      action: (
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/reservations/${reservation.id}`)}
                          sx={{
                            color: palette.primary.main,
                            '&:hover': {
                              backgroundColor: `${palette.primary.main}15`,
                            }
                          }}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      ),
                      onClick: () => navigate(`/reservations/${reservation.id}`),
                    }))}
                  />
                </ResponsiveGrid>

                {/* Recent Properties */}
                <ResponsiveGrid item xs={12} md={6}>
                  <ListCard
                    title="أحدث الشقق"
                    subtitle="آخر الشقق المضافة للنظام"
                    onViewAll={() => navigate('/properties')}
                    onRefresh={() => fetchDashboardData()}
                    loading={loading}
                    noDataMessage="لا توجد شقق حديثة"
                    icon={<PropertySearchIcon />}
                    gradient={palette.gradients.primary}
                    items={recentProperties.map(property => ({
                      id: property.id,
                      primary: property.name,
                      secondary: (
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {property.address}
                          </Typography>
                          {' — '}
                          <Typography
                            component="span"
                            variant="body2"
                            color={property.is_available ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 600 }}
                          >
                            {property.is_available ? 'متاح' : 'غير متاح'}
                          </Typography>
                          {' — '}
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {formatPrice(property.price)}
                          </Typography>
                        </React.Fragment>
                      ),
                      avatar: property.name.charAt(0),
                      color: palette.primary.main,
                      action: (
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/properties/${property.id}`)}
                          sx={{
                            color: palette.primary.main,
                            '&:hover': {
                              backgroundColor: `${palette.primary.main}15`,
                            }
                          }}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      ),
                      onClick: () => navigate(`/properties/${property.id}`),
                    }))}
                  />
                </ResponsiveGrid>
              </ResponsiveGrid>
            </ResponsiveContainer>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Dashboard;