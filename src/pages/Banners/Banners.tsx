import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  Link as LinkIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Image as ImageIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { supabseBannersApi, SupabaseBanner } from '../../services/bannersApi';
import BannerForm from './BannerForm';

const Banners: React.FC = () => {
  const [banners, setBanners] = useState<SupabaseBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<SupabaseBanner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);

  // Use useCallback to memoize the fetchBanners function
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create filter parameters
      const params: Record<string, any> = {};
      if (activeFilter !== null) params.isActive = activeFilter;

      const response = await supabseBannersApi.getAll(params);
      setBanners(response.data);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('حدث خطأ أثناء تحميل البانرات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]); // Add activeFilter as dependency

  // Fetch banners on mount and when filters change
  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]); // Add fetchBanners as dependency

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle form open/close
  const handleOpenForm = (banner?: SupabaseBanner) => {
    setSelectedBanner(banner || null);
    setFormOpen(true);
  };

  const handleCloseForm = (refresh?: boolean) => {
    setFormOpen(false);
    setSelectedBanner(null);
    if (refresh) {
      fetchBanners();
    }
  };

  // Handle delete banner
  const handleDeleteBanner = async () => {
    if (bannerToDelete === null) return;

    try {
      setLoading(true);
      await supabseBannersApi.delete(bannerToDelete);
      setBanners(banners.filter(banner => banner.id !== bannerToDelete));
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError('حدث خطأ أثناء حذف البانر. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (id: number) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle changing banner order
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    
    try {
      const currentBanner = banners[index];
      const prevBanner = banners[index - 1];
      
      // Swap order_index values
      await supabseBannersApi.update(currentBanner.id!, { order_index: prevBanner.order_index });
      await supabseBannersApi.update(prevBanner.id!, { order_index: currentBanner.order_index });
      
      // Refresh banners
      fetchBanners();
    } catch (err) {
      console.error('Error updating banner order:', err);
      setError('حدث خطأ أثناء تحديث ترتيب البانر. يرجى المحاولة مرة أخرى.');
    }
  };
  
  const handleMoveDown = async (index: number) => {
    if (index >= banners.length - 1) return;
    
    try {
      const currentBanner = banners[index];
      const nextBanner = banners[index + 1];
      
      // Swap order_index values
      await supabseBannersApi.update(currentBanner.id!, { order_index: nextBanner.order_index });
      await supabseBannersApi.update(nextBanner.id!, { order_index: currentBanner.order_index });
      
      // Refresh banners
      fetchBanners();
    } catch (err) {
      console.error('Error updating banner order:', err);
      setError('حدث خطأ أثناء تحديث ترتيب البانر. يرجى المحاولة مرة أخرى.');
    }
  };

  // Paginate banners
  const paginatedBanners = banners.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Layout title="البانرات">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            البانرات
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            إضافة بانر جديد
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={activeFilter === true}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActiveFilter(true);
                      } else if (activeFilter === true) {
                        setActiveFilter(null);
                      } else {
                        setActiveFilter(false);
                      }
                    }}
                  />
                }
                label="البانرات النشطة فقط"
                sx={{ ml: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchBanners}
              >
                تحديث
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Banners Display - Card View */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Grid>
            ) : paginatedBanners.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <PhotoLibraryIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6">لا توجد بانرات</Typography>
                  <Typography variant="body2" color="text.secondary">
                    قم بإضافة بانر جديد لعرضه هنا
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              paginatedBanners.map((banner, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={banner.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    } 
                  }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={banner.image_url || "https://via.placeholder.com/400x200?text=Banner+Image"}
                        alt={banner.title || "بانر"}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <Chip 
                          label={banner.is_active ? "نشط" : "غير نشط"}
                          color={banner.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {banner.title || "بدون عنوان"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mt: 1,
                        height: '40px'
                      }}>
                        {banner.description || "بدون وصف"}
                      </Typography>
                      {banner.action_url && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                          <LinkIcon fontSize="small" color="primary" />
                          <Typography variant="body2" color="primary" noWrap>
                            {banner.action_url}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                      <Box>
                        <Tooltip title="تحرير">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenForm(banner)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleOpenDeleteDialog(banner.id!)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box>
                        <Tooltip title="تحريك لأعلى">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="تحريك لأسفل">
                          <span>
                            <IconButton 
                              size="small" 
                              onClick={() => handleMoveDown(index)}
                              disabled={index === paginatedBanners.length - 1}
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>

        {/* Pagination */}
        {!loading && banners.length > 0 && (
          <TablePagination
            component="div"
            count={banners.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="البانرات في الصفحة:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
          />
        )}

        {/* Banner Form Dialog */}
        <BannerForm
          open={formOpen}
          banner={selectedBanner}
          onClose={handleCloseForm}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-dialog-title"
        >
          <DialogTitle id="delete-dialog-title">
            حذف البانر
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من رغبتك في حذف هذا البانر؟ لا يمكن التراجع عن هذه العملية.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              إلغاء
            </Button>
            <Button onClick={handleDeleteBanner} color="error" variant="contained">
              حذف
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default Banners; 