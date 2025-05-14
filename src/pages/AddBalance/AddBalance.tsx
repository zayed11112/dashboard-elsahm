import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Avatar,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Add as AddIcon,
  MonetizationOn as MonetizationOnIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import { palette } from '../../theme/palette';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  orderBy, 
  limit,
  addDoc,
  DocumentData,
  QueryDocumentSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User } from '../../firebase/services/firestore';

// تنسيق العملة بالأرقام الإنجليزية
const formatCurrency = (amount: number) => {
  // استخدام تنسيق en-US للحصول على أرقام إنجليزية
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // تنسيق الرقم وإضافة رمز الجنيه
  return formatter.format(amount) + ' جنيه';
};

// تنسيق التاريخ بالميلادي
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'غير محدد';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

const AddBalance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // البحث عن المستخدمين
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setError('يرجى إدخال اسم أو بريد إلكتروني أو رقم هوية طالب للبحث');
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      setSuccess(null);
      
      // إنشاء الاستعلامات المتعددة
      const nameQuery = query(
        collection(db, 'users'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '>=', searchQuery),
        where('email', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );

      const studentIdQuery = query(
        collection(db, 'users'),
        where('studentId', '>=', searchQuery),
        where('studentId', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );

      // تنفيذ الاستعلامات
      const [nameSnapshot, emailSnapshot, studentIdSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery),
        getDocs(studentIdQuery)
      ]);

      // جمع النتائج مع تجنب التكرار
      const userResults: User[] = [];
      const userIds = new Set<string>();

      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          if (!userIds.has(doc.id)) {
            userIds.add(doc.id);
            userResults.push({ id: doc.id, ...doc.data() } as User);
          }
        });
      };

      processSnapshot(nameSnapshot);
      processSnapshot(emailSnapshot);
      processSnapshot(studentIdSnapshot);

      setUsers(userResults);
      
      if (userResults.length === 0) {
        setError('لم يتم العثور على مستخدمين بهذه المعلومات');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى');
    } finally {
      setSearchLoading(false);
    }
  };

  // اختيار مستخدم
  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUsers([]);
    setSearchQuery(''); // إعادة تعيين البحث بعد الاختيار
  };

  // جلب آخر المعاملات
  const fetchRecentTransactions = async () => {
    try {
      const transactionsRef = collection(db, 'balance_transactions');
      const q = query(transactionsRef, orderBy('timestamp', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const transactions = [];
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // جلب معلومات المستخدم
        let userName = 'مستخدم غير معروف';
        if (data.userId) {
          const userDocRef = doc(db, 'users', data.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userName = userData.name || userName;
          }
        }
        
        transactions.push({
          id: docSnapshot.id,
          ...data,
          userName
        });
      }
      
      setRecentTransactions(transactions);
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
    }
  };

  // إضافة رصيد للمستخدم
  const addBalance = async () => {
    if (!selectedUser || !selectedUser.id) {
      setError('يرجى اختيار مستخدم أولاً');
      return;
    }

    if (!amount || amount <= 0) {
      setError('يرجى إدخال مبلغ صالح (أكبر من صفر)');
      return;
    }

    setConfirmDialogOpen(false);
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // تحديث وثيقة المستخدم
      const userRef = doc(db, 'users', selectedUser.id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('المستخدم غير موجود');
      }
      
      const userData = userSnap.data();
      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amount;
      
      // تحديث الرصيد
      await updateDoc(userRef, { balance: newBalance });
      
      // إضافة سجل المعاملة
      const transactionRef = collection(db, 'balance_transactions');
      await addDoc(transactionRef, {
        userId: selectedUser.id,
        amount,
        previousBalance: currentBalance,
        newBalance,
        timestamp: new Date(),
        adminName: 'Admin', // يمكن تغيير هذا لاستخدام اسم المدير الفعلي
        type: 'deposit'
      });
      
      // تحديث المستخدم المحدد بالرصيد الجديد
      setSelectedUser({
        ...selectedUser,
        balance: newBalance
      });
      
      setSuccess(`تم إضافة ${formatCurrency(amount)} بنجاح. الرصيد الجديد: ${formatCurrency(newBalance)}`);
      setAmount(0);
      
      // تحديث قائمة المعاملات الأخيرة
      fetchRecentTransactions();
    } catch (err) {
      console.error('Error adding balance:', err);
      setError('حدث خطأ أثناء إضافة الرصيد. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // حذف معاملة
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      // حذف المعاملة من Firestore
      const transactionRef = doc(db, 'balance_transactions', transactionToDelete);
      await deleteDoc(transactionRef);
      
      // تحديث قائمة المعاملات
      setRecentTransactions(prevTransactions => 
        prevTransactions.filter(t => t.id !== transactionToDelete)
      );
      
      setTransactionToDelete(null);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('حدث خطأ أثناء حذف المعاملة');
    } finally {
      setDeleteLoading(false);
    }
  };

  // فتح مربع حوار تأكيد الحذف
  const openDeleteDialog = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  // تنفيذ البحث عند الضغط على Enter
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      searchUsers();
    }
  };

  // تحميل آخر المعاملات عند تحميل الصفحة
  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  return (
    <Layout title="إضافة رصيد">
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default' }}>
        {/* بطاقة البحث عن المستخدم */}
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 3, 
            overflow: 'visible',
            boxShadow: '0 6px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography 
              variant="h5" 
              component="h2" 
              fontWeight="700" 
              color="primary.main" 
              mb={3}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                '&::before': {
                  content: '""',
                  display: 'block',
                  width: '4px',
                  height: '24px',
                  backgroundColor: 'primary.main',
                  borderRadius: '4px'
                }
              }}
            >
              البحث عن مستخدم وإضافة رصيد
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ابحث باسم المستخدم أو البريد الإلكتروني أو رقم هوية الطالب"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, py: 0.5 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={searchUsers}
                  disabled={searchLoading}
                  startIcon={searchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(25, 118, 210, 0.35)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {searchLoading ? 'جاري البحث...' : 'بحث'}
                </Button>
              </Grid>
            </Grid>

            {/* عرض نتائج البحث */}
            {users.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="600" 
                  mb={2}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'text.primary' 
                  }}
                >
                  <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                  نتائج البحث ({users.length})
                </Typography>
                <Paper 
                  sx={{ 
                    maxHeight: '350px', 
                    overflow: 'auto', 
                    borderRadius: 3,
                    boxShadow: '0 3px 14px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'background.neutral' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>المستخدم</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>البريد الإلكتروني</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>رقم الهوية</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>الرصيد الحالي</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  src={user.avatarUrl}
                                  sx={{ 
                                    mr: 2, 
                                    bgcolor: palette.primary.main,
                                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)'
                                  }}
                                >
                                  {user.name?.charAt(0) || <PersonIcon />}
                                </Avatar>
                                <Typography variant="body1" fontWeight={500}>{user.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.studentId || 'غير متوفر'}</TableCell>
                            <TableCell>
                              <Typography 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: user.balance ? 'success.main' : 'text.secondary',
                                  display: 'flex',
                                  alignItems: 'center',
                                  direction: 'ltr'
                                }}
                              >
                                {user.balance !== undefined 
                                  ? formatCurrency(user.balance) 
                                  : 'غير متوفر'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => selectUser(user)}
                                startIcon={<AddIcon />}
                                sx={{
                                  borderRadius: 2,
                                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.15)',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                اختيار
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3, 
                  borderRadius: 2,
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.06)'
                }}
              >
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* بطاقة إضافة الرصيد للمستخدم المختار */}
        {selectedUser && (
          <Card 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              boxShadow: '0 6px 32px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                p: 2.5, 
                backgroundImage: palette.gradients.primary,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <AccountBalanceWalletIcon />
              <Typography variant="h6" fontWeight="600">
                إضافة رصيد للمستخدم
              </Typography>
            </Box>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'center', md: 'flex-start' },
                  mb: 4,
                  gap: { xs: 2, md: 3 },
                  bgcolor: 'background.neutral',
                  p: 3,
                  borderRadius: 3
                }}
              >
                <Avatar
                  src={selectedUser.avatarUrl}
                  sx={{ 
                    width: { xs: 70, md: 90 }, 
                    height: { xs: 70, md: 90 }, 
                    mr: { xs: 0, md: 3 },
                    mb: { xs: 1, md: 0 },
                    bgcolor: palette.primary.main,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                    border: '3px solid white'
                  }}
                >
                  {selectedUser.name?.charAt(0) || <PersonIcon fontSize="large" />}
                </Avatar>
                <Box sx={{ 
                  textAlign: { xs: 'center', md: 'left' },
                  flexGrow: 1
                }}>
                  <Typography variant="h5" fontWeight="700">
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedUser.email} {selectedUser.studentId && `(${selectedUser.studentId})`}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 2,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', md: 'flex-start' }
                  }}>
                    <Chip 
                      label={selectedUser.status || 'طالب'} 
                      color="primary" 
                      size="small" 
                      sx={{ fontWeight: 500 }}
                    />
                    {selectedUser.faculty && (
                      <Chip 
                        label={selectedUser.faculty} 
                        color="secondary" 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                    {selectedUser.branch && (
                      <Chip 
                        label={selectedUser.branch} 
                        color="info" 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>
                </Box>
                <Box 
                  sx={{ 
                    ml: { xs: 0, md: 'auto' }, 
                    textAlign: 'center',
                    p: 2,
                    minWidth: { xs: '100%', md: '220px' },
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    الرصيد الحالي
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight="700" 
                    color="primary.main"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      direction: 'ltr'
                    }}
                  >
                    <MonetizationOnIcon sx={{ mr: 1, opacity: 0.7 }} />
                    {formatCurrency(selectedUser.balance || 0)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="المبلغ (EGP)"
                    type="number"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon color="primary" />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2, py: 0.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={loading || amount <= 0}
                    startIcon={loading ? <CircularProgress size={24} /> : <AddIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      boxShadow: '0 6px 14px rgba(25, 118, 210, 0.25)',
                      '&:hover': {
                        boxShadow: '0 8px 20px rgba(25, 118, 210, 0.35)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? 'جاري إضافة الرصيد...' : 'إضافة الرصيد'}
                  </Button>
                </Grid>
              </Grid>

              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 3, 
                    borderRadius: 2,
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {success}
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* آخر المعاملات */}
        <Card 
          sx={{ 
            mb: 2, 
            borderRadius: 3,
            boxShadow: '0 6px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
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
              آخر المعاملات
            </Typography>
            <IconButton 
              onClick={fetchRecentTransactions} 
              size="small"
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                '&:hover': { bgcolor: 'background.paper', transform: 'rotate(45deg)' },
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
          <CardContent sx={{ p: 0 }}>
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
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>المستخدم</TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold',
                      py: 2, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>المبلغ</TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold',
                      py: 2, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>الرصيد الجديد</TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold',
                      py: 2, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>التاريخ</TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold',
                      py: 2, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>المشرف</TableCell>
                    <TableCell align="center" sx={{ 
                      fontWeight: 'bold',
                      py: 2, 
                      color: 'text.primary',
                      fontSize: '0.875rem',
                      borderBottom: '2px solid rgba(25, 118, 210, 0.2)',
                    }}>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction, index) => (
                      <TableRow 
                        key={transaction.id} 
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
                        <TableCell sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5,
                          textAlign: 'center'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 0.5 
                          }}>
                            <Avatar 
                              src="/user.png"
                              alt={transaction.userName}
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                mb: 0.5,
                                boxShadow: '0 2px 6px rgba(25, 118, 210, 0.15)',
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              sx={{ 
                                lineHeight: 1.2,
                                color: 'text.primary',
                                textAlign: 'center'
                              }}
                            >
                              {transaction.userName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5
                        }}>
                          <Typography 
                            color="success.main" 
                            fontWeight="600"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5,
                              p: 0.5,
                              borderRadius: 1,
                              bgcolor: 'success.lighter',
                              width: 'fit-content',
                              mx: 'auto',
                              fontSize: '0.875rem',
                              direction: 'ltr'
                            }}
                          >
                            <AddIcon fontSize="small" />
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5,
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          direction: 'ltr'
                        }}>
                          {formatCurrency(transaction.newBalance)}
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5,
                          fontSize: '0.875rem'
                        }}>
                          <Box sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            bgcolor: 'background.neutral',
                            p: 0.7,
                            px: 1.5,
                            borderRadius: 2,
                            color: 'text.secondary',
                            fontSize: '0.8rem'
                          }}>
                            {formatDate(transaction.timestamp)}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5
                        }}>
                          <Chip 
                            label={transaction.adminName || 'غير معروف'} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ 
                          borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                          py: 1.5
                        }}>
                          <Tooltip title="حذف المعاملة" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(transaction.id)}
                              sx={{ 
                                bgcolor: 'error.lighter', 
                                '&:hover': { 
                                  bgcolor: 'error.light',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
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
                          <AccountBalanceWalletIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                          <Typography color="text.secondary" fontWeight={500}>
                            لا توجد معاملات حتى الآن
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            ستظهر معاملات إضافة الرصيد هنا عند إجرائها
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ mt: 2 }}
                            onClick={fetchRecentTransactions}
                            startIcon={<RefreshIcon />}
                          >
                            تحديث
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* حوار تأكيد إضافة الرصيد */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>تأكيد إضافة الرصيد</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ direction: 'rtl' }}>
            هل أنت متأكد من إضافة مبلغ <span style={{ direction: 'ltr', display: 'inline-block' }}>{formatCurrency(amount)}</span> لحساب المستخدم "<strong>{selectedUser?.name}</strong>"؟
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            color="inherit" 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={addBalance} 
            variant="contained" 
            color="primary" 
            autoFocus
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.25)',
              '&:hover': {
                boxShadow: '0 6px 18px rgba(25, 118, 210, 0.35)'
              }
            }}
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار تأكيد حذف المعاملة */}
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
        <DialogTitle sx={{ fontWeight: 600 }}>حذف المعاملة</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit" 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleDeleteTransaction} 
            variant="contained" 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={24} /> : <DeleteIcon />}
            autoFocus
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
    </Layout>
  );
};

export default AddBalance; 