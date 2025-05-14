import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Category as CategoryIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { categoriesApi, Category } from '../../services/categoriesApi';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

// نموذج إضافة/تعديل قسم
interface CategoryFormData {
  name: string;
  icon_url: string;
  order_index: number;
  is_active: boolean;
}

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon_url: '',
    order_index: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // إحصائيات الأقسام
  const categoryStats = {
    totalCategories: categories.length,
    activeCategories: categories.filter(cat => cat.is_active).length,
    inactiveCategories: categories.filter(cat => !cat.is_active).length,
  };

  // جلب الأقسام عند تحميل الصفحة وعند تغيير عوامل التصفية
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);

        // إنشاء معلمات التصفية
        const params: Record<string, any> = {};
        if (searchQuery) params.search = searchQuery;
        if (activeFilter !== null) params.isActive = activeFilter;

        const response = await categoriesApi.getAll(params);
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('حدث خطأ أثناء تحميل الأقسام. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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

  // تحديث الأقسام
  const refreshCategories = () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (activeFilter !== null) params.isActive = activeFilter;

    categoriesApi.getAll(params)
      .then(response => {
        setCategories(response.data);
      })
      .catch(err => {
        console.error('Error refreshing categories:', err);
        setError('حدث خطأ أثناء تحديث بيانات الأقسام. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // فتح نموذج إضافة قسم جديد
  const openAddForm = () => {
    setCategoryToEdit(null);
    setFormData({
      name: '',
      icon_url: '',
      order_index: categories.length > 0 ? Math.max(...categories.map(c => c.order_index)) + 1 : 0,
      is_active: true,
    });
    setFormErrors({});
    setFormDialogOpen(true);
  };

  // فتح نموذج تعديل قسم
  const openEditForm = (category: Category) => {
    setCategoryToEdit(category);
    setFormData({
      name: category.name,
      icon_url: category.icon_url,
      order_index: category.order_index,
      is_active: category.is_active,
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
      errors.name = 'اسم القسم مطلوب';
    }
    
    if (!formData.icon_url.trim()) {
      errors.icon_url = 'رابط الأيقونة مطلوب';
    } else if (!formData.icon_url.match(/^(https?:\/\/)/)) {
      errors.icon_url = 'يجب أن يكون رابط صحيح يبدأ بـ http:// أو https://';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ القسم (إضافة أو تعديل)
  const handleSaveCategory = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      if (categoryToEdit) {
        // تعديل قسم موجود
        await categoriesApi.update(categoryToEdit.id, formData);
      } else {
        // إضافة قسم جديد
        await categoriesApi.create(formData);
      }
      
      // إغلاق النموذج وتحديث القائمة
      setFormDialogOpen(false);
      refreshCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('حدث خطأ أثناء حفظ القسم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح حوار الحذف
  const openDeleteDialog = (id: number) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  // حذف القسم
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsDeleting(true);
      await categoriesApi.delete(categoryToDelete);
      
      // إغلاق الحوار وتحديث القائمة
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refreshCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('حدث خطأ أثناء حذف القسم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // تغيير حالة نشاط القسم
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await categoriesApi.toggleActive(id, !currentStatus);
      refreshCategories();
    } catch (err) {
      console.error('Error toggling category status:', err);
      setError('حدث خطأ أثناء تغيير حالة القسم. يرجى المحاولة مرة أخرى.');
    }
  };

  // تغيير ترتيب القسم
  const handleMoveCategory = async (id: number, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return;
    
    const category = categories[categoryIndex];
    
    // لا يمكن تحريك العنصر الأول للأعلى أو العنصر الأخير للأسفل
    if (
      (direction === 'up' && categoryIndex === 0) ||
      (direction === 'down' && categoryIndex === categories.length - 1)
    ) {
      return;
    }
    
    try {
      const adjacentCategory = categories[direction === 'up' ? categoryIndex - 1 : categoryIndex + 1];
      
      // تبديل الترتيب بين القسمين
      await categoriesApi.updateOrder(category.id, adjacentCategory.order_index);
      await categoriesApi.updateOrder(adjacentCategory.id, category.order_index);
      
      refreshCategories();
    } catch (err) {
      console.error('Error moving category:', err);
      setError('حدث خطأ أثناء تغيير ترتيب القسم. يرجى المحاولة مرة أخرى.');
    }
  };

  // الحصول على الأقسام المصفاة والمقسمة إلى صفحات
  const paginatedCategories = categories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Layout title="الأقسام">
      <Box sx={{ p: 3 }}>
        {/* تنبيه الخطأ */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* بطاقات الإحصائيات */}
        <ResponsiveContainer>
          <ResponsiveGrid container spacing={3} sx={{ mb: 4 }}>
            <ResponsiveGrid item xs={12} sm={6} md={4}>
              <StatCard
                title="إجمالي الأقسام"
                value={categoryStats.totalCategories}
                icon={<CategoryIcon />}
                color={palette.primary.main}
                onClick={() => setActiveFilter(null)}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={4}>
              <StatCard
                title="الأقسام النشطة"
                value={categoryStats.activeCategories}
                icon={<ToggleOnIcon />}
                color={palette.success.main}
                onClick={() => setActiveFilter(true)}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={4}>
              <StatCard
                title="الأقسام غير النشطة"
                value={categoryStats.inactiveCategories}
                icon={<ToggleOffIcon />}
                color={palette.error.main}
                onClick={() => setActiveFilter(false)}
              />
            </ResponsiveGrid>
          </ResponsiveGrid>
        </ResponsiveContainer>

        {/* قسم البحث والتصفية */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: { xs: 2, sm: 0 } }}>
              تصفية الأقسام
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openAddForm}
                sx={{ borderRadius: 2 }}
              >
                إضافة قسم جديد
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
            <TextField
              label="بحث عن قسم"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ maxWidth: { sm: 300 } }}
            />

            <Box>
              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    onClick={refreshCategories}
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
                  setActiveFilter(null);
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
        </Paper>

        {/* جدول الأقسام */}
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, minHeight: 300 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
                  جاري تحميل البيانات...
                </Typography>
              </Box>
            ) : categories.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <CategoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا توجد أقسام
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي أقسام مطابقة لمعايير البحث
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ backgroundColor: `${palette.primary.main}08` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>الترتيب</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الأيقونة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>اسم القسم</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>تاريخ الإنشاء</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow
                      key={category.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${palette.primary.main}05`,
                        }
                      }}
                    >
                      <TableCell>{category.order_index}</TableCell>
                      <TableCell>
                        <Avatar
                          src={category.icon_url}
                          alt={category.name}
                          sx={{ width: 40, height: 40 }}
                          variant="rounded"
                        />
                      </TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={category.is_active ? 'نشط' : 'غير نشط'}
                          color={category.is_active ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(category.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="تحريك لأعلى">
                            <span>
                              <IconButton
                                color="default"
                                onClick={() => handleMoveCategory(category.id, 'up')}
                                disabled={categories.indexOf(category) === 0}
                                size="small"
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="تحريك لأسفل">
                            <span>
                              <IconButton
                                color="default"
                                onClick={() => handleMoveCategory(category.id, 'down')}
                                disabled={categories.indexOf(category) === categories.length - 1}
                                size="small"
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title={category.is_active ? 'إلغاء تنشيط' : 'تنشيط'}>
                            <IconButton
                              color={category.is_active ? 'success' : 'error'}
                              onClick={() => handleToggleActive(category.id, category.is_active)}
                              sx={{ backgroundColor: category.is_active ? `${palette.success.main}15` : `${palette.error.main}15` }}
                            >
                              {category.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="تعديل">
                            <IconButton
                              color="primary"
                              onClick={() => openEditForm(category)}
                              sx={{ backgroundColor: `${palette.primary.main}15` }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="حذف">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(category.id)}
                              sx={{ backgroundColor: `${palette.error.main}15` }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* ترقيم الصفحات */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={categories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="عدد الأقسام في الصفحة:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>
      </Box>

      {/* حوار إضافة/تعديل قسم */}
      <Dialog
        open={formDialogOpen}
        onClose={() => !isSubmitting && setFormDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {categoryToEdit ? 'تعديل قسم' : 'إضافة قسم جديد'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="اسم القسم"
                fullWidth
                value={formData.name}
                onChange={handleFormChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isSubmitting}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="icon_url"
                label="رابط الأيقونة"
                fullWidth
                value={formData.icon_url}
                onChange={handleFormChange}
                error={!!formErrors.icon_url}
                helperText={formErrors.icon_url}
                disabled={isSubmitting}
                required
                placeholder="https://example.com/icon.png"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="order_index"
                label="الترتيب"
                type="number"
                fullWidth
                value={formData.order_index}
                onChange={handleFormChange}
                disabled={isSubmitting}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Button
                  variant={formData.is_active ? 'contained' : 'outlined'}
                  color={formData.is_active ? 'success' : 'error'}
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  startIcon={formData.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                  fullWidth
                  sx={{ height: '56px' }}
                  disabled={isSubmitting}
                >
                  {formData.is_active ? 'نشط' : 'غير نشط'}
                </Button>
              </Box>
            </Grid>
            {formData.icon_url && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Avatar
                    src={formData.icon_url}
                    alt="معاينة الأيقونة"
                    sx={{ width: 80, height: 80 }}
                    variant="rounded"
                  >
                    <CategoryIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFormDialogOpen(false)}
            disabled={isSubmitting}
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSaveCategory}
            disabled={isSubmitting}
            color="primary"
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
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
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من رغبتك في حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteCategory}
            disabled={isDeleting}
            color="error"
            variant="contained"
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Categories;
