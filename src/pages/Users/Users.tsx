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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  useTheme,
  Divider,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Apartment as ApartmentIcon,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { usersApi } from '../../services/api';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

// Define User type
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  avatarUrl?: string;
  faculty?: string;
  facultyEng?: string;
  branch?: string;
  batch?: string;
  studentId?: string;
  balance?: number;
}

// User roles
const userRoles = [
  { value: 'admin', label: 'مدير' },
  { value: 'user', label: 'مستخدم' },
];

// User status options
const userStatuses = [
  { value: 'طالب', label: 'طالب', color: 'primary' },
  { value: 'صاحب عقار', label: 'صاحب عقار', color: 'success' },
  { value: 'امتياز', label: 'امتياز', color: 'warning' },
  { value: 'وسيط', label: 'وسيط', color: 'info' },
];

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users on mount and when filters change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Create filter parameters
        const params: Record<string, any> = {};
        if (searchQuery) params.search = searchQuery;
        if (roleFilter) params.role = roleFilter;
        if (statusFilter) params.status = statusFilter;

        const response = await usersApi.getAll(params);
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('حدث خطأ أثناء تحميل المستخدمين. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      await usersApi.delete(userToDelete);

      // Update the users list
      setUsers(users.filter(user => user.id !== userToDelete));

      // Close dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('حدث خطأ أثناء حذف المستخدم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // Get user status color
  const getStatusColor = (status: string) => {
    const statusOption = userStatuses.find(s => s.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  // Get user status label
  const getStatusLabel = (status: string) => {
    const statusOption = userStatuses.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Get user role label
  const getRoleLabel = (role: string) => {
    const roleOption = userRoles.find(r => r.value === role);
    return roleOption ? roleOption.label : role;
  };

  // Get paginated users
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!users.length) return {
      totalUsers: 0,
      students: 0,
      owners: 0,
      totalBalance: 0
    };

    const students = users.filter(user => user.status === 'طالب').length;
    const owners = users.filter(user => user.status === 'صاحب عقار').length;
    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

    return {
      totalUsers: users.length,
      students,
      owners,
      totalBalance
    };
  }, [users]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} جنيه`;
  };

  // Refresh users data
  const refreshUsers = () => {
    setLoading(true);
    setError(null);

    const params: Record<string, any> = {};
    if (searchQuery) params.search = searchQuery;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;

    usersApi.getAll(params)
      .then(response => {
        setUsers(response.data);
      })
      .catch(err => {
        console.error('Error refreshing users:', err);
        setError('حدث خطأ أثناء تحديث بيانات المستخدمين. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Layout title="إدارة المستخدمين">
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
                title="إجمالي المستخدمين"
                value={userStats.totalUsers}
                icon={<PeopleIcon />}
                color={palette.primary.main}
                onClick={() => {
                  setStatusFilter('');
                  setRoleFilter('');
                }}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="الطلاب"
                value={userStats.students}
                icon={<SchoolIcon />}
                color={palette.info.main}
                onClick={() => setStatusFilter('طالب')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="أصحاب العقارات"
                value={userStats.owners}
                icon={<ApartmentIcon />}
                color={palette.success.main}
                onClick={() => setStatusFilter('صاحب عقار')}
              />
            </ResponsiveGrid>
            <ResponsiveGrid item xs={12} sm={6} md={3}>
              <StatCard
                title="إجمالي الرصيد"
                value={formatCurrency(userStats.totalBalance)}
                icon={<AccountBalanceIcon />}
                color={palette.secondary.main}
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
              تصفية المستخدمين
            </Typography>

            <Box>
              <Tooltip title="تحديث البيانات">
                <IconButton
                  onClick={refreshUsers}
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
                onClick={() => navigate('/users/new')}
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
                إضافة مستخدم جديد
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
                placeholder="البحث بالاسم أو البريد الإلكتروني أو الرقم الجامعي"
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
                <InputLabel>الصلاحية</InputLabel>
                <Select
                  value={roleFilter}
                  label="الصلاحية"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {userRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
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
                <InputLabel>نوع المستخدم</InputLabel>
                <Select
                  value={statusFilter}
                  label="نوع المستخدم"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">الكل</MenuItem>
                  {userStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
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
              <PeopleIcon sx={{ mr: 1, color: palette.primary.main }} />
              قائمة المستخدمين
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {users.length > 0 ? `إجمالي المستخدمين: ${users.length}` : ''}
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
            ) : users.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا يوجد مستخدمين
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي مستخدمين مطابقين لمعايير البحث
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                >
                  إعادة ضبط البحث
                </Button>
              </Box>
            ) : (
              <Table sx={{
                '& .MuiTableCell-root': {
                  borderColor: '#d0e3f7',
                  py: 2
                }
              }}>
                <TableHead sx={{
                  background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
                  '& .MuiTableCell-head': {
                    borderBottom: 'none',
                    py: 2.5
                  }
                }}>
                  <TableRow>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>المستخدم</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>البريد الإلكتروني</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>ID</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الكلية</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الفرع</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الدفعة</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الحالة </TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الرصيد</TableCell>
                    <TableCell sx={{ color: '#1e88e5', fontWeight: 'bold', fontSize: '1rem' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? `${palette.primary.main}05` : `${palette.primary.light}05`,
                        borderBottom: '1px solid #d0e3f7',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: `${palette.primary.light}15`,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              mr: 2,
                              background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.light} 100%)`,
                              width: 45,
                              height: 45,
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                              border: '2px solid white'
                            }}
                            src={user.avatarUrl}
                          >
                            {!user.avatarUrl && user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="bold">{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getRoleLabel(user.role)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.studentId || '-'}</TableCell>
                      <TableCell>{user.faculty || '-'}</TableCell>
                      <TableCell>{user.branch || '-'}</TableCell>
                      <TableCell>{user.batch || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.status || 'غير محدد'}
                          color={getStatusColor(user.status) as any}
                          size="small"
                          sx={{
                            fontWeight: 'bold',
                            px: 1,
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 'bold',
                            color: user.balance ? 'success.main' : 'text.disabled',
                            background: user.balance ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            display: 'inline-block',
                            px: 1,
                            py: 0.5
                          }}
                        >
                          {user.balance !== undefined ? `${user.balance.toLocaleString()} جنيه` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="تعديل المستخدم">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/users/${user.id}`)}
                            sx={{
                              backgroundColor: 'rgba(25, 118, 210, 0.1)',
                              mr: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.role === 'admin' ? 'لا يمكن حذف المدير' : 'حذف المستخدم'}>
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(user.id)}
                              disabled={user.role === 'admin'} // Prevent deleting admins
                              sx={{
                                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: 'rgba(211, 47, 47, 0.2)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Pagination */}
          <Box sx={{
            borderTop: '2px solid #d0e3f7',
            background: `linear-gradient(135deg, ${palette.primary.main}15 0%, ${palette.primary.light}15 100%)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 1
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
              {users.length > 0 ? `عرض ${page * rowsPerPage + 1} إلى ${Math.min((page + 1) * rowsPerPage, users.length)} من إجمالي ${users.length} مستخدم` : ''}
            </Typography>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="عدد المستخدمين في الصفحة:"
              labelDisplayedRows={() => ''}
              sx={{
                '.MuiTablePagination-toolbar': {
                  pr: 0,
                },
                '.MuiTablePagination-selectLabel': {
                  fontWeight: 'bold',
                  color: 'text.primary'
                },
                '.MuiTablePagination-select': {
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  borderRadius: 1,
                  border: '1px solid #eee',
                  py: 0.5,
                  px: 1
                },
                '.MuiTablePagination-actions': {
                  '.MuiIconButton-root': {
                    backgroundColor: 'white',
                    border: '1px solid #eee',
                    borderRadius: 1,
                    mx: 0.5,
                    '&:hover': {
                      backgroundColor: `${palette.primary.main}15`,
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      backgroundColor: '#f5f5f5'
                    }
                  }
                }
              }}
            />
          </Box>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              maxWidth: 450,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{
            background: `linear-gradient(135deg, ${palette.error.main} 0%, ${palette.error.dark} 100%)`,
            color: 'white',
            py: 2.5,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}>
            <DeleteIcon sx={{ mr: 1.5, fontSize: 28 }} />
            تأكيد الحذف
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'error.light',
                  mb: 2
                }}
              >
                <DeleteIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Avatar>
            </Box>
            <DialogContentText sx={{ textAlign: 'center' }}>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟
              <br />
              سيتم حذف جميع بياناته وحجوزاته.
              <Box component="div" sx={{
                color: 'error.main',
                fontWeight: 'bold',
                display: 'block',
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: 'error.light',
                border: '1px solid',
                borderColor: 'error.main',
                fontSize: '0.9rem'
              }}>
                تحذير: هذا الإجراء لا يمكن التراجع عنه!
              </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              color="primary"
              disabled={isDeleting}
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteUser}
              color="error"
              disabled={isDeleting}
              variant="contained"
              size="large"
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: 'bold',
                backgroundImage: `linear-gradient(135deg, ${palette.error.main} 0%, ${palette.error.dark} 100%)`,
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
                }
              }}
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Users;