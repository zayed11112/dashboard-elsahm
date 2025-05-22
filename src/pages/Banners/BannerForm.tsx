import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  FormHelperText,
  Box,
  Typography,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Close as CloseIcon } from '@mui/icons-material';
import { supabseBannersApi, SupabaseBanner } from '../../services/bannersApi';

interface BannerFormProps {
  open: boolean;
  banner: SupabaseBanner | null;
  onClose: (refresh?: boolean) => void;
}

const BannerForm: React.FC<BannerFormProps> = ({ open, banner, onClose }) => {
  const [formData, setFormData] = useState<SupabaseBanner>({
    image_url: '',
    order_index: 0,
    title: '',
    description: '',
    action_url: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (banner) {
      setFormData({
        id: banner.id,
        image_url: banner.image_url,
        order_index: banner.order_index,
        title: banner.title || '',
        description: banner.description || '',
        action_url: banner.action_url || '',
        is_active: banner.is_active,
      });
      setImagePreview(banner.image_url);
    } else {
      // Reset form for new banner
      setFormData({
        image_url: '',
        order_index: 999, // Default to end of list
        title: '',
        description: '',
        action_url: '',
        is_active: true,
      });
      setImagePreview('');
    }
    
    // Clear errors and file selection
    setFormErrors({});
    setError(null);
    setImageFile(null);
  }, [banner, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors({
          ...formErrors,
          image_url: 'الرجاء اختيار ملف صورة صالح.',
        });
        return;
      }
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Set file for upload
      setImageFile(file);
      
      // Clear error
      if (formErrors.image_url) {
        setFormErrors({
          ...formErrors,
          image_url: '',
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Require image URL for new banners
    if (!formData.image_url && !imageFile && !banner) {
      errors.image_url = 'الرجاء اختيار صورة للبانر.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      let finalFormData = { ...formData };

      // Upload image if selected
      if (imageFile) {
        try {
          setUploadingImage(true);
          const { publicUrl } = await supabseBannersApi.uploadImage(imageFile);
          finalFormData.image_url = publicUrl;
          setUploadingImage(false);
        } catch (err) {
          console.error('Error uploading image:', err);
          setError('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
          setLoading(false);
          setUploadingImage(false);
          return;
        }
      }

      if (banner) {
        // Update existing banner
        await supabseBannersApi.update(banner.id!, finalFormData);
      } else {
        // Create new banner
        await supabseBannersApi.create(finalFormData);
      }

      onClose(true); // Close and refresh
    } catch (err) {
      console.error('Error saving banner:', err);
      setError('حدث خطأ أثناء حفظ البانر. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {banner ? 'تعديل البانر' : 'إضافة بانر جديد'}
        <IconButton onClick={() => !loading && onClose()}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Image Preview */}
          <Grid item xs={12}>
            <Box sx={{ 
              border: theme => `1px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              mb: 2
            }}>
              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <img 
                    src={imagePreview}
                    alt="Banner Preview"
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={uploadingImage ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
                    component="label"
                    size="small"
                    disabled={uploadingImage}
                    sx={{ 
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      }
                    }}
                  >
                    {uploadingImage ? 'جارِ الرفع...' : 'تغيير الصورة'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                  </Button>
                </Box>
              ) : (
                <Box>
                  <PhotoCameraIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    اختر صورة البانر
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={uploadingImage ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
                    component="label"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'جارِ الرفع...' : 'اختيار صورة'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                  </Button>
                </Box>
              )}
              {formErrors.image_url && (
                <FormHelperText error>{formErrors.image_url}</FormHelperText>
              )}
              {uploadingImage && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    جارِ رفع الصورة... قد يستغرق هذا بضع ثوان
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Form Fields */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="title"
              label="عنوان البانر"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              placeholder="أدخل عنوان البانر (اختياري)"
              error={!!formErrors.title}
              helperText={formErrors.title}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="action_url"
              label="رابط الإجراء"
              value={formData.action_url}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              placeholder="أدخل رابط الإجراء عند النقر (اختياري)"
              error={!!formErrors.action_url}
              helperText={formErrors.action_url}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="وصف البانر"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              placeholder="أدخل وصف البانر (اختياري)"
              error={!!formErrors.description}
              helperText={formErrors.description}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="order_index"
              label="ترتيب العرض"
              type="number"
              value={formData.order_index}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              InputProps={{ inputProps: { min: 0 } }}
              error={!!formErrors.order_index}
              helperText={formErrors.order_index}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={handleChange}
                  name="is_active"
                  color="primary"
                />
              }
              label="البانر نشط"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={() => onClose()} 
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSubmit}
          disabled={loading || uploadingImage}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'جاري الحفظ...' : uploadingImage ? 'جارِ رفع الصورة...' : 'حفظ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BannerForm; 