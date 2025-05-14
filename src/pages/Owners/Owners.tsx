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
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabaseOwnersApi, SupabaseOwner } from '../../services/ownersApi';
import { palette } from '../../theme/palette';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  StatCard,
} from '../../components/responsive';

const Owners: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<SupabaseOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Owner form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [currentOwner, setCurrentOwner] = useState<SupabaseOwner | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch owners on mount
  useEffect(() => {
    fetchOwners();
  }, []);

  // Fetch owners
  const fetchOwners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create filter parameters
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;

      const response = await supabaseOwnersApi.getAll(params);
      setOwners(response.data);
    } catch (err) {
      console.error('Error fetching owners:', err);
      setError('حدث خطأ أثناء تحميل بيانات المُلاك. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle owner deletion
  const handleDeleteOwner = async () => {
    if (!ownerToDelete) return;

    try {
      setIsDeleting(true);
      await supabaseOwnersApi.delete(ownerToDelete);

      // Update the owners list
      setOwners(owners.filter(owner => owner.id !== ownerToDelete));

      // Close dialog
      setDeleteDialogOpen(false);
      setOwnerToDelete(null);
    } catch (err) {
      console.error('Error deleting owner:', err);
      setError('حدث خطأ أثناء حذف المالك. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (id: string) => {
    setOwnerToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Open form dialog for adding a new owner
  const openAddDialog = () => {
    setCurrentOwner({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setFormDialogOpen(true);
    setFormError(null);
  };

  // Open form dialog for editing an owner
  const openEditDialog = (owner: SupabaseOwner) => {
    setCurrentOwner(owner);
    setFormDialogOpen(true);
    setFormError(null);
  };

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (currentOwner) {
      setCurrentOwner({
        ...currentOwner,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOwner) return;

    // Validate form
    if (!currentOwner.name || !currentOwner.phone) {
      setFormError('يرجى ملء الحقول المطلوبة (الاسم ورقم الهاتف)');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      if (currentOwner.id) {
        // Update existing owner
        const response = await supabaseOwnersApi.update(currentOwner.id, currentOwner);
        
        // Update the owner in the list
        setOwners(owners.map(owner => 
          owner.id === currentOwner.id ? response.data : owner
        ));
      } else {
        // Create new owner
        const response = await supabaseOwnersApi.create(currentOwner);
        
        // Add the new owner to the list
        setOwners([response.data, ...owners]);
      }

      // Close dialog
      setFormDialogOpen(false);
      setCurrentOwner(null);
    } catch (err) {
      console.error('Error saving owner:', err);
      setFormError('حدث خطأ أثناء حفظ بيانات المالك. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  // View owner properties
  const viewOwnerProperties = (ownerId: string) => {
    navigate(`/owners/${ownerId}`);
  };

  // Calculate owner statistics
  const ownerStats = useMemo(() => {
    return {
      totalOwners: owners.length,
    };
  }, [owners]);

  // Get paginated owners
  const paginatedOwners = owners.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Layout title="المُلاك">
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
                title="إجمالي المُلاك"
                value={ownerStats.totalOwners}
                icon={<PersonIcon />}
                color={palette.primary.main}
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
              تصفية المُلاك
            </Typography>

            <Box>
              <Tooltip title="تحديث البيانات">
                <span>
                  <IconButton
                    onClick={fetchOwners}
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
                startIcon={<AddIcon />}
                onClick={openAddDialog}
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
                إضافة مالك جديد
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="بحث"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث باسم المالك أو رقم الهاتف"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => {
                        setSearchQuery('');
                        fetchOwners();
                      }}>
                        <RefreshIcon />
                      </IconButton>
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
          </Grid>
        </Paper>

        {/* Owners Table */}
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
              <PersonIcon sx={{ mr: 1, color: palette.primary.main }} />
              قائمة المُلاك
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {owners.length > 0 ? `إجمالي المُلاك: ${owners.length}` : ''}
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
            ) : paginatedOwners.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  لا يوجد مُلاك
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  لم يتم العثور على أي مُلاك مطابقين لمعايير البحث
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ backgroundColor: `${palette.primary.main}08` }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>اسم المالك</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>رقم الهاتف</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>البريد الإلكتروني</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>العنوان</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOwners.map((owner) => (
                    <TableRow
                      key={owner.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: `${palette.primary.main}05`,
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              mr: 2,
                              bgcolor: `${palette.primary.main}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <PersonIcon color="primary" fontSize="small" />
                          </Box>
                          {owner.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {owner.phone}
                        </Box>
                      </TableCell>
                      <TableCell>{owner.email || '-'}</TableCell>
                      <TableCell>{owner.address || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title="عرض العقارات">
                          <IconButton
                            color="info"
                            onClick={() => viewOwnerProperties(owner.id!)}
                            sx={{ backgroundColor: `${palette.info.main}15`, mr: 1 }}
                          >
                            <HomeIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل المالك">
                          <IconButton
                            color="primary"
                            onClick={() => openEditDialog(owner)}
                            sx={{ backgroundColor: `${palette.primary.main}15`, mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف المالك">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog(owner.id!)}
                            sx={{ backgroundColor: `${palette.error.main}15` }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={owners.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="المُلاك في الصفحة:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            sx={{ borderTop: '1px solid #e0e0e0' }}
          />
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من رغبتك في حذف هذا المالك؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              color="primary"
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteOwner}
              color="error"
              disabled={isDeleting}
              variant="contained"
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Owner Form Dialog */}
        <Dialog
          open={formDialogOpen}
          onClose={() => !isSaving && setFormDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{currentOwner?.id ? 'تعديل المالك' : 'إضافة مالك جديد'}</DialogTitle>
          <form onSubmit={handleFormSubmit}>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <Grid container spacing={2}>
                {/* Name */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="اسم المالك"
                    name="name"
                    value={currentOwner?.name || ''}
                    onChange={handleFormChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Phone */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="رقم الهاتف"
                    name="phone"
                    value={currentOwner?.phone || ''}
                    onChange={handleFormChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="البريد الإلكتروني"
                    name="email"
                    type="email"
                    value={currentOwner?.email || ''}
                    onChange={handleFormChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="العنوان"
                    name="address"
                    value={currentOwner?.address || ''}
                    onChange={handleFormChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="ملاحظات"
                    name="notes"
                    value={currentOwner?.notes || ''}
                    onChange={handleFormChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={() => setFormDialogOpen(false)}
                color="primary"
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Owners;
