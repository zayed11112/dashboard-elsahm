import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  CircularProgress,
  Badge,
  InputAdornment,
  TextField,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  VisibilityOutlined,
  CheckCircleOutline,
  HourglassEmpty,
  FiberNew,
  Refresh,
  Search,
  SortByAlpha,
  CalendarMonth,
  ClearAll,
  PersonOutline,
  ChatBubbleOutline,
  MoreHoriz,
  FilterAlt,
  Delete
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ar';
import { Complaint, fetchAllComplaints, fetchComplaintsByStatus, deleteComplaint } from '../../services/complaintsApi';
import Layout from '../../components/Layout';

// Set moment to use Arabic locale
moment.locale('ar');

// Status chip color mapping - Professional color scheme
const statusColors: Record<string, string> = {
  'open': 'info',
  'in-progress': 'warning',
  'closed': 'success'
};

// Status text mapping
const statusText: Record<string, string> = {
  'open': 'مفتوحة',
  'in-progress': 'قيد المعالجة',
  'closed': 'مغلقة'
};

// Status icon mapping
const statusIcons: Record<string, React.ReactElement> = {
  'open': <FiberNew fontSize="small" />,
  'in-progress': <HourglassEmpty fontSize="small" />,
  'closed': <CheckCircleOutline fontSize="small" />
};

// Custom professional color palette
const customColors = {
  primary: '#2c6ecb',
  primaryLight: '#eef4fc',
  primaryDark: '#164a9a',
  secondary: '#6e42c1',
  secondaryLight: '#f4effa',
  accent: '#5046e4',
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1',
  grey: '#f5f7fa',
  darkGrey: '#64748b',
  lightGrey: '#f8fafc',
  cardBorder: '#e2e8f0'
};

// TabPanel component for the tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`complaints-tabpanel-${index}`}
      aria-labelledby={`complaints-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ComplaintsPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [openComplaints, setOpenComplaints] = useState<Complaint[]>([]);
  const [inProgressComplaints, setInProgressComplaints] = useState<Complaint[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState(false);

  const navigate = useNavigate();

  // Fetch all complaints on component mount
  useEffect(() => {
    loadComplaints();
  }, []);

  // Load all complaints and categorize them
  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const allComplaints = await fetchAllComplaints();

      setComplaints(allComplaints);
      setOpenComplaints(allComplaints.filter(c => c.status === 'open'));
      setInProgressComplaints(allComplaints.filter(c => c.status === 'in-progress'));
      setClosedComplaints(allComplaints.filter(c => c.status === 'closed'));
    } catch (error) {
      console.error('Failed to load complaints', error);
      setError('فشل في تحميل الشكاوى، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Navigate to complaint details
  const handleViewComplaint = (complaintId: string) => {
    navigate(`/complaints/${complaintId}`);
  };

  // Fetch complaints by specific status
  const fetchByStatus = async (status: string) => {
    try {
      setLoading(true);
      const filteredComplaints = await fetchComplaintsByStatus(status);

      if (status === 'open') {
        setOpenComplaints(filteredComplaints);
      } else if (status === 'in-progress') {
        setInProgressComplaints(filteredComplaints);
      } else if (status === 'closed') {
        setClosedComplaints(filteredComplaints);
      }
    } catch (error) {
      console.error(`Failed to load ${status} complaints`, error);
      setError(`فشل في تحميل الشكاوى ${statusText[status]}`);
    } finally {
      setLoading(false);
    }
  };

  // Refresh the current tab data
  const refreshCurrentTab = () => {
    if (tabValue === 0) {
      fetchByStatus('open');
    } else if (tabValue === 1) {
      fetchByStatus('in-progress');
    } else {
      fetchByStatus('closed');
    }
  };

  // Get currently displayed complaints based on tab
  const getCurrentComplaints = () => {
    let currentComplaints: Complaint[];

    if (tabValue === 0) {
      currentComplaints = openComplaints;
    } else if (tabValue === 1) {
      currentComplaints = inProgressComplaints;
    } else {
      currentComplaints = closedComplaints;
    }

    return currentComplaints;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open':
        return customColors.info;
      case 'in-progress':
        return customColors.warning;
      case 'closed':
        return customColors.success;
      default:
        return customColors.primary;
    }
  };

  // Handle delete confirmation dialog
  const openDeleteDialog = (complaintId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setComplaintToDelete(complaintId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setComplaintToDelete(null);
  };

  // Handle deleting a complaint
  const handleDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    try {
      setDeletingComplaint(true);
      await deleteComplaint(complaintToDelete);

      // Update UI by removing the deleted complaint
      const updatedComplaints = complaints.filter(c => c.id !== complaintToDelete);
      setComplaints(updatedComplaints);

      // Update the appropriate status-specific list
      setOpenComplaints(prev => prev.filter(c => c.id !== complaintToDelete));
      setInProgressComplaints(prev => prev.filter(c => c.id !== complaintToDelete));
      setClosedComplaints(prev => prev.filter(c => c.id !== complaintToDelete));

      closeDeleteDialog();
    } catch (error) {
      console.error('Failed to delete complaint', error);
      // Could add error handling here
    } finally {
      setDeletingComplaint(false);
    }
  };

  // Render each complaint card
  const renderComplaintCard = (complaint: Complaint) => (
    <Card
      key={complaint.id}
      sx={{
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
        },
        overflow: 'hidden',
        border: `1px solid ${customColors.cardBorder}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}
    >
      <Box sx={{
        height: '5px',
        width: '100%',
        bgcolor: getStatusColor(complaint.status)
      }} />

      <CardHeader
        avatar={
          <Avatar sx={{
            width: 45,
            height: 45,
            bgcolor: alpha(getStatusColor(complaint.status), 0.8),
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}
          src="/user.png"
          >
            {complaint.userName?.charAt(0) || '؟'}
          </Avatar>
        }
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div" sx={{
              fontWeight: 600,
              fontSize: '1.05rem',
              color: '#334155'
            }}>
              {complaint.title}
            </Typography>
            <Chip
              icon={statusIcons[complaint.status]}
              label={statusText[complaint.status]}
              color={statusColors[complaint.status] as any}
              size="small"
              sx={{
                fontWeight: 'bold',
                borderRadius: '20px',
                boxShadow: `0 2px 5px ${alpha(getStatusColor(complaint.status), 0.2)}`,
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>
        }
        subheader={
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonOutline fontSize="small" sx={{ color: customColors.darkGrey }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {complaint.userName}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonth fontSize="small" sx={{ color: customColors.darkGrey }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {moment(complaint.createdAt).format('DD MMM YYYY - HH:mm')}
              </Typography>
            </Stack>
          </Box>
        }
      />

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      <CardContent sx={{ pt: 2, bgcolor: customColors.lightGrey }}>
        <Typography
          variant="body1"
          sx={{
            mb: 2,
            maxHeight: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            color: '#475569',
            lineHeight: 1.7,
            fontSize: '0.95rem'
          }}
        >
          {complaint.description}
        </Typography>
      </CardContent>

      <CardActions sx={{
        justifyContent: 'space-between',
        px: 2,
        pb: 2,
        bgcolor: customColors.lightGrey
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Badge
            badgeContent={complaint.responses.length}
            color="info"
            sx={{
              '& .MuiBadge-badge': {
                fontWeight: 'bold',
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px',
                bgcolor: complaint.responses.length > 0 ? customColors.primary : customColors.darkGrey
              }
            }}
          >
            <ChatBubbleOutline sx={{ color: customColors.darkGrey }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            الردود
          </Typography>
        </Stack>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<VisibilityOutlined />}
            onClick={() => handleViewComplaint(complaint.id)}
            size="small"
            sx={{
              borderRadius: '20px',
              px: 2,
              py: 0.8,
              fontWeight: 'bold',
              bgcolor: customColors.primary,
              color: 'white',
              boxShadow: `0 3px 8px ${alpha(customColors.primary, 0.3)}`,
              '&:hover': {
                bgcolor: customColors.primaryDark,
                boxShadow: `0 4px 12px ${alpha(customColors.primary, 0.4)}`,
              }
            }}
          >
            عرض التفاصيل
          </Button>

          <Tooltip title="حذف الشكوى">
            <IconButton
              size="small"
              onClick={(e) => openDeleteDialog(complaint.id, e)}
              sx={{
                bgcolor: alpha('#f44336', 0.1),
                color: '#f44336',
                '&:hover': {
                  bgcolor: alpha('#f44336', 0.2),
                }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );

  return (
    <Layout title="إدارة الشكاوى">
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 'bold' }}>
          تأكيد حذف الشكوى
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            هل أنت متأكد من رغبتك في حذف هذه الشكوى؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              fontWeight: 'medium'
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteComplaint}
            color="error"
            variant="contained"
            disabled={deletingComplaint}
            startIcon={deletingComplaint ? <CircularProgress size={20} color="inherit" /> : <Delete />}
            sx={{
              borderRadius: '12px',
              fontWeight: 'medium',
              bgcolor: '#f44336',
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            {deletingComplaint ? 'جاري الحذف...' : 'حذف الشكوى'}
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {/* Header with gradient background */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            mb: 3,
            background: `linear-gradient(120deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`,
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ p: 4, color: 'white' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    textShadow: '0px 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  إدارة الشكاوى
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                  يمكنك من هنا إدارة شكاوى المستخدمين والرد عليها بسهولة
                </Typography>
              </Grid>
              <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={loadComplaints}
                  sx={{
                    mt: { xs: 2, md: 0 },
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                    px: 3,
                    py: 1.2,
                    bgcolor: customColors.primary,
                    color: 'white',
                    fontWeight: 'bold',
                    border: `1px solid ${alpha(customColors.primary, 0.1)}`,
                    '&:hover': {
                      bgcolor: customColors.primaryDark,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }
                  }}
                >
                  تحديث الكل
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Main content card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
            border: `1px solid ${customColors.cardBorder}`
          }}
        >
          {/* Tabs & Filters Bar */}
          <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{
              backgroundColor: 'white',
              borderBottom: `1px solid ${customColors.cardBorder}`
            }}
          >
            <Toolbar sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              py: 1
            }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="complaints tabs"
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  width: '100%',
                  maxWidth: '600px',
                  mx: 'auto',
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '10px 10px 0 0',
                    bgcolor: customColors.primary
                  },
                  '& .Mui-selected': {
                    color: `${customColors.primary} !important`,
                  },
                  mb: { xs: 2, md: 0 },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'center'
                  }
                }}
              >
                <Tab
                  label={
                    <Badge badgeContent={openComplaints.length} color="info" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold', bgcolor: customColors.info } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, py: 1, borderRadius: '8px', border: `1px solid ${alpha(customColors.primary, 0.1)}` }}>
                        <FiberNew sx={{ mr: 1, fontSize: '1.2rem', color: customColors.info }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>مفتوحة</Typography>
                      </Box>
                    </Badge>
                  }
                  id="complaints-tab-0"
                  aria-controls="complaints-tabpanel-0"
                  sx={{ minHeight: '48px', px: 3 }}
                />
                <Tab
                  label={
                    <Badge badgeContent={inProgressComplaints.length} color="warning" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold', bgcolor: customColors.warning } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, py: 1, borderRadius: '8px', border: `1px solid ${alpha(customColors.primary, 0.1)}` }}>
                        <HourglassEmpty sx={{ mr: 1, fontSize: '1.2rem', color: customColors.warning }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>قيد المعالجة</Typography>
                      </Box>
                    </Badge>
                  }
                  id="complaints-tab-1"
                  aria-controls="complaints-tabpanel-1"
                  sx={{ minHeight: '48px', px: 3 }}
                />
                <Tab
                  label={
                    <Badge badgeContent={closedComplaints.length} color="success" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold', bgcolor: customColors.success } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, py: 1, borderRadius: '8px', border: `1px solid ${alpha(customColors.primary, 0.1)}` }}>
                        <CheckCircleOutline sx={{ mr: 1, fontSize: '1.2rem', color: customColors.success }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>مغلقة</Typography>
                      </Box>
                    </Badge>
                  }
                  id="complaints-tab-2"
                  aria-controls="complaints-tabpanel-2"
                  sx={{ minHeight: '48px', px: 3 }}
                />
              </Tabs>
            </Toolbar>
          </AppBar>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={5}>
                <CircularProgress sx={{ color: customColors.primary }} />
              </Box>
            ) : error ? (
              <Box textAlign="center" p={5}>
                <Typography color="error">{error}</Typography>
                <Button
                  onClick={refreshCurrentTab}
                  variant="outlined"
                  sx={{
                    mt: 2,
                    borderRadius: '12px',
                    borderColor: customColors.primary,
                    color: customColors.primary,
                    '&:hover': {
                      borderColor: customColors.primaryDark,
                      bgcolor: alpha(customColors.primary, 0.05)
                    }
                  }}
                >
                  إعادة المحاولة
                </Button>
              </Box>
            ) : getCurrentComplaints().length === 0 ? (
              <Box
                textAlign="center"
                p={5}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '250px',
                  bgcolor: customColors.grey
                }}
              >
                <FiberNew sx={{ fontSize: '4rem', color: alpha(customColors.info, 0.3), mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#475569' }}>لا توجد شكاوى مفتوحة حالياً</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3, bgcolor: customColors.grey }}>
                <Grid container spacing={3}>
                  {getCurrentComplaints().map(complaint => (
                    <Grid item xs={12} key={complaint.id}>
                      {renderComplaintCard(complaint)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={5}>
                <CircularProgress sx={{ color: customColors.primary }} />
              </Box>
            ) : error ? (
              <Box textAlign="center" p={5}>
                <Typography color="error">{error}</Typography>
                <Button
                  onClick={refreshCurrentTab}
                  variant="outlined"
                  sx={{
                    mt: 2,
                    borderRadius: '12px',
                    borderColor: customColors.primary,
                    color: customColors.primary
                  }}
                >
                  إعادة المحاولة
                </Button>
              </Box>
            ) : getCurrentComplaints().length === 0 ? (
              <Box
                textAlign="center"
                p={5}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '250px',
                  bgcolor: customColors.grey
                }}
              >
                <HourglassEmpty sx={{ fontSize: '4rem', color: alpha(customColors.warning, 0.3), mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#475569' }}>لا توجد شكاوى قيد المعالجة حالياً</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3, bgcolor: customColors.grey }}>
                <Grid container spacing={3}>
                  {getCurrentComplaints().map(complaint => (
                    <Grid item xs={12} key={complaint.id}>
                      {renderComplaintCard(complaint)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={5}>
                <CircularProgress sx={{ color: customColors.primary }} />
              </Box>
            ) : error ? (
              <Box textAlign="center" p={5}>
                <Typography color="error">{error}</Typography>
                <Button
                  onClick={refreshCurrentTab}
                  variant="outlined"
                  sx={{
                    mt: 2,
                    borderRadius: '12px',
                    borderColor: customColors.primary,
                    color: customColors.primary
                  }}
                >
                  إعادة المحاولة
                </Button>
              </Box>
            ) : getCurrentComplaints().length === 0 ? (
              <Box
                textAlign="center"
                p={5}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '250px',
                  bgcolor: customColors.grey
                }}
              >
                <CheckCircleOutline sx={{ fontSize: '4rem', color: alpha(customColors.success, 0.3), mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#475569' }}>لا توجد شكاوى مغلقة حالياً</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3, bgcolor: customColors.grey }}>
                <Grid container spacing={3}>
                  {getCurrentComplaints().map(complaint => (
                    <Grid item xs={12} key={complaint.id}>
                      {renderComplaintCard(complaint)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </Layout>
  );
};

export default ComplaintsPage;