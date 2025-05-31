import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Divider,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  useTheme,
  styled,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Badge as BadgeIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  LocationOn as LocationOnIcon,
  PermIdentity as PermIdentityIcon,
  CameraAlt as CameraAltIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import Layout from '../../components/Layout';
import { palette } from '../../theme/palette';

// Define interface for profile data
interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  address?: string;
  bio?: string;
}

// Define interface for password data
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Custom styled components
const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
  margin: '0 auto 24px',
  position: 'relative',
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  backgroundImage: 'linear-gradient(120deg, #1a237e 0%, #283593 50%, #303f9f 100%)',
  color: theme.palette.common.white,
  padding: theme.spacing(6, 2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
    zIndex: 1,
  },
}));

const CameraIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  padding: theme.spacing(1),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const StyledTabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <StyledTabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </StyledTabPanel>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Mock profile data
  const [profile, setProfile] = useState<ProfileData>({
    id: 'admin123',
    name: 'المشرف',
    email: 'admin@elsahm.com',
    phone: '0123456789',
    avatarUrl: '/avatar.jpg',
    role: 'admin',
    createdAt: '2023-01-01',
    lastLogin: '2024-05-21',
    address: 'القاهرة، مصر',
    bio: 'مدير نظام الساهم للتسكين',
  });

  // Form state for profile editing
  const [formData, setFormData] = useState<ProfileData>(profile);

  // Password change form state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load profile data on component mount
  useEffect(() => {
    // Simulate API call to fetch profile data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle profile edit mode
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit mode - reset form data
      setFormData(profile);
    }
    setEditMode(!editMode);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Toggle password visibility
  const handlePasswordVisibility = (field: keyof typeof passwordVisible) => {
    setPasswordVisible({
      ...passwordVisible,
      [field]: !passwordVisible[field],
    });
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Simulate API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update profile state with form data
      setProfile(formData);
      setEditMode(false);
      setSuccess('تم تحديث الملف الشخصي بنجاح');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('حدث خطأ أثناء حفظ الملف الشخصي');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  // Handle password save
  const handleSavePassword = async () => {
    // Validate password fields
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    try {
      setSaving(true);
      // Simulate API call to change password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccess('تم تغيير كلمة المرور بنجاح');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('حدث خطأ أثناء تغيير كلمة المرور');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout title="الملف الشخصي">
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <ProfileHeader>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: { md: 'space-between' },
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: 'center', 
                  mb: { xs: 3, md: 0 } 
                }}>
                  <Box sx={{ position: 'relative', mb: { xs: 2, md: 0 } }}>
                    <ProfileAvatar src={profile.avatarUrl} alt={profile.name}>
                      {!profile.avatarUrl && profile.name.charAt(0)}
                    </ProfileAvatar>
                    <CameraIconButton size="small" aria-label="تغيير الصورة">
                      <CameraAltIcon fontSize="small" />
                    </CameraIconButton>
                  </Box>
                  
                  <Box sx={{ 
                    textAlign: { xs: 'center', md: 'right' }, 
                    mr: { xs: 0, md: 4 }
                  }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      {profile.name}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      {profile.email}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={profile.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
                        color="primary"
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          backgroundColor: alpha('#fff', 0.2),
                          color: '#fff',
                          mr: 1
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEditToggle}
                    startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      backgroundColor: editMode ? alpha('#fff', 0.2) : alpha('#fff', 0.1),
                      '&:hover': {
                        backgroundColor: editMode ? alpha('#fff', 0.3) : alpha('#fff', 0.2),
                      },
                    }}
                  >
                    {editMode ? 'إلغاء' : 'تعديل'}
                  </Button>
                  
                  {editMode && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveProfile}
                      startIcon={<SaveIcon />}
                      disabled={saving}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        backgroundColor: alpha('#fff', 0.1),
                        '&:hover': {
                          backgroundColor: alpha('#fff', 0.2),
                        },
                      }}
                    >
                      {saving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                  )}
                </Box>
              </Box>
            </ProfileHeader>

            <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                aria-label="profile tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <StyledTab 
                  label="المعلومات الشخصية" 
                  icon={<PermIdentityIcon />} 
                  iconPosition="start" 
                  {...a11yProps(0)} 
                />
                <StyledTab 
                  label="الأمان" 
                  icon={<SecurityIcon />} 
                  iconPosition="start" 
                  {...a11yProps(1)} 
                />
                <StyledTab 
                  label="النشاط" 
                  icon={<HistoryIcon />} 
                  iconPosition="start" 
                  {...a11yProps(2)} 
                />
              </Tabs>

              {/* Personal Info Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="الاسم"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!editMode}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="البريد الإلكتروني"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!editMode}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="رقم الهاتف"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!editMode}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                      }}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="العنوان"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!editMode}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <LocationOnIcon color="action" sx={{ mr: 1 }} />,
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="نبذة شخصية"
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={!editMode}
                      variant="outlined"
                      multiline
                      rows={4}
                      sx={{ mb: 3 }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      تغيير كلمة المرور
                    </Typography>
                    
                    <TextField
                      label="كلمة المرور الحالية"
                      name="currentPassword"
                      type={passwordVisible.currentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => handlePasswordVisibility('currentPassword')}
                            edge="end"
                          >
                            {passwordVisible.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="كلمة المرور الجديدة"
                      name="newPassword"
                      type={passwordVisible.newPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => handlePasswordVisibility('newPassword')}
                            edge="end"
                          >
                            {passwordVisible.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <TextField
                      label="تأكيد كلمة المرور الجديدة"
                      name="confirmPassword"
                      type={passwordVisible.confirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />,
                        endAdornment: (
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => handlePasswordVisibility('confirmPassword')}
                            edge="end"
                          >
                            {passwordVisible.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSavePassword}
                      disabled={
                        saving || 
                        !passwordData.currentPassword || 
                        !passwordData.newPassword || 
                        !passwordData.confirmPassword
                      }
                      sx={{ borderRadius: 2, px: 4 }}
                    >
                      {saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      معلومات الأمان
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <BadgeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="نوع الحساب" 
                          secondary={profile.role === 'admin' ? 'مدير النظام' : 'مستخدم'} 
                        />
                      </ListItem>
                      
                      <Divider variant="inset" component="li" />
                      
                      <ListItem>
                        <ListItemIcon>
                          <HistoryIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="تاريخ الإنشاء" 
                          secondary={formatDate(profile.createdAt)} 
                        />
                      </ListItem>
                      
                      <Divider variant="inset" component="li" />
                      
                      <ListItem>
                        <ListItemIcon>
                          <HistoryIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="آخر تسجيل دخول" 
                          secondary={formatDate(profile.lastLogin)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  سجل النشاط
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  هذا القسم سيعرض سجل نشاطاتك في النظام.
                </Alert>
                
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    لا توجد أنشطة لعرضها حالياً.
                  </Typography>
                </Paper>
              </TabPanel>
            </Paper>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Profile; 