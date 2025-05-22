import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Place as PlaceIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { availablePlacesApi, AvailablePlace } from '../../services/availablePlacesApi';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

// نموذج إضافة/تعديل مكان
interface PlaceFormData {
  name: string;
  icon_url: string;
  order_index: number;
  is_active: boolean;
}

const Places: React.FC = () => {
  const [places, setPlaces] = useState<AvailablePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حالة البحث والتصفية
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  // حالة الصفحات
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // حالة الحوارات
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeToEdit, setPlaceToEdit] = useState<AvailablePlace | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    icon_url: '',
    order_index: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // إحصائيات الأماكن
  const placeStats = {
    totalPlaces: places.length,
    activePlaces: places.filter(place => place.is_active).length,
    inactivePlaces: places.filter(place => !place.is_active).length,
  };

  // جلب الأماكن عند تحميل الصفحة وعند تغيير عوامل التصفية
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);

        // إنشاء معلمات التصفية
        const params: Record<string, any> = {};
        if (searchQuery) params.search = searchQuery;
        if (activeFilter !== null) params.isActive = activeFilter;

        const response = await availablePlacesApi.getAll(params);
        setPlaces(response.data);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError('حدث خطأ أثناء تحميل الأماكن. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [searchQuery, activeFilter]);

  // تغيير الصفحة
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // تغيير عدد الصفوف في الصفحة
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // تحديث الأماكن
  const refreshPlaces = () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (activeFilter !== null) params.isActive = activeFilter;

    availablePlacesApi.getAll(params)
      .then(response => {
        setPlaces(response.data);
      })
      .catch(err => {
        console.error('Error refreshing places:', err);
        setError('حدث خطأ أثناء تحديث بيانات الأماكن. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // فتح نموذج إضافة مكان جديد
  const openAddForm = () => {
    setPlaceToEdit(null);
    setFormData({
      name: '',
      icon_url: '',
      order_index: places.length > 0 ? Math.max(...places.map(p => p.order_index)) + 1 : 0,
      is_active: true,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // فتح نموذج تعديل مكان
  const openEditForm = (place: AvailablePlace) => {
    setPlaceToEdit(place);
    setFormData({
      name: place.name,
      icon_url: place.icon_url,
      order_index: place.order_index,
      is_active: place.is_active,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // تغيير قيم النموذج
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // إزالة الخطأ عند تغيير القيمة
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // التحقق من صحة النموذج
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'اسم المكان مطلوب';
    }
    
    if (!formData.icon_url.trim()) {
      errors.icon_url = 'رابط الأيقونة مطلوب';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ المكان
  const handleSavePlace = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const placeData = {
        ...formData,
      };
      
      let result;
      
      if (placeToEdit) {
        // تحديث مكان موجود
        result = await availablePlacesApi.update(placeToEdit.id, placeData);
      } else {
        // إضافة مكان جديد
        result = await availablePlacesApi.create(placeData);
      }
      
      // تحديث قائمة الأماكن
      refreshPlaces();
      
      // إغلاق النموذج
      setFormDialogOpen(false);
    } catch (err) {
      console.error('Error saving place:', err);
      setError('حدث خطأ أثناء حفظ المكان. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح مربع حوار الحذف
  const openDeleteDialog = (id: number) => {
    setPlaceToDelete(id);
    setDeleteDialogOpen(true);
  };

  // حذف المكان
  const handleDeletePlace = async () => {
    if (!placeToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await availablePlacesApi.delete(placeToDelete);
      
      // تحديث قائمة الأماكن
      setPlaces(prev => prev.filter(place => place.id !== placeToDelete));
      
      // إغلاق مربع الحوار
      setDeleteDialogOpen(false);
      setPlaceToDelete(null);
    } catch (err) {
      console.error('Error deleting place:', err);
      setError('حدث خطأ أثناء حذف المكان. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // تبديل حالة التنشيط
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await availablePlacesApi.toggleActive(id, !currentStatus);
      
      // تحديث حالة المكان في القائمة المحلية
      setPlaces(prev => prev.map(place => 
        place.id === id ? { ...place, is_active: !currentStatus } : place
      ));
    } catch (err) {
      console.error('Error toggling place status:', err);
      setError('حدث خطأ أثناء تغيير حالة المكان. يرجى المحاولة مرة أخرى.');
    }
  };

  // تغيير ترتيب المكان
  const handleMovePlace = async (id: number, direction: 'up' | 'down') => {
    try {
      const currentPlace = places.find(p => p.id === id);
      if (!currentPlace) return;

      const currentIndex = places.findIndex(p => p.id === id);
      const adjacentIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (adjacentIndex < 0 || adjacentIndex >= places.length) return;
      
      const adjacentPlace = places[adjacentIndex];
      
      // تبديل الترتيب
      await availablePlacesApi.updateOrder(currentPlace.id, adjacentPlace.order_index);
      await availablePlacesApi.updateOrder(adjacentPlace.id, currentPlace.order_index);
      
      // تحديث قائمة الأماكن
      refreshPlaces();
    } catch (err) {
      console.error('Error changing place order:', err);
      setError('حدث خطأ أثناء تغيير ترتيب المكان. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <Layout title="الأماكن">
      {/* الإحصائيات */}
      <ResponsiveGrid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="إجمالي الأماكن"
            value={placeStats.totalPlaces}
            icon={<PlaceIcon fontSize="large" />}
            color={palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="الأماكن النشطة"
            value={placeStats.activePlaces}
            icon={<ToggleOnIcon fontSize="large" />}
            color={palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="الأماكن غير النشطة"
            value={placeStats.inactivePlaces}
            icon={<ToggleOffIcon fontSize="large" />}
            color={palette.error.main}
          />
        </Grid>
      </ResponsiveGrid>

      {/* عنوان وأزرار */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" component="h2">
          تصفية الأماكن
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddForm}
          sx={{ px: 3 }}
        >
          إضافة مكان جديد
        </Button>
      </Box>

      {/* شريط البحث والتصفية */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2
        }}
      >
        <TextField
          label="بحث عن مكان"
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={activeFilter === true ? 'contained' : 'outlined'}
            color={activeFilter === true ? 'success' : 'primary'}
            size="small"
            onClick={() => setActiveFilter(activeFilter === true ? null : true)}
            sx={{ minWidth: 100 }}
          >
            نشط
          </Button>
          <Button
            variant={activeFilter === false ? 'contained' : 'outlined'}
            color={activeFilter === false ? 'error' : 'primary'}
            size="small"
            onClick={() => setActiveFilter(activeFilter === false ? null : false)}
            sx={{ minWidth: 100 }}
          >
            غير نشط
          </Button>
          <IconButton onClick={refreshPlaces} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* رسائل الخطأ */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* جدول الأماكن */}
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ minHeight: 300 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">الترتيب</TableCell>
                <TableCell align="center">الأيقونة</TableCell>
                <TableCell>اسم المكان</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">تاريخ الإنشاء</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : places.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    لا توجد أماكن للعرض
                  </TableCell>
                </TableRow>
              ) : (
                places
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((place) => (
                    <TableRow key={place.id}>
                      <TableCell align="center">{place.order_index}</TableCell>
                      <TableCell align="center">
                        <Avatar 
                          src={place.icon_url}
                          alt={place.name}
                          sx={{ width: 40, height: 40, margin: '0 auto' }}
                          variant="rounded"
                        />
                      </TableCell>
                      <TableCell>{place.name}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={place.is_active ? "نشط" : "غير نشط"}
                          color={place.is_active ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {new Date(place.created_at!).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="تعديل المكان">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditForm(place)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف المكان">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(place.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="تغيير الحالة">
                            <IconButton
                              size="small"
                              color={place.is_active ? "success" : "error"}
                              onClick={() => handleToggleActive(place.id, place.is_active)}
                            >
                              {place.is_active ? (
                                <ToggleOnIcon fontSize="small" />
                              ) : (
                                <ToggleOffIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="نقل لأعلى">
                            <span>
                              <IconButton
                                size="small"
                                disabled={places.indexOf(place) === 0}
                                onClick={() => handleMovePlace(place.id, 'up')}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="نقل لأسفل">
                            <span>
                              <IconButton
                                size="small"
                                disabled={places.indexOf(place) === places.length - 1}
                                onClick={() => handleMovePlace(place.id, 'down')}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={places.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} من ${count}`}
        />
      </Paper>

      {/* حوار إضافة/تعديل مكان */}
      <Dialog
        open={formDialogOpen}
        onClose={() => !isSubmitting && setFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {placeToEdit ? 'تعديل مكان' : 'إضافة مكان جديد'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="اسم المكان"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleFormChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="icon_url"
            label="رابط الأيقونة"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.icon_url}
            onChange={handleFormChange}
            error={!!formErrors.icon_url}
            helperText={formErrors.icon_url}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="order_index"
            label="الترتيب"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.order_index}
            onChange={handleFormChange}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 2 }}>الحالة:</Typography>
            <Button
              variant={formData.is_active ? "contained" : "outlined"}
              color={formData.is_active ? "success" : "error"}
              onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
              startIcon={formData.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
              disabled={isSubmitting}
            >
              {formData.is_active ? 'نشط' : 'غير نشط'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFormDialogOpen(false)}
            color="inherit"
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSavePlace}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار تأكيد الحذف */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف هذا المكان؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            disabled={isDeleting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeletePlace}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Places; 