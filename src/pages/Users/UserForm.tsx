import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { usersApi } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationsContext';

// User roles
const userRoles = [
  { value: 'admin', label: 'مدير' },
  { value: 'user', label: 'مستخدم' },
];

// User status options
const userStatuses = [
  { value: 'طالب', label: 'طالب' },
  { value: 'صاحب عقار', label: 'صاحب عقار' },
  { value: 'امتياز', label: 'امتياز' },
  { value: 'وسيط', label: 'وسيط' },
];

// Available faculties
const faculties = [
  { value: 'حاسبات / تكنولوجيا معلومات (IT)', label: 'حاسبات / تكنولوجيا معلومات (IT)', eng: 'IT' },
  { value: 'هندسة (ENG)', label: 'هندسة (ENG)', eng: 'ENG' },
  { value: 'أسنان (DENT)', label: 'أسنان (DENT)', eng: 'DENT' },
  { value: 'صيدلة (PHARM)', label: 'صيدلة (PHARM)', eng: 'PHARM' },
  { value: 'إعلام (MEDIA)', label: 'إعلام (MEDIA)', eng: 'MEDIA' },
  { value: 'بيزنس (BUS)', label: 'بيزنس (BUS)', eng: 'BUS' },
  { value: 'علاج طبيعي (PT)', label: 'علاج طبيعي (PT)', eng: 'PT' },
  { value: 'أخرى', label: 'أخرى', eng: 'OTHER' },
];

// Available branches
const branches = [
  { value: 'فرع العريش', label: 'فرع العريش' },
  { value: 'فرع القنطرة', label: 'فرع القنطرة' },
];

// Define the User type
interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  faculty?: string;
  facultyEng?: string;
  branch?: string;
  batch?: string;
  studentId?: string;
  balance?: number;
}

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { addNotification } = useNotifications();

  // Form state
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    role: 'user',
    status: 'محاسب عام',
    avatarUrl: '',
    faculty: 'بيزنس (BUS)',
    facultyEng: 'IT',
    branch: 'فرع القاهرة',
    batch: '',
    studentId: '',
    balance: 0,
  });

  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const response = await usersApi.getById(id);

          // Remove password fields from response data
          const { password, ...userData } = response.data;
          setUser(userData);
        } catch (err) {
          console.error('Error fetching user:', err);
          setError('حدث خطأ أثناء تحميل بيانات المستخدم. يرجى المحاولة مرة أخرى.');
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [id, isEditMode]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!user.name || !user.email) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // استخدام البيانات مباشرة
      const userData = { ...user };

      if (isEditMode && id) {
        // Update existing user
        await usersApi.update(id, userData);
        setSuccess('تم تحديث المستخدم بنجاح');

        // Add notification for user update
        await addNotification(`تم تحديث بيانات المستخدم ${user.name}`, 'user');
      } else {
        // Create new user
        const response = await usersApi.create(userData);
        setSuccess('تم إضافة المستخدم بنجاح');

        // Add notification for new user
        await addNotification(`تم تسجيل مستخدم جديد: ${user.name}`, 'user');

        // Navigate to edit page for the new user
        if (response.data && response.data.id) {
          setTimeout(() => {
            navigate(`/users/${response.data.id}`);
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ المستخدم. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title={isEditMode ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={isEditMode ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}>
      <Box sx={{ p: 2 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          {/* Back button and title */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 4,
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            pb: 2
          }}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {isEditMode ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/users')}
              variant="outlined"
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              العودة للقائمة
            </Button>
          </Box>

          {/* User avatar/icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Avatar
              src={user.avatarUrl}
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: 60,
                boxShadow: 3,
                border: '4px solid white'
              }}
            >
              {!user.avatarUrl && (user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon fontSize="large" />)}
            </Avatar>
          </Box>

          {/* Status messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* User form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Info Section */}
              <Grid item xs={12}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  py: 1,
                  px: 2,
                  borderRadius: 1
                }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    المعلومات الأساسية
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="الاسم"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1 }} />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="البريد الإلكتروني"
                  name="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ mr: 1 }} />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Grid>



              {/* Role */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>الصلاحية</InputLabel>
                  <Select
                    label="الصلاحية"
                    name="role"
                    value={user.role}
                    onChange={(e) => setUser({ ...user, role: e.target.value })}
                  >
                    {userRoles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2
                    }
                  }
                }}>
                  <InputLabel>نوع المستخدم</InputLabel>
                  <Select
                    label="نوع المستخدم"
                    name="status"
                    value={user.status}
                    onChange={(e) => setUser({ ...user, status: e.target.value })}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>👤</Box>
                      </InputAdornment>
                    }
                  >
                    {userStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Student Info Section */}
              <Grid item xs={12}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  mt: 2,
                  backgroundColor: 'info.main',
                  color: 'white',
                  py: 1,
                  px: 2,
                  borderRadius: 1
                }}>
                  <Box component="span" sx={{ mr: 1 }}>🎓</Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    معلومات الطالب
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Student ID */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الرقم الجامعي"
                  name="studentId"
                  value={user.studentId || ''}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>🆔</Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Grid>

              {/* Faculty */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2
                    }
                  }
                }}>
                  <InputLabel>الكلية</InputLabel>
                  <Select
                    label="الكلية"
                    name="faculty"
                    value={user.faculty || ''}
                    onChange={(e) => {
                      const selectedFaculty = faculties.find(f => f.value === e.target.value);
                      setUser({
                        ...user,
                        faculty: e.target.value as string,
                        facultyEng: selectedFaculty?.eng || ''
                      });
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>🎓</Box>
                      </InputAdornment>
                    }
                  >
                    {faculties.map((faculty) => (
                      <MenuItem key={faculty.value} value={faculty.value}>
                        {faculty.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Branch */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 2
                    }
                  }
                }}>
                  <InputLabel>الفرع</InputLabel>
                  <Select
                    label="الفرع"
                    name="branch"
                    value={user.branch || ''}
                    onChange={(e) => setUser({ ...user, branch: e.target.value as string })}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>🏢</Box>
                      </InputAdornment>
                    }
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Batch */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الدفعة"
                  name="batch"
                  value={user.batch || ''}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>📅</Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Grid>

              {/* Balance */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="الرصيد"
                  name="balance"
                  type="number"
                  value={user.balance || 0}
                  onChange={(e) => setUser({ ...user, balance: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ mr: 1 }}>💰</Box>
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">جنيه</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
                  sx={{
                    minWidth: 200,
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: 3
                  }}
                >
                  {saving ? 'جاري الحفظ...' : isEditMode ? 'حفظ التغييرات' : 'إضافة المستخدم'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
};

export default UserForm;