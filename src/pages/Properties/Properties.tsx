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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  useTheme,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  VisibilityOutlined as ViewIcon,
  HomeWork as HomeWorkIcon,
  Apartment as ApartmentIcon,
  House as HouseIcon,
  Weekend as WeekendIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Hotel as HotelIcon,
  Bed as BedIcon,
  Stairs as StairsIcon,
  ContentCopy as ContentCopyIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabasePropertiesApi, SupabaseProperty } from '../../services/supabaseApi';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

// Define Property type
interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  price: number;
  commission: number;
  bedrooms: number;
  beds: number;
  floor: string;
  // تم إزالة حقل المساحة (area) كما هو مطلوب
  is_available: boolean;
  features: string[];
  images: string[];
  videos: string[];
  drive_images: string[];
  created_at: string;
  updated_at: string;
  description: string;
}

// Property type options
const propertyTypes = [
  { value: 'apartment', label: 'شقة' },
  { value: 'villa', label: 'فيلا' },
  { value: 'house', label: 'منزل' },
  { value: 'studio', label: 'استوديو' },
];

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate property state
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [propertyToDuplicate, setPropertyToDuplicate] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  };

  // Get property thumbnail
  const getPropertyThumbnail = (property: Property) => {
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    if (property.drive_images && property.drive_images.length > 0) {
      return property.drive_images[0];
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Fetch properties on mount and when filters change
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        // Create filter parameters
        const params: Record<string, any> = {};
        if (searchQuery) params.search = searchQuery;
        if (typeFilter) params.type = typeFilter;
        if (availabilityFilter) params.isAvailable = availabilityFilter === 'available';

        const response = await supabasePropertiesApi.getAll(params);
        setProperties(response.data);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('حدث خطأ أثناء تحميل العقارات. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchQuery, typeFilter, availabilityFilter]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle property deletion
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      await supabasePropertiesApi.delete(propertyToDelete);

      // Update the properties list
      setProperties(properties.filter(property => property.id !== propertyToDelete));

      // Close dialog
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('حدث خطأ أثناء حذف العقار. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Refresh properties data
  const refreshProperties = () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (typeFilter) params.type = typeFilter;
    if (availabilityFilter) params.isAvailable = availabilityFilter === 'available';

    supabasePropertiesApi.getAll(params)
      .then(response => {
        setProperties(response.data);
      })
      .catch(err => {
        console.error('Error refreshing properties:', err);
        setError('حدث خطأ أثناء تحديث بيانات العقارات. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Open duplicate dialog
  const openDuplicateDialog = (id: string) => {
    setPropertyToDuplicate(id);
    setDuplicateDialogOpen(true);
  };

  // Handle property duplication
  const handleDuplicateProperty = async () => {
    if (!propertyToDuplicate) return;

    try {
      setIsDuplicating(true);
      setError(null);

      // Call the duplicate API
      await supabasePropertiesApi.duplicate(propertyToDuplicate);

      // Refresh the properties list
      refreshProperties();

      // Close dialog
      setDuplicateDialogOpen(false);
      setPropertyToDuplicate(null);
    } catch (err) {
      console.error('Error duplicating property:', err);
      setError('حدث خطأ أثناء تكرار العقار. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Format price as currency
  const formatPrice = (price: number) => {
    // تنسيق السعر بدون أصفار إضافية
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal', // استخدام تنسيق عشري بدلاً من تنسيق العملة
      maximumFractionDigits: 0, // بدون كسور عشرية
    }).format(price) + ' ج.م'; // إضافة رمز العملة يدوياً
  };

  // Calculate property statistics
  const propertyStats = useMemo(() => {
    if (!properties.length) return {
      totalProperties: 0,
      availableProperties: 0,
      apartments: 0,
      expectedProfit: 0,
    };

    const availableProperties = properties.filter(property => property.is_available).length;
    const apartments = properties.filter(property => property.type === 'apartment').length;
    // حساب مجموع العمولات (الأرباح المتوقعة)
    const expectedProfit = properties.reduce((total, property) =>
      total + (property.commission || 0), 0);

    return {
      totalProperties: properties.length,
      availableProperties,
      apartments,
      expectedProfit,
    };
  }, [properties]);

  // Apply filters to the properties list
  const filteredProperties = properties;

  // Get paginated properties
  const paginatedProperties = filteredProperties.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );



  return (
    <Layout title="إدارة العقارات">
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
                title="إجمالي العقارات"
                value={propertyStats.totalProperties}
                icon={<HomeWorkIcon />}
                color={palette.primary.main}
                onClick={() => {
                  setTypeFilter('');
                  setAvailabilityFilter('');
                }}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="العقارات المتاحة"
                value={propertyStats.availableProperties}
                icon={<ApartmentIcon />}
                color={palette.success.main}
                onClick={() => setAvailabilityFilter('available')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الشقق"
                value={propertyStats.apartments}
                icon={<ApartmentIcon />}
                color={palette.info.main}
                onClick={() => setTypeFilter('apartment')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الأرباح المتوقعة"
                value={formatPrice(propertyStats.expectedProfit)}
                icon={<MonetizationOnIcon />}
                color={palette.secondary.main}
                subtitle="مجموع العمولات"
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
              تصفية العقارات
            </Typography>

            <Box>
              <Tooltip title="تحديث البيانات">
                <IconButton
                  onClick={refreshProperties}
                  disabled={loading}
                  sx={{
                    mr: 1,
                    backgroundColor: `${palette.primary.main}15`,
                    '&:hover': { backgroundColor: `${palette.primary.main}25` }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/properties/new')}
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
                إضافة عقار جديد
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
                placeholder="البحث باسم العقار أو العنوان"
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
                <InputLabel>نوع العقار</InputLabel>
                <Select
                  value={typeFilter}
                  label="نوع العقار"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {propertyTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
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
                <InputLabel>الحالة</InputLabel>
                <Select
                  value={availabilityFilter}
                  label="الحالة"
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="available">متاح</MenuItem>
                  <MenuItem value="unavailable">غير متاح</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Properties Table */}
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
              <HomeWorkIcon sx={{ mr: 1, color: palette.primary.main }} />
              قائمة العقارات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {properties.length > 0 ? `إجمالي العقارات: ${properties.length}` : ''}
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
            ) : filteredProperties.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <HomeWorkIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا توجد عقارات
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي عقارات مطابقة لمعايير البحث
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ backgroundColor: `${palette.primary.main}08` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>اسم العقار</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العنوان</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>السعر</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>العمولة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الغرف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProperties.map((property) => (
                    <TableRow
                      key={property.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${palette.primary.main}05`,
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {property.images && property.images.length > 0 ? (
                            <Box
                              component="img"
                              src={getPropertyThumbnail(property)}
                              alt={property.name}
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                mr: 2,
                                objectFit: 'cover',
                                border: '1px solid #eee'
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                mr: 2,
                                bgcolor: `${palette.primary.main}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <HomeWorkIcon color="primary" fontSize="small" />
                            </Box>
                          )}
                          {property.name}
                        </Box>
                      </TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>
                        {propertyTypes.find(t => t.value === property.type)?.label || property.type}
                      </TableCell>
                      <TableCell>{formatPrice(property.price)}</TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#2e7d32',
                          fontWeight: 'bold',
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          width: 'fit-content'
                        }}>
                          <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {formatPrice(property.commission !== undefined ? property.commission : 0)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <HotelIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          {property.bedrooms}
                          <BedIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />
                          {property.beds}
                          <StairsIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: 'text.secondary' }} />
                          {property.floor}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={property.is_available ? 'متاح' : 'غير متاح'}
                          color={property.is_available ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            color="info"
                            onClick={() => navigate(`/properties/${property.id}`)}
                            sx={{ backgroundColor: `${palette.info.main}15`, mr: 1 }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل العقار">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/properties/${property.id}`)}
                            sx={{ backgroundColor: `${palette.primary.main}15`, mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تكرار العقار">
                          <IconButton
                            color="success"
                            onClick={() => openDuplicateDialog(property.id)}
                            sx={{ backgroundColor: `${palette.success.main}15`, mr: 1 }}
                            disabled={isDuplicating}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف العقار">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(property.id)}
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
            count={filteredProperties.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="العقارات في الصفحة:"
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
              هل أنت متأكد من رغبتك في حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.
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
              onClick={handleDeleteProperty}
              color="error"
              disabled={isDeleting}
              variant="contained"
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Duplicate Confirmation Dialog */}
        <Dialog
          open={duplicateDialogOpen}
          onClose={() => setDuplicateDialogOpen(false)}
        >
          <DialogTitle>تأكيد التكرار</DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من رغبتك في تكرار هذا العقار؟ سيتم إنشاء نسخة جديدة بنفس البيانات.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDuplicateDialogOpen(false)}
              color="primary"
              disabled={isDuplicating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDuplicateProperty}
              color="success"
              disabled={isDuplicating}
              variant="contained"
              startIcon={isDuplicating ? <CircularProgress size={20} /> : <ContentCopyIcon />}
            >
              {isDuplicating ? 'جاري التكرار...' : 'تكرار'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Properties;