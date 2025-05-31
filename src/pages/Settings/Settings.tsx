import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  useTheme,
  styled,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  DataUsage as DataUsageIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  DeleteOutline as DeleteOutlineIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  FormatPaint as FormatPaintIcon,
  Tune as TuneIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import Layout from '../../components/Layout';
import { palette } from '../../theme/palette';

// Define interfaces for settings
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ar' | 'en';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  autoSave: boolean;
  autoBackup: boolean;
  dataCompression: boolean;
  twoFactorAuth: boolean;
  dataRetentionDays: number;
  primaryColor: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Custom styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
  },
}));

const SettingsHeader = styled(Box)(({ theme }) => ({
  backgroundImage: 'linear-gradient(120deg, #1a237e 0%, #283593 50%, #303f9f 100%)',
  color: theme.palette.common.white,
  padding: theme.spacing(3, 2),
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

const ColorBox = styled(Box)({
  width: 30,
  height: 30,
  borderRadius: '50%',
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  '&.selected': {
    border: '2px solid #fff',
    boxShadow: '0 0 0 2px #1976d2',
  },
});

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <StyledTabPanel
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </StyledTabPanel>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Mock settings data
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'ar',
    notificationsEnabled: true,
    emailNotifications: true,
    autoSave: true,
    autoBackup: false,
    dataCompression: true,
    twoFactorAuth: false,
    dataRetentionDays: 90,
    primaryColor: '#1976d2',
  });

  // Color palette options
  const colorOptions = [
    { name: 'أزرق', value: '#1976d2' },
    { name: 'أرجواني', value: '#9c27b0' },
    { name: 'أحمر', value: '#f44336' },
    { name: 'أخضر', value: '#4caf50' },
    { name: 'برتقالي', value: '#ff9800' },
    { name: 'وردي', value: '#e91e63' },
    { name: 'بنفسجي', value: '#673ab7' },
    { name: 'أزرق فاتح', value: '#03a9f4' },
  ];

  // Load settings on component mount
  useEffect(() => {
    // Simulate API call to fetch settings
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle settings change
  const handleSettingChange = (setting: keyof AppSettings, value: any) => {
    setSettings({
      ...settings,
      [setting]: value,
    });
  };

  // Handle color selection
  const handleColorChange = (color: string) => {
    setSettings({
      ...settings,
      primaryColor: color,
    });
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('تم حفظ الإعدادات بنجاح');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('حدث خطأ أثناء حفظ الإعدادات');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset settings
  const handleResetSettings = () => {
    // Reset to default settings
    setSettings({
      theme: 'light',
      language: 'ar',
      notificationsEnabled: true,
      emailNotifications: true,
      autoSave: true,
      autoBackup: false,
      dataCompression: true,
      twoFactorAuth: false,
      dataRetentionDays: 90,
      primaryColor: '#1976d2',
    });
    
    setSuccess('تم إعادة ضبط الإعدادات إلى الإعدادات الافتراضية');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  return (
    <Layout title="الإعدادات">
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

            <SettingsHeader>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      إعدادات النظام
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      تخصيص النظام حسب احتياجاتك
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleResetSettings}
                    startIcon={<RefreshIcon />}
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
                    إعادة ضبط
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveSettings}
                    startIcon={<SaveIcon />}
                    disabled={saving}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      backgroundColor: alpha('#fff', 0.2),
                      '&:hover': {
                        backgroundColor: alpha('#fff', 0.3),
                      },
                    }}
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </Button>
                </Box>
              </Box>
            </SettingsHeader>

            <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                aria-label="settings tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <StyledTab 
                  label="العامة" 
                  icon={<TuneIcon />} 
                  iconPosition="start" 
                  {...a11yProps(0)} 
                />
                <StyledTab 
                  label="المظهر" 
                  icon={<PaletteIcon />} 
                  iconPosition="start" 
                  {...a11yProps(1)} 
                />
                <StyledTab 
                  label="الإشعارات" 
                  icon={<NotificationsIcon />} 
                  iconPosition="start" 
                  {...a11yProps(2)} 
                />
                <StyledTab 
                  label="الخصوصية والأمان" 
                  icon={<SecurityIcon />} 
                  iconPosition="start" 
                  {...a11yProps(3)} 
                />
              </Tabs>

              {/* General Settings Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <StyledCard>
                      <CardHeader 
                        title="إعدادات اللغة" 
                        titleTypographyProps={{ fontWeight: 600 }}
                        avatar={<LanguageIcon color="primary" />}
                      />
                      <Divider />
                      <CardContent>
                        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                          <InputLabel id="language-select-label">اللغة</InputLabel>
                          <Select
                            labelId="language-select-label"
                            id="language-select"
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                            label="اللغة"
                          >
                            <MenuItem value="ar">العربية</MenuItem>
                            <MenuItem value="en">English</MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <StyledCard>
                      <CardHeader 
                        title="إعدادات حفظ البيانات" 
                        titleTypographyProps={{ fontWeight: 600 }}
                        avatar={<StorageIcon color="primary" />}
                      />
                      <Divider />
                      <CardContent>
                        <List sx={{ pt: 0 }}>
                          <ListItem>
                            <ListItemIcon>
                              <DataUsageIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="ضغط البيانات" 
                              secondary="تقليل حجم البيانات المخزنة" 
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={settings.dataCompression}
                                onChange={(e) => handleSettingChange('dataCompression', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <Divider variant="inset" component="li" />
                          
                          <ListItem>
                            <ListItemIcon>
                              <CloudUploadIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="حفظ تلقائي" 
                              secondary="حفظ التغييرات تلقائياً" 
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={settings.autoSave}
                                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <Divider variant="inset" component="li" />
                          
                          <ListItem>
                            <ListItemIcon>
                              <CloudDownloadIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="نسخ احتياطي تلقائي" 
                              secondary="عمل نسخة احتياطية تلقائية من البيانات" 
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={settings.autoBackup}
                                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        </List>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <StyledCard>
                      <CardHeader 
                        title="إعدادات الاحتفاظ بالبيانات" 
                        titleTypographyProps={{ fontWeight: 600 }}
                        avatar={<DeleteOutlineIcon color="primary" />}
                      />
                      <Divider />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          تحديد المدة التي يتم الاحتفاظ بالبيانات فيها قبل حذفها تلقائياً
                        </Typography>
                        
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="retention-select-label">مدة الاحتفاظ بالبيانات</InputLabel>
                          <Select
                            labelId="retention-select-label"
                            id="retention-select"
                            value={settings.dataRetentionDays}
                            onChange={(e) => handleSettingChange('dataRetentionDays', e.target.value)}
                            label="مدة الاحتفاظ بالبيانات"
                          >
                            <MenuItem value={30}>30 يوم</MenuItem>
                            <MenuItem value={60}>60 يوم</MenuItem>
                            <MenuItem value={90}>90 يوم</MenuItem>
                            <MenuItem value={180}>180 يوم</MenuItem>
                            <MenuItem value={365}>سنة</MenuItem>
                            <MenuItem value={730}>سنتين</MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Appearance Settings Tab */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <StyledCard>
                      <CardHeader 
                        title="المظهر العام" 
                        titleTypographyProps={{ fontWeight: 600 }}
                        avatar={<FormatPaintIcon color="primary" />}
                      />
                      <Divider />
                      <CardContent>
                        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                          <InputLabel id="theme-select-label">وضع العرض</InputLabel>
                          <Select
                            labelId="theme-select-label"
                            id="theme-select"
                            value={settings.theme}
                            onChange={(e) => handleSettingChange('theme', e.target.value)}
                            label="وضع العرض"
                          >
                            <MenuItem value="light">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LightModeIcon sx={{ mr: 1 }} />
                                <Typography>فاتح</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="dark">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DarkModeIcon sx={{ mr: 1 }} />
                                <Typography>داكن</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="system">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SettingsIcon sx={{ mr: 1 }} />
                                <Typography>حسب إعدادات النظام</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <StyledCard>
                      <CardHeader 
                        title="الألوان" 
                        titleTypographyProps={{ fontWeight: 600 }}
                        avatar={<PaletteIcon color="primary" />}
                      />
                      <Divider />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          اختر اللون الرئيسي للتطبيق
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {colorOptions.map((color) => (
                            <Box 
                              key={color.value} 
                              sx={{ textAlign: 'center' }}
                            >
                              <ColorBox 
                                sx={{ 
                                  backgroundColor: color.value,
                                  mx: 'auto',
                                }}
                                className={settings.primaryColor === color.value ? 'selected' : ''}
                                onClick={() => handleColorChange(color.value)}
                              />
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                {color.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Notifications Settings Tab */}
              <TabPanel value={tabValue} index={2}>
                <StyledCard>
                  <CardHeader 
                    title="إعدادات الإشعارات" 
                    titleTypographyProps={{ fontWeight: 600 }}
                    avatar={<NotificationsIcon color="primary" />}
                  />
                  <Divider />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <NotificationsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="إشعارات النظام" 
                          secondary="تفعيل إشعارات النظام" 
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={settings.notificationsEnabled}
                            onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <Divider variant="inset" component="li" />
                      
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="إشعارات البريد الإلكتروني" 
                          secondary="تلقي الإشعارات عبر البريد الإلكتروني" 
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                            disabled={!settings.notificationsEnabled}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </StyledCard>
              </TabPanel>

              {/* Privacy & Security Tab */}
              <TabPanel value={tabValue} index={3}>
                <StyledCard>
                  <CardHeader 
                    title="إعدادات الأمان" 
                    titleTypographyProps={{ fontWeight: 600 }}
                    avatar={<SecurityIcon color="primary" />}
                  />
                  <Divider />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <SecurityIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="تفعيل المصادقة الثنائية" 
                          secondary="زيادة مستوى أمان حسابك باستخدام المصادقة الثنائية" 
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <Divider variant="inset" component="li" />
                      
                      <ListItem>
                        <ListItemIcon>
                          <LockIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="تغيير كلمة المرور" 
                          secondary="قم بتغيير كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك" 
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => navigate('/profile')}
                            sx={{ borderRadius: 2 }}
                          >
                            تغيير
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </StyledCard>
              </TabPanel>
            </Paper>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Settings; 