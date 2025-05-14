import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
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
  FormControlLabel,
  Switch,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabase } from '../../supabase/client';
import { palette } from '../../theme/palette';

// نموذج لطريقة دفع
interface PaymentMethod {
  id: string;
  name: string;
  payment_identifier: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// النموذج الفارغ لإضافة طريقة دفع جديدة
const emptyPaymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  payment_identifier: '',
  image_url: '',
  is_active: true,
  display_order: 0
};

const PaymentMethods: React.FC = () => {
  // حالة البيانات
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // حالة الإضافة/التعديل
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [currentMethod, setCurrentMethod] = useState<Partial<PaymentMethod>>({ ...emptyPaymentMethod });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState<boolean>(false);

  // حالة الحذف
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [methodToDeleteId, setMethodToDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // جلب طرق الدفع من Supabase
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      setPaymentMethods(data || []);
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      setError('حدث خطأ أثناء جلب طرق الدفع: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // فتح نموذج الإضافة
  const openAddForm = () => {
    setFormMode('add');
    setCurrentMethod({ ...emptyPaymentMethod });
    setFormErrors({});
    setFormOpen(true);
  };

  // فتح نموذج التعديل
  const openEditForm = (method: PaymentMethod) => {
    setFormMode('edit');
    setCurrentMethod({ ...method });
    setFormErrors({});
    setFormOpen(true);
  };

  // إغلاق النموذج
  const closeForm = () => {
    setFormOpen(false);
  };

  // تغيير قيم النموذج
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // تعامل مع الحقول المختلفة حسب نوعها
    const inputValue = type === 'checkbox' ? checked : 
                       name === 'display_order' ? parseInt(value) || 0 : 
                       value;
    
    setCurrentMethod(prev => ({
      ...prev,
      [name]: inputValue
    }));
    
    // إزالة خطأ الحقل إذا تم ملؤه
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // التحقق من صحة النموذج
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!currentMethod.name?.trim()) {
      errors.name = 'اسم طريقة الدفع مطلوب';
    }
    
    if (!currentMethod.payment_identifier?.trim()) {
      errors.payment_identifier = 'معرف الدفع مطلوب';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ (إضافة/تعديل) طريقة الدفع
  const savePaymentMethod = async () => {
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      setError(null);
      
      if (formMode === 'add') {
        // إضافة طريقة دفع جديدة
        const { data, error } = await supabase
          .from('payment_methods')
          .insert([{
            ...currentMethod,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;
        
        setSuccess('تمت إضافة طريقة الدفع بنجاح');
        setPaymentMethods(prev => [...prev, data[0]]);
      } else {
        // تعديل طريقة دفع موجودة
        const { data, error } = await supabase
          .from('payment_methods')
          .update({
            ...currentMethod,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentMethod.id)
          .select();

        if (error) throw error;
        
        setSuccess('تم تحديث طريقة الدفع بنجاح');
        setPaymentMethods(prev => 
          prev.map(item => item.id === currentMethod.id ? data[0] : item)
        );
      }
      
      closeForm();
    } catch (err: any) {
      console.error('Error saving payment method:', err);
      setError('حدث خطأ أثناء حفظ طريقة الدفع: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // فتح مربع حوار تأكيد الحذف
  const confirmDelete = (id: string) => {
    setMethodToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  // حذف طريقة الدفع
  const deletePaymentMethod = async () => {
    if (!methodToDeleteId) return;
    
    try {
      setDeleteLoading(true);
      
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodToDeleteId);
        
      if (error) throw error;
      
      setPaymentMethods(prev => prev.filter(method => method.id !== methodToDeleteId));
      setSuccess('تم حذف طريقة الدفع بنجاح');
      setDeleteDialogOpen(false);
      setMethodToDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting payment method:', err);
      setError('حدث خطأ أثناء حذف طريقة الدفع: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // تغيير ترتيب العرض
  const changeDisplayOrder = async (id: string, direction: 'up' | 'down') => {
    const methodIndex = paymentMethods.findIndex(m => m.id === id);
    if (methodIndex === -1) return;
    
    // الحد الأدنى والأقصى للترتيب
    if (
      (direction === 'up' && methodIndex === 0) || 
      (direction === 'down' && methodIndex === paymentMethods.length - 1)
    ) {
      return;
    }
    
    const swapIndex = direction === 'up' ? methodIndex - 1 : methodIndex + 1;
    
    // نسخة جديدة من المصفوفة
    const updatedMethods = [...paymentMethods];
    
    // تبديل الترتيب
    const temp = updatedMethods[methodIndex].display_order;
    updatedMethods[methodIndex].display_order = updatedMethods[swapIndex].display_order;
    updatedMethods[swapIndex].display_order = temp;
    
    // تبديل الموقع في المصفوفة
    [updatedMethods[methodIndex], updatedMethods[swapIndex]] = 
    [updatedMethods[swapIndex], updatedMethods[methodIndex]];
    
    // تحديث واجهة المستخدم فورًا
    setPaymentMethods(updatedMethods.sort((a, b) => a.display_order - b.display_order));
    
    try {
      // تحديث قاعدة البيانات
      const updates = [
        {
          id: updatedMethods[methodIndex].id,
          display_order: updatedMethods[methodIndex].display_order,
          updated_at: new Date().toISOString()
        },
        {
          id: updatedMethods[swapIndex].id,
          display_order: updatedMethods[swapIndex].display_order,
          updated_at: new Date().toISOString()
        }
      ];
      
      // تحديث قاعدة البيانات دفعة واحدة
      const { error } = await supabase
        .from('payment_methods')
        .upsert(updates);
        
      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating display order:', err);
      setError('حدث خطأ أثناء تحديث ترتيب العرض: ' + err.message);
      
      // استعادة البيانات الأصلية في حالة الخطأ
      fetchPaymentMethods();
    }
  };

  return (
    <Layout title="طرق الدفع">
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        {/* العنوان وزر الإضافة */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4 
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
            <PaymentIcon fontSize="large" />
            إدارة طرق الدفع
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openAddForm}
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
            إضافة طريقة دفع
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
        
        {/* بطاقة جدول طرق الدفع */}
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
              قائمة طرق الدفع
            </Typography>
            
            <Tooltip title="تحديث البيانات">
              <IconButton 
                onClick={fetchPaymentMethods} 
                disabled={loading}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  '&:hover': { bgcolor: 'background.paper', transform: 'rotate(45deg)' },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
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
                  }}>الصورة</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>اسم طريقة الدفع</TableCell>
                  <TableCell align="center" sx={{ 
                    fontWeight: 'bold',
                    py: 2,
                    fontSize: '0.875rem',
                    borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                  }}>معرف الدفع</TableCell>
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
                  }}>ترتيب العرض</TableCell>
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
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                        جاري تحميل طرق الدفع...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paymentMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'text.secondary',
                        gap: 1,
                        p: 2
                      }}>
                        <PaymentIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>
                          لا توجد طرق دفع
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          قم بإضافة طرق الدفع المتاحة في التطبيق
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 2 }}
                          onClick={openAddForm}
                          startIcon={<AddIcon />}
                        >
                          إضافة طريقة دفع
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentMethods.map((method, index) => (
                    <TableRow 
                      key={method.id} 
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
                      {/* صورة طريقة الدفع */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Avatar 
                            src={method.image_url} 
                            alt={method.name}
                            variant="rounded"
                            sx={{ 
                              width: 50, 
                              height: 50,
                              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                              bgcolor: 'background.paper',
                              p: method.image_url ? 0 : 1
                            }}
                          >
                            {!method.image_url && <ImageIcon color="disabled" />}
                          </Avatar>
                        </Box>
                      </TableCell>
                      
                      {/* اسم طريقة الدفع */}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          fontWeight: 500
                        }}
                      >
                        {method.name}
                      </TableCell>
                      
                      {/* معرف الدفع */}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          direction: 'ltr'
                        }}
                      >
                        <Chip 
                          label={method.payment_identifier}
                          size="small"
                          sx={{ 
                            bgcolor: 'background.neutral',
                            fontFamily: 'monospace',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      
                      {/* الحالة */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                        <Chip
                          label={method.is_active ? 'نشطة' : 'غير نشطة'}
                          color={method.is_active ? 'success' : 'default'}
                          size="small"
                          icon={method.is_active ? <CheckIcon /> : <CloseIcon />}
                          sx={{
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      
                      {/* ترتيب العرض */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Chip 
                            label={method.display_order}
                            size="small"
                            sx={{ fontWeight: 'bold', minWidth: '30px' }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => changeDisplayOrder(method.id, 'up')}
                              disabled={index === 0}
                              sx={{ 
                                bgcolor: index === 0 ? 'transparent' : 'background.neutral',
                                mb: 0.5,
                                '&:hover': { bgcolor: 'primary.lighter' }
                              }}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => changeDisplayOrder(method.id, 'down')}
                              disabled={index === paymentMethods.length - 1}
                              sx={{ 
                                bgcolor: index === paymentMethods.length - 1 ? 'transparent' : 'background.neutral',
                                '&:hover': { bgcolor: 'primary.lighter' }
                              }}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      {/* الإجراءات */}
                      <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224, 224, 224, 0.5)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditForm(method)}
                              sx={{ 
                                bgcolor: 'primary.lighter', 
                                '&:hover': { 
                                  bgcolor: 'primary.light',
                                  transform: 'scale(1.1)' 
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => confirmDelete(method.id)}
                              sx={{ 
                                bgcolor: 'error.lighter', 
                                '&:hover': { 
                                  bgcolor: 'error.light',
                                  transform: 'scale(1.1)' 
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        {/* نموذج إضافة/تعديل طريقة الدفع */}
        <Dialog 
          open={formOpen} 
          onClose={closeForm}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <PaymentIcon />
            {formMode === 'add' ? 'إضافة طريقة دفع جديدة' : 'تعديل طريقة الدفع'}
          </DialogTitle>
          
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={3}>
                {/* اسم طريقة الدفع */}
                <Grid item xs={12} md={6}>
                  <TextField
                    name="name"
                    label="اسم طريقة الدفع"
                    value={currentMethod.name || ''}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                {/* معرف الدفع */}
                <Grid item xs={12} md={6}>
                  <TextField
                    name="payment_identifier"
                    label="معرف الدفع"
                    value={currentMethod.payment_identifier || ''}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!formErrors.payment_identifier}
                    helperText={formErrors.payment_identifier}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                {/* رابط الصورة */}
                <Grid item xs={12}>
                  <TextField
                    name="image_url"
                    label="رابط صورة طريقة الدفع"
                    value={currentMethod.image_url || ''}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    placeholder="https://example.com/payment-icon.png"
                  />
                  
                  {/* معاينة الصورة */}
                  {currentMethod.image_url && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 2, 
                      mb: 3,
                      p: 2,
                      bgcolor: 'background.neutral',
                      borderRadius: 2
                    }}>
                      <Avatar
                        src={currentMethod.image_url}
                        variant="rounded"
                        alt="معاينة الصورة"
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          boxShadow: 2,
                          bgcolor: 'background.paper',
                          p: 1
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {/* ترتيب العرض */}
                  <TextField
                    name="display_order"
                    label="ترتيب العرض"
                    type="number"
                    value={currentMethod.display_order || 0}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {/* حالة النشاط */}
                  <FormControlLabel
                    control={
                      <Switch
                        name="is_active"
                        checked={currentMethod.is_active}
                        onChange={handleInputChange}
                        color="primary"
                      />
                    }
                    label="نشطة"
                    sx={{ 
                      display: 'flex', 
                      height: '100%', 
                      alignItems: 'center',
                      '& .MuiFormControlLabel-label': {
                        fontWeight: 500,
                        color: 'text.primary'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={closeForm} 
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              إلغاء
            </Button>
            <Button
              onClick={savePaymentMethod}
              variant="contained"
              color="primary"
              disabled={formLoading}
              startIcon={formLoading && <CircularProgress size={20} />}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 18px rgba(25, 118, 210, 0.35)'
                }
              }}
            >
              {formLoading
                ? (formMode === 'add' ? 'جاري الإضافة...' : 'جاري التحديث...')
                : (formMode === 'add' ? 'إضافة' : 'تحديث')}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* مربع حوار تأكيد الحذف */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            تأكيد الحذف
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من حذف طريقة الدفع هذه؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              إلغاء
            </Button>
            <Button
              onClick={deletePaymentMethod}
              variant="contained"
              color="error"
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(211, 47, 47, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 18px rgba(211, 47, 47, 0.35)'
                }
              }}
            >
              {deleteLoading ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default PaymentMethods; 