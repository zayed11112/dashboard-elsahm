import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  Alert,
  MenuItem,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  Switch,
  Chip,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MonetizationOn as MonetizationOnIcon,
  Category as CategoryIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabasePropertiesApi, imgbbApi, SupabaseProperty } from '../../services/supabaseApi';
import { supabaseOwnersApi, SupabaseOwner } from '../../services/ownersApi';
import { categoriesApi, Category } from '../../services/categoriesApi';
import { availablePlacesApi, AvailablePlace } from '../../services/availablePlacesApi';
import { useNotifications } from '../../contexts/NotificationsContext';

// Property amenities options
const amenities = [
  { value: 'تكيف', label: 'تكيف' },
  { value: 'واي فاي', label: 'واي فاي' },
  { value: 'متاح للسمر', label: 'متاح للسمر' },
  { value: 'ترم جديد', label: 'ترم جديد' },
  { value: 'بنات فقط', label: 'بنات فقط' },
  { value: 'اولاد فقط', label: 'اولاد فقط' },
  { value: 'عمارة بنات فقط', label: 'عمارة بنات فقط' },
  { value: 'عمارة اولاد فقط', label: 'عمارة اولاد فقط' },
  { value: 'شاشة', label: 'شاشة' },
  { value: 'مراتب تاكي', label: 'مراتب تاكي' },
  { value: 'غاز طبيعي', label: 'غاز طبيعي' },
  { value: 'عماير حكومي', label: 'عماير حكومي' },
  { value: 'عماير اهالي', label: 'عماير اهالي' },
];

// Define the Property type for the form
interface Property {
  id?: string;
  name: string;
  description: string;
  address: string;
  type: string;
  price: number;
  commission: number;
  deposit: number;
  bedrooms: number;
  beds: number;
  floor: string;
  // تم إزالة حقل المساحة (area) كما هو مطلوب
  is_available: boolean;
  features: string[];
  images: string[];
  videos: string[];
  drive_images: string[];
  owner_id?: string;
  owner_name?: string;
  owner_phone?: string;
  categories?: number[]; // إضافة حقل الأقسام
  places?: number[]; // إضافة حقل الأماكن
  info_vip?: string; // إضافة حقل المعلومات المميزة
}

const PropertyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();

  // Form state
  const [property, setProperty] = useState<Property>({
    name: '',
    description: '',
    address: '',
    type: '',
    price: 0,
    commission: 0,
    deposit: 0,
    bedrooms: 1,
    beds: 1,
    floor: '',
    // تم إزالة حقل المساحة (area) كما هو مطلوب
    is_available: true,
    features: [],
    images: [],
    videos: [],
    drive_images: [],
    owner_name: '',
    owner_phone: '',
    categories: [], // إضافة حقل الأقسام كقائمة فارغة
    places: [], // إضافة حقل الأماكن كقائمة فارغة
    info_vip: '', // إضافة حقل المعلومات المميزة
  });

  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newFeature, setNewFeature] = useState('');
  const [newVideo, setNewVideo] = useState('');

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Owners state
  const [owners, setOwners] = useState<SupabaseOwner[]>([]);
  const [searchOwnerTerm, setSearchOwnerTerm] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<SupabaseOwner | null>(null);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // Categories state
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Places state
  const [availablePlaces, setAvailablePlaces] = useState<AvailablePlace[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<AvailablePlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // State for video preview
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // State for confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load property data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProperty = async () => {
        try {
          setLoading(true);
          const response = await supabasePropertiesApi.getById(id);
          setProperty(response.data);

          // إذا كان العقار مرتبط بمالك، قم بتحميل بيانات المالك
          if (response.data.owner_id) {
            try {
              const ownerResponse = await supabaseOwnersApi.getById(response.data.owner_id);
              if (ownerResponse.data) {
                setSelectedOwner(ownerResponse.data);
              }
            } catch (err) {
              console.error('Error fetching owner:', err);
            }
          }

          // جلب الأقسام المرتبطة بالعقار
          try {
            const categoriesResponse = await categoriesApi.getCategoriesForProperty(id);
            if (categoriesResponse.data && categoriesResponse.data.length > 0) {
              // تحديث القائمة المختارة
              setSelectedCategories(categoriesResponse.data);
              // تحديث معرفات الأقسام في نموذج العقار
              setProperty(prev => ({
                ...prev,
                categories: categoriesResponse.data.map(cat => cat.id)
              }));
            }
          } catch (err) {
            console.error('Error fetching property categories:', err);
          }

          // جلب الأماكن المرتبطة بالعقار
          try {
            const placesResponse = await availablePlacesApi.getPlacesForProperty(id);
            if (placesResponse.data && placesResponse.data.length > 0) {
              // تحديث القائمة المختارة
              setSelectedPlaces(placesResponse.data);
              // تحديث معرفات الأماكن في نموذج العقار
              setProperty(prev => ({
                ...prev,
                places: placesResponse.data.map(place => place.id)
              }));
            }
          } catch (err) {
            console.error('Error fetching property places:', err);
          }
        } catch (err) {
          console.error('Error fetching property:', err);
          setError('حدث خطأ أثناء تحميل بيانات العقار. يرجى المحاولة مرة أخرى.');
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [id, isEditMode]);

  // جلب جميع الأقسام المتاحة عند تحميل الصفحة
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoriesApi.getAll({ isActive: true });
        setAvailableCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('حدث خطأ أثناء تحميل الأقسام. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // جلب جميع الأماكن المتاحة عند تحميل الصفحة
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoadingPlaces(true);
        const response = await availablePlacesApi.getAll({ isActive: true });
        setAvailablePlaces(response.data);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError('حدث خطأ أثناء تحميل الأماكن. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, []);

  // البحث عن الملاك عند تغيير مصطلح البحث
  useEffect(() => {
    const searchOwners = async () => {
      if (searchOwnerTerm.trim().length < 2) {
        setOwners([]);
        return;
      }

      try {
        setLoadingOwners(true);
        const response = await supabaseOwnersApi.searchOwners(searchOwnerTerm);
        setOwners(response.data);
      } catch (err) {
        console.error('Error searching owners:', err);
      } finally {
        setLoadingOwners(false);
      }
    };

    const timeoutId = setTimeout(searchOwners, 500);
    return () => clearTimeout(timeoutId);
  }, [searchOwnerTerm]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' || type === 'switch') {
      setProperty({ ...property, [name]: checked });
    } else if (name === 'price' || name === 'bedrooms' || name === 'beds' || name === 'commission') {
      // Handle numeric inputs
      setProperty({ ...property, [name]: value === '' ? '' : Number(value) });
    } else {
      setProperty({ ...property, [name]: value });
    }
  };

  // معالجة اختيار المالك من القائمة المنسدلة
  const handleOwnerSelect = (owner: SupabaseOwner | null) => {
    setSelectedOwner(owner);
    if (owner) {
      setProperty({
        ...property,
        owner_id: owner.id,
        owner_name: owner.name,
        owner_phone: owner.phone
      });
    } else {
      setProperty({
        ...property,
        owner_id: undefined,
        owner_name: '',
        owner_phone: ''
      });
    }
  };

  // Handle amenity changes
  const handleAmenityChange = (amenity: string) => {
    if (property.features.includes(amenity)) {
      setProperty({
        ...property,
        features: property.features.filter(a => a !== amenity),
      });
    } else {
      setProperty({
        ...property,
        features: [...property.features, amenity],
      });
    }
  };

  // Handle adding a custom feature
  const handleAddFeature = () => {
    if (newFeature.trim() && !property.features.includes(newFeature.trim())) {
      setProperty({
        ...property,
        features: [...property.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  // Handle removing a feature
  const handleRemoveFeature = (feature: string) => {
    setProperty({
      ...property,
      features: property.features.filter(f => f !== feature),
    });
  };

  // Function to preview video before adding
  const handlePreviewVideo = () => {
    if (newVideo.trim()) {
      setPreviewVideo(newVideo.trim());
    }
  };

  // Function to close video preview
  const handleClosePreview = () => {
    setPreviewVideo(null);
  };

  // Handle adding a video URL
  const handleAddVideo = () => {
    if (newVideo.trim() && !property.videos.includes(newVideo.trim())) {
      setProperty({
        ...property,
        videos: [...property.videos, newVideo.trim()],
      });
      setNewVideo('');
      setPreviewVideo(null); // Close preview after adding
      setSuccess('تم إضافة الفيديو بنجاح');
    }
  };

  // Handle removing a video
  const handleRemoveVideo = (video: string) => {
    setProperty({
      ...property,
      videos: property.videos.filter(v => v !== video),
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages: string[] = [];
      let failedUploads = 0;
      let usedFallback = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress
        setUploadProgress(Math.round((i / files.length) * 100));

        try {
          // Try to upload with ImgBB and fallback to Freeimage.host if necessary
          const result = await imgbbApi.uploadImage(file);
          
          // If we're here, upload succeeded with either primary or fallback service
          if (result.url.includes('freeimage.host')) {
            usedFallback = true;
          }
          
          // Add the URL to our list
          uploadedImages.push(result.url);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          failedUploads++;
        }
      }

      // Update property with new images
      setProperty({
        ...property,
        images: [...property.images, ...uploadedImages],
      });

      if (failedUploads > 0) {
        setError(`تم رفع ${uploadedImages.length} من الصور، وفشل رفع ${failedUploads} صورة. يرجى المحاولة مرة أخرى للصور التي فشلت.`);
      } else if (usedFallback) {
        setSuccess('تم رفع الصور بنجاح (باستخدام خدمة الرفع البديلة لبعض الصور)');
      } else {
        setSuccess('تم رفع الصور بنجاح');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('حدث خطأ أثناء رفع الصور. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
      setUploadProgress(0);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle removing an image
  const handleRemoveImage = (imageUrl: string) => {
    setProperty({
      ...property,
      images: property.images.filter(img => img !== imageUrl),
    });
  };

  // Handle opening confirm dialog
  const handleOpenConfirmDialog = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before showing confirmation
    if (!property.name || !property.address || !property.type || property.price <= 0 || property.bedrooms <= 0 || property.beds <= 0) {
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }
    
    setConfirmDialogOpen(true);
  };

  // Handle closing confirm dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  // معالجة اختيار الأقسام
  const handleCategoryChange = (categories: Category[]) => {
    setSelectedCategories(categories);
    setProperty({
      ...property,
      categories: categories.map(cat => cat.id)
    });
  };

  // معالجة اختيار الأماكن
  const handlePlaceChange = (places: AvailablePlace[]) => {
    setSelectedPlaces(places);
    setProperty({
      ...property,
      places: places.map(place => place.id)
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // إذا تم إدخال اسم المالك ورقم الهاتف ولم يتم اختيار مالك من القائمة
      let ownerId = property.owner_id;

      if (property.owner_name && property.owner_phone && !ownerId) {
        try {
          // البحث عن المالك أو إنشاء مالك جديد
          const ownerResponse = await supabaseOwnersApi.createIfNotExists(
            property.owner_name,
            property.owner_phone
          );

          if (ownerResponse.data) {
            ownerId = ownerResponse.data.id;
            setSelectedOwner(ownerResponse.data);
          }
        } catch (err) {
          console.error('Error creating owner:', err);
        }
      }

      // تأكد من أن الفيديوهات هي مصفوفة (Array) وليست فارغة
      const cleanedVideos = property.videos.filter(video => video.trim() !== '');
      console.log('Videos being saved:', cleanedVideos);

      // Convert to Supabase property format
      const supabaseProperty: SupabaseProperty = {
        name: property.name,
        address: property.address,
        type: property.type,
        price: property.price || 0, // تأكد من أن السعر 0 إذا لم يتم تحديده
        commission: property.commission || 0, // تأكد من أن العمولة 0 إذا لم يتم تحديدها
        deposit: property.deposit || 0, // تأكد من أن العربون 0 إذا لم يتم تحديده
        bedrooms: property.bedrooms,
        beds: property.beds,
        floor: property.floor,
        // تم إزالة حقل المساحة (area) كما هو مطلوب
        is_available: property.is_available,
        description: property.description,
        features: property.features,
        images: property.images,
        videos: cleanedVideos, // استخدام المصفوفة المنظفة من الفيديوهات
        drive_images: property.drive_images,
        owner_id: ownerId,
        owner_name: property.owner_name,
        owner_phone: property.owner_phone,
        info_vip: property.info_vip || '', // إضافة حقل المعلومات المميزة
      };

      let propertyId = '';

      if (isEditMode && id) {
        await supabasePropertiesApi.update(id, supabaseProperty);
        propertyId = id;
        setSuccess('تم تحديث العقار بنجاح');
        await addNotification(`تم تحديث العقار: ${property.name}`, 'property');
      } else {
        const response = await supabasePropertiesApi.create(supabaseProperty);
        propertyId = response.data.id;
        setSuccess('تم إضافة العقار بنجاح');
        await addNotification(`تم إضافة عقار جديد: ${property.name}`, 'property');
      }

      // حفظ الأقسام المرتبطة بالعقار
      if (property.categories && property.categories.length > 0 && propertyId) {
        try {
          await categoriesApi.linkPropertyToCategories(propertyId, property.categories);
        } catch (err) {
          console.error('Error linking property to categories:', err);
          setError('تم حفظ العقار ولكن حدثت مشكلة أثناء ربطه بالأقسام. يرجى التحقق من الأقسام لاحقاً.');
        }
      }

      // حفظ الأماكن المرتبطة بالعقار
      if (property.places && property.places.length > 0 && propertyId) {
        try {
          await availablePlacesApi.linkPropertyToPlaces(propertyId, property.places);
        } catch (err) {
          console.error('Error linking property to places:', err);
          setError('تم حفظ العقار ولكن حدثت مشكلة أثناء ربطه بالأماكن. يرجى التحقق من الأماكن لاحقاً.');
        }
      }
      
      // Navigate to the property page if it's a new property
      if (!isEditMode) {
        navigate(`/properties/${propertyId}`);
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError('حدث خطأ أثناء حفظ العقار. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Layout title={isEditMode ? 'تعديل العقار' : 'إضافة عقار جديد'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEditMode ? 'تعديل العقار' : 'إضافة عقار جديد'}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Back button and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/properties')}
              sx={{ ml: 2 }}
              variant="outlined"
            >
              العودة للقائمة
            </Button>
            <Typography variant="h6" fontWeight="bold">{isEditMode ? 'تعديل العقار' : 'إضافة عقار جديد'}</Typography>
          </Box>

          {/* Status messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
              {success}
            </Alert>
          )}

          {/* Property form */}
          <Box component="form" onSubmit={handleOpenConfirmDialog}>
            <Grid container spacing={3}>
              {/* Basic Info Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1} color="primary">
                  المعلومات الأساسية
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="اسم العقار"
                  name="name"
                  value={property.name}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Type */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="نوع العقار"
                  name="type"
                  value={property.type}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="العنوان"
                  name="address"
                  value={property.address}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="وصف العقار"
                  name="description"
                  value={property.description}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Special VIP Information Section - بقسم تصميم مميز */}
              <Grid item xs={12}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: 2,
                    border: '2px solid #9c27b0',
                    background: 'linear-gradient(to right, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.05))'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="#7b1fa2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ mr: 1 }} /> معلومات مميزة
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="معلومات مميزة عن العقار"
                    name="info_vip"
                    value={property.info_vip || ''}
                    onChange={handleChange}
                    placeholder="أضف أي معلومات خاصة أو مميزة عن العقار"
                    InputProps={{
                      sx: { fontSize: '0.95rem' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Details Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary">
                  التفاصيل
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Price */}
              <Grid item xs={12} md={3}>
                <TextField
                  required
                  fullWidth
                  label="السعر"
                  name="price"
                  type="number"
                  value={property.price}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end" sx={{ ml: 0 }}>ج.م</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    },
                    '& .MuiInputAdornment-root': {
                      marginLeft: 0
                    },
                    '& .MuiInputAdornment-positionEnd': {
                      marginLeft: 0
                    }
                  }}
                />
              </Grid>

              {/* Bedrooms */}
              <Grid item xs={12} md={3}>
                <TextField
                  required
                  fullWidth
                  label="غرف النوم"
                  name="bedrooms"
                  type="number"
                  value={property.bedrooms}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Beds */}
              <Grid item xs={12} md={3}>
                <TextField
                  required
                  fullWidth
                  label="عدد السراير"
                  name="beds"
                  type="number"
                  value={property.beds}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Floor */}
              <Grid item xs={12} md={3}>
                <TextField
                  required
                  fullWidth
                  label="الطابق"
                  name="floor"
                  value={property.floor}
                  onChange={handleChange}
                  placeholder="مثال: الأرضي، الأول، الثاني، البدروم"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Commission - مميز بتصميم خاص */}
              <Grid item xs={12}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: 2,
                    border: '2px solid #4caf50',
                    background: 'linear-gradient(to right, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <MonetizationOnIcon sx={{ mr: 1 }} /> العمولة
                  </Typography>

                  <TextField
                    fullWidth
                    label="قيمة العمولة"
                    name="commission"
                    type="number"
                    value={property.commission}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end" sx={{ ml: 0 }}>ج.م</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Deposit - العربون بتصميم مميز */}
              <Grid item xs={12}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: 2,
                    border: '2px solid #2196f3',
                    background: 'linear-gradient(to right, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="#1565c0" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <MonetizationOnIcon sx={{ mr: 1 }} /> العربون
                  </Typography>

                  <TextField
                    fullWidth
                    label="قيمة العربون"
                    name="deposit"
                    type="number"
                    value={property.deposit}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end" sx={{ ml: 0 }}>ج.م</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Availability */}
              <Grid item xs={12} md={9}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={property.is_available}
                      onChange={handleChange}
                      name="is_available"
                      color="primary"
                    />
                  }
                  label="متاح للحجز"
                />
              </Grid>

              {/* Owner Information Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary">
                  معلومات المالك (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Owner Search */}
              <Grid item xs={12}>
                <Autocomplete
                  options={owners}
                  loading={loadingOwners}
                  value={selectedOwner}
                  onChange={(event, newValue) => handleOwnerSelect(newValue)}
                  getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onInputChange={(event, newInputValue) => setSearchOwnerTerm(newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="البحث عن مالك"
                      placeholder="اكتب اسم المالك أو رقم الهاتف للبحث"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingOwners ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{option.phone}</Typography>
                      </Box>
                    </li>
                  )}
                  noOptionsText="لا توجد نتائج. يمكنك إدخال بيانات مالك جديد أدناه."
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ابحث عن مالك موجود أو أدخل بيانات مالك جديد في الحقول أدناه
                </Typography>
              </Grid>

              {/* Owner Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="اسم المالك"
                  name="owner_name"
                  value={property.owner_name || ''}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Owner Phone */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="رقم هاتف المالك"
                  name="owner_phone"
                  value={property.owner_phone || ''}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* Owner Info Note */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  إذا قمت بإدخال اسم ورقم هاتف لمالك جديد، سيتم إنشاء مالك جديد تلقائياً وربط العقار به.
                </Alert>
              </Grid>

              {/* Features Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary">
                  المميزات
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">اختر المميزات المتوفرة</FormLabel>
                  <FormGroup row>
                    {amenities.map((amenity) => (
                      <FormControlLabel
                        key={amenity.value}
                        control={
                          <Checkbox
                            checked={property.features.includes(amenity.value)}
                            onChange={() => handleAmenityChange(amenity.value)}
                            name={`amenity-${amenity.value}`}
                          />
                        }
                        label={amenity.label}
                        sx={{ width: { xs: '50%', md: '25%' } }}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Grid>

              {/* Custom Features */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="إضافة ميزة مخصصة"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddFeature}
                    disabled={!newFeature.trim()}
                    sx={{ ml: 1, height: 56, borderRadius: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {property.features.map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      onDelete={() => handleRemoveFeature(feature)}
                      color="primary"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Images Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary">
                  الصور
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    sx={{ mb: 2, borderRadius: 2 }}
                  >
                    {uploading ? `جاري الرفع... ${uploadProgress}%` : 'رفع صور'}
                  </Button>
                </label>

                {/* Image Gallery */}
                <Grid container spacing={2}>
                  {property.images.map((image, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={image}
                          alt={`صورة ${index + 1}`}
                        />
                        <CardActions sx={{ position: 'absolute', top: 0, right: 0, p: 0 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveImage(image)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.7)', m: 0.5 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Videos Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary">
                  فيديوهات العقار (اختياري)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="رابط فيديو"
                    value={newVideo}
                    onChange={(e) => setNewVideo(e.target.value)}
                    placeholder="https://epkaeyvfmkbanauyzjze.supabase.co/storage/v1/object/public/videos/example.mp4"
                    helperText="يمكنك إضافة رابط مباشر للفيديو من Supabase"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePreviewVideo}
                    disabled={!newVideo.trim()}
                    sx={{ ml: 1, height: 56, borderRadius: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>

                {previewVideo && (
                  <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      معاينة الفيديو
                    </Typography>
                    <video
                      src={previewVideo}
                      controls
                      style={{ width: '100%', maxHeight: '300px' }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClosePreview}
                        sx={{ ml: 1 }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddVideo}
                        sx={{ ml: 1 }}
                      >
                        إضافة الفيديو
                      </Button>
                    </Box>
                  </Box>
                )}

                {property.videos.length > 0 ? (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      تم إضافة {property.videos.length} فيديو
                    </Typography>
                    <List>
                      {property.videos.map((video, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            bgcolor: 'background.paper', 
                            mb: 1, 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <ListItemIcon>
                            <VideoLibraryIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography fontWeight="bold">فيديو {index + 1}</Typography>
                                {video.includes('supabase') && (
                                  <Chip 
                                    label="Supabase" 
                                    size="small" 
                                    color="info" 
                                    sx={{ ml: 1, height: 20 }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  wordBreak: 'break-all',
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {video}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="عرض الفيديو">
                              <IconButton 
                                edge="end" 
                                color="primary"
                                onClick={() => window.open(video, '_blank')}
                                sx={{ mr: 1 }}
                              >
                                <VideoLibraryIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف الفيديو">
                              <IconButton edge="end" onClick={() => handleRemoveVideo(video)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    لم تقم بإضافة أي فيديوهات بعد. يمكنك إضافة روابط فيديوهات من Supabase.
                  </Alert>
                )}
              </Grid>

              {/* Categories Section - إضافة قسم جديد للأقسام */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 1 }} /> الأقسام
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="categories-selector"
                  options={availableCategories}
                  getOptionLabel={(option) => option.name}
                  value={selectedCategories}
                  loading={loadingCategories}
                  onChange={(event, newValue) => handleCategoryChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="اختر الأقسام"
                      placeholder="اختر الأقسام المناسبة للعقار"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.name}</Typography>
                      </Box>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        icon={<CategoryIcon />}
                        label={option.name}
                        {...getTagProps({ index })}
                        sx={{ m: 0.5 }}
                      />
                    ))
                  }
                  noOptionsText="لا توجد أقسام متاحة"
                />

                {selectedCategories.length > 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    تم اختيار {selectedCategories.length} من الأقسام
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    اختر الأقسام التي يظهر فيها العقار. يمكنك اختيار أكثر من قسم.
                  </Typography>
                )}
              </Grid>

              {/* Places Section - إضافة قسم جديد للأماكن */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" mt={2} mb={1} color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ mr: 1 }} /> الأماكن المتاحة
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="places-selector"
                  options={availablePlaces}
                  getOptionLabel={(option) => option.name}
                  value={selectedPlaces}
                  loading={loadingPlaces}
                  onChange={(event, newValue) => handlePlaceChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="اختر الأماكن"
                      placeholder="اختر الأماكن المتاحة للعقار"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingPlaces ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.name}</Typography>
                      </Box>
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        icon={<LocationOnIcon />}
                        label={option.name}
                        {...getTagProps({ index })}
                        sx={{ m: 0.5 }}
                      />
                    ))
                  }
                  noOptionsText="لا توجد أماكن متاحة"
                />

                {selectedPlaces.length > 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    تم اختيار {selectedPlaces.length} من الأماكن
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    اختر الأماكن المتاحة للعقار. يمكنك اختيار أكثر من مكان.
                  </Typography>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={24} /> : <SaveIcon />}
                  sx={{ minWidth: 200, py: 1.5, borderRadius: 2 }}
                >
                  {submitting ? 'جاري الحفظ...' : isEditMode ? 'حفظ التغييرات' : 'إضافة العقار'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {isEditMode ? "تأكيد تحديث العقار" : "تأكيد إضافة العقار"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            هل أنت متأكد من حفظ بيانات العقار؟
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                تفاصيل العقار:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold">السعر:</Typography>
                <Typography variant="body2">{property.price} ج.م</Typography>
              </Box>
              {property.commission > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="#2e7d32">العمولة:</Typography>
                  <Typography variant="body2" color="#2e7d32">{property.commission} ج.م</Typography>
                </Box>
              )}
              {property.deposit > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="#1565c0">العربون:</Typography>
                  <Typography variant="body2" color="#1565c0">{property.deposit} ج.م</Typography>
                </Box>
              )}
              
              {/* عرض المعلومات المميزة في مربع التأكيد إذا وجدت */}
              {property.info_vip && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="#7b1fa2">معلومات مميزة:</Typography>
                  <Box sx={{ 
                    p: 1, 
                    mt: 0.5, 
                    bgcolor: 'rgba(156, 39, 176, 0.05)', 
                    border: '1px solid rgba(156, 39, 176, 0.2)', 
                    borderRadius: 1 
                  }}>
                    <Typography variant="body2">{property.info_vip}</Typography>
                  </Box>
                </Box>
              )}
              
              {/* عرض الأقسام المختارة في مربع التأكيد */}
              {selectedCategories.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">الأقسام:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {selectedCategories.map((category) => (
                      <Chip 
                        key={category.id} 
                        label={category.name} 
                        size="small" 
                        icon={<CategoryIcon fontSize="small" />} 
                        variant="outlined" 
                        sx={{ m: 0.2 }} 
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* عرض الأماكن المختارة في مربع التأكيد */}
              {selectedPlaces.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">الأماكن:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {selectedPlaces.map((place) => (
                      <Chip 
                        key={place.id} 
                        label={place.name} 
                        size="small" 
                        icon={<LocationOnIcon fontSize="small" />} 
                        variant="outlined" 
                        sx={{ m: 0.2 }} 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            
            {property.videos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                  فيديوهات العقار ({property.videos.length})
                </Typography>
                <List dense>
                  {property.videos.map((video, index) => (
                    <ListItem key={index} dense>
                      <ListItemIcon>
                        <VideoLibraryIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`فيديو ${index + 1}`}
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                          >
                            {video}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {submitting ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default PropertyForm;