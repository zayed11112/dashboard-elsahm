import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabaseOwnersApi, SupabaseOwner } from '../../services/ownersApi';
import { supabasePropertiesApi, SupabaseProperty } from '../../services/supabaseApi';
import { palette } from '../../theme/palette';

const OwnerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [owner, setOwner] = useState<SupabaseOwner | null>(null);
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch owner data and properties
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch owner details
        const ownerResponse = await supabaseOwnersApi.getById(id);
        setOwner(ownerResponse.data);

        // Fetch owner properties
        const propertiesResponse = await supabaseOwnersApi.getOwnerProperties(id);
        setProperties(propertiesResponse.data);
      } catch (err) {
        console.error('Error fetching owner data:', err);
        setError('حدث خطأ أثناء تحميل بيانات المالك. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Format price
  const formatPrice = (price: number) => {
    // تنسيق السعر بدون أصفار إضافية بالإنجليزية
    return new Intl.NumberFormat('en-US', {
      style: 'decimal', // استخدام تنسيق عشري بدلاً من تنسيق العملة
      maximumFractionDigits: 0, // بدون كسور عشرية
    }).format(price) + ' EGP'; // إضافة رمز العملة يدوياً
  };

  // Handle owner deletion
  const handleDeleteOwner = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      setError(null);

      await supabaseOwnersApi.delete(id);

      // Navigate back to owners list
      navigate('/owners', { state: { message: 'تم حذف المالك بنجاح' } });
    } catch (err) {
      console.error('Error deleting owner:', err);
      setError('حدث خطأ أثناء حذف المالك. يرجى المحاولة مرة أخرى.');
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get property type label
  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'apartment': 'شقة',
      'villa': 'فيلا',
      'house': 'منزل',
      'studio': 'استوديو',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Layout title="تفاصيل المالك">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!owner) {
    return (
      <Layout title="تفاصيل المالك">
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {error || 'لم يتم العثور على المالك المطلوب.'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/owners')}
            sx={{ mt: 2 }}
          >
            العودة للقائمة
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="تفاصيل المالك">
      <Box sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Header with back button */}
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/owners')}
              >
                العودة لقائمة المُلاك
              </Button>
            </Grid>

            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'start', md: 'end' } }}>
              <Box>
                <Tooltip title="تعديل المالك">
                  <IconButton
                    color="primary"
                    onClick={() => navigate('/owners', { state: { editOwner: owner } })}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="حذف المالك">
                  <IconButton
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Owner Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: palette.primary.main }} />
                  بيانات المالك
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: `${palette.primary.main}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <PersonIcon color="primary" />
                    </Box>
                    <Box>
                      <Typography variant="h6">{owner.name}</Typography>
                      <Typography variant="body2" color="text.secondary">المالك</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1">{owner.phone}</Typography>
                  </Box>

                  {owner.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{owner.email}</Typography>
                    </Box>
                  )}

                  {owner.address && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">{owner.address}</Typography>
                    </Box>
                  )}

                  {owner.notes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotesIcon sx={{ mr: 1, fontSize: 'small' }} />
                        ملاحظات
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        {owner.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ borderRadius: 2, mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <HomeIcon sx={{ mr: 1, color: palette.primary.main }} />
                  إحصائيات العقارات
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${palette.primary.main}10`, borderRadius: 2 }}>
                      <Typography variant="h4" color="primary.main">{properties.length}</Typography>
                      <Typography variant="body2">إجمالي العقارات</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: `${palette.success.main}10`, borderRadius: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {properties.filter(p => p.is_available).length}
                      </Typography>
                      <Typography variant="body2">العقارات المتاحة</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Owner Properties */}
          <Grid item xs={12} md={8}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <HomeIcon sx={{ mr: 1, color: palette.primary.main }} />
                  عقارات المالك
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {properties.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <HomeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      لا توجد عقارات مسجلة لهذا المالك
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<HomeIcon />}
                      onClick={() => navigate('/properties/new')}
                      sx={{ mt: 2 }}
                    >
                      إضافة عقار جديد
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: `${palette.primary.main}08` }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>اسم العقار</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>العنوان</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>السعر</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell>{property.name}</TableCell>
                            <TableCell>{property.address}</TableCell>
                            <TableCell>{getPropertyTypeLabel(property.type)}</TableCell>
                            <TableCell>{formatPrice(property.price)}</TableCell>
                            <TableCell>
                              <Chip
                                label={property.is_available ? 'متاح' : 'غير متاح'}
                                color={property.is_available ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="عرض التفاصيل">
                                <IconButton
                                  color="info"
                                  onClick={() => navigate(`/properties/${property.id}`)}
                                  size="small"
                                  sx={{ mr: 1 }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="تعديل العقار">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/properties/${property.id}`)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/properties/new')}
                  >
                    إضافة عقار جديد
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        >
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من رغبتك في حذف هذا المالك؟
              {properties.length > 0 ?
                ` سيتم إزالة ارتباط ${properties.length} عقار مرتبط بهذا المالك.` :
                ' لا يوجد عقارات مرتبطة بهذا المالك.'}
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
              onClick={handleDeleteOwner}
              color="error"
              disabled={isDeleting}
              variant="contained"
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default OwnerDetails;
