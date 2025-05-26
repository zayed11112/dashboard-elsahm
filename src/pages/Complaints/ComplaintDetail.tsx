import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Tooltip,
  Badge,
  CardMedia,
  AppBar,
  Toolbar,
  LinearProgress,
  useTheme,
  alpha,
  InputAdornment,
  GlobalStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Send,
  MoreVert,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  FiberNew,
  CheckCircleOutline,
  Person,
  SupervisorAccount,
  Close,
  AddPhotoAlternate,
  AttachFile,
  ChatBubbleOutline,
  Schedule,
  PermIdentity,
  Title,
  Description,
  EditNote,
  Delete,
  Refresh,
  Notifications as NotificationsIcon,
  Autorenew as AutorenewIcon,
  AccountBalance as AccountBalanceIcon,
  CreditScore as CreditScoreIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ar';
import {
  Complaint,
  fetchComplaintById,
  updateComplaintStatus,
  addAdminResponse,
  deleteComplaint
} from '../../services/complaintsApi';
import { uploadImage } from '../../utils/imageUploader';
import Layout from '../../components/Layout';
import { addDoc, collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

// CSS Animation for new message alert
const slideInAnimation = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// OneSignal Configuration
const ONESIGNAL_APP_ID = '3136dbc6-c09c-4bca-b0aa-fe35421ac513';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_ge3nxrwatrf4vmfk7y2uegwfcoh7sdj2pttujimbv2rz3di7wkuasxw76ylt66ecvgc65sx4fuikh2dph23tq66ryq2gdog47mzg2ja';

// دالة لإرسال إشعار عبر OneSignal
const sendOneSignalNotification = async (
  userId: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
) => {
  try {
    console.log('Sending OneSignal notification to user:', userId);

    // تطهير معرف المستخدم من أي مسافات زائدة
    const cleanUserId = userId.trim();

    // تبسيط الطلب للتركيز على العناصر الأساسية فقط
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [cleanUserId],
      headings: { en: title },
      contents: { en: message },
      data: data,
      // إزالة الإعدادات الإضافية التي قد تسبب مشاكل
      priority: 10
    };

    console.log('OneSignal simplified payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('OneSignal API full response:', JSON.stringify(result, null, 2));

    // تحليل الاستجابة لمعرفة ما إذا كان الإرسال ناجحاً
    if (!response.ok) {
      console.error('OneSignal API error status:', response.status);
      if (result.errors) {
        console.error('OneSignal API detailed errors:', result.errors);
        throw new Error(`OneSignal API errors: ${JSON.stringify(result.errors)}`);
      } else {
        throw new Error(`OneSignal API HTTP Error: ${response.status}`);
      }
    }

    if (result.recipients === 0) {
      console.warn('Warning: No recipients received the notification. User may not have the app installed or token might be invalid.');
    } else {
      console.log(`Successfully sent to ${result.recipients} recipients`);
    }

    return result;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    throw error;
  }
};

// Set moment to use Arabic locale
moment.locale('ar');

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
  error: '#d32f2f',
  grey: '#f5f7fa',
  darkGrey: '#64748b',
  lightGrey: '#f8fafc',
  cardBorder: '#e2e8f0',
  textPrimary: '#334155',
  textSecondary: '#475569'
};

// Global styles for specific classes
const globalStyles = {
  '.muirtl-70qvj9': {
    color: 'white !important',
    '& h6, & p, & span': {
      color: 'white !important'
    }
  },
  '.muirtl-9xphd9-MuiTypography-root': {
    color: 'white !important'
  },
  '.muirtl-p440nd': {
    marginTop: '0 !important',
    paddingTop: '0 !important'
  },
  '.MuiChip-label': {
    color: 'black !important'
  }
};

// Status text mapping
const statusText: Record<string, string> = {
  'open': 'مفتوحة',
  'in-progress': 'قيد المعالجة',
  'closed': 'مغلقة'
};

// Status color mapping
const statusColors: Record<string, string> = {
  'open': 'info',
  'in-progress': 'warning',
  'closed': 'success'
};

// Status icon mapping
const statusIcons: Record<string, React.ReactElement> = {
  'open': <FiberNew fontSize="small" />,
  'in-progress': <HourglassEmpty fontSize="small" />,
  'closed': <CheckCircleOutline fontSize="small" />
};

// Get status color
const getStatusColor = (status: string): string => {
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

const ComplaintDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [inAppNotificationDialogOpen, setInAppNotificationDialogOpen] = useState(false);
  const [pushNotificationDialogOpen, setPushNotificationDialogOpen] = useState(false);
  const [combinedNotificationDialogOpen, setCombinedNotificationDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // حالة النافذة المنبثقة لإضافة الرصيد
  const [addBalanceDialogOpen, setAddBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNotes, setBalanceNotes] = useState('');
  const [addingBalance, setAddingBalance] = useState(false);

  // Load complaint details
  useEffect(() => {
    if (id) {
      loadComplaintDetails(id);
    }
  }, [id]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (complaint && !loading) {
      scrollToBottom();
    }
  }, [complaint, loading]);

  // Auto-refresh messages
  useEffect(() => {
    if (autoRefresh && id && complaint) {
      intervalRef.current = setInterval(async () => {
        try {
          const updatedComplaint = await fetchComplaintById(id);
          if (updatedComplaint) {
            const currentMessageCount = updatedComplaint.responses?.length || 0;

            // Only update if there are new messages
            if (currentMessageCount > lastMessageCount) {
              setComplaint(updatedComplaint);
              setLastMessageCount(currentMessageCount);
              setLastRefreshTime(new Date());
              setNewMessageAlert(true);

              // Play notification sound for new messages
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                  // Ignore audio play errors (user interaction required)
                });
              } catch (error) {
                // Ignore audio errors
              }

              // Hide alert after 3 seconds
              setTimeout(() => setNewMessageAlert(false), 3000);
            } else {
              // Update refresh time even if no new messages
              setLastRefreshTime(new Date());
            }
          }
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      }, 3000); // Refresh every 3 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, id, complaint, lastMessageCount]);

  // Update message count when complaint changes
  useEffect(() => {
    if (complaint?.responses) {
      setLastMessageCount(complaint.responses.length);
    }
  }, [complaint?.responses]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load complaint details from Firestore
  const loadComplaintDetails = async (complaintId: string) => {
    try {
      setLoading(true);
      setError(null);
      const complaintData = await fetchComplaintById(complaintId);
      setComplaint(complaintData);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Failed to load complaint details', error);
      setError('فشل في تحميل تفاصيل الشكوى، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setResponseError('نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG، PNG، GIF أو WEBP');
        return;
      }

      if (file.size > maxSize) {
        setResponseError('حجم الصورة كبير جدًا. الحد الأقصى هو 5 ميجابايت');
        return;
      }

      setSelectedImage(file);
      setResponseError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file picker
  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle submit response
  const handleSubmitResponse = async () => {
    if (!id || !responseText.trim()) return;

    try {
      setSubmitting(true);
      setResponseError(null);

      // In a real application, you would get the admin info from auth context
      const adminId = 'admin-1'; // Example admin ID
      const adminName = 'مدير النظام'; // Example admin name

      let imageUrl: string | undefined = undefined;

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        const uploadResult = await uploadImage(selectedImage);

        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'فشل رفع الصورة');
        }
        setUploadingImage(false);
      }

      // إضافة الرد إلى قاعدة البيانات
      await addAdminResponse(id, responseText, adminId, adminName, imageUrl);

      // تحديث الواجهة فوراً بإضافة الرد الجديد
      if (complaint) {
        const newResponse = {
          id: Date.now().toString(), // معرف مؤقت
          responseText: responseText,
          responderId: adminId,
          responderName: adminName,
          createdAt: new Date(),
          imageUrl: imageUrl,
          isAdmin: true
        };

        // تحديث الشكوى في الواجهة فوراً
        setComplaint({
          ...complaint,
          responses: [...complaint.responses, newResponse]
        });

        // التمرير إلى أسفل المحادثة فوراً
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }

      // مسح النموذج وإظهار رسالة النجاح
      setResponseText('');
      setResponseSuccess('تم إضافة الرد بنجاح');
      clearSelectedImage();

      // تحديث البيانات من الخادم في الخلفية
      setTimeout(async () => {
        try {
          await loadComplaintDetails(id);
          // التمرير إلى أسفل المحادثة بعد إضافة الرد
          scrollToBottom();
        } catch (error) {
          console.error('Failed to refresh complaint data:', error);
        }
      }, 500);

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setResponseSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit response', error);
      setResponseError('فشل في إرسال الرد، يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  // Handle menu open
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle status change
  const handleChangeStatus = async (newStatus: 'open' | 'in-progress' | 'closed') => {
    if (!id) return;

    try {
      setLoading(true);
      await updateComplaintStatus(id, newStatus);

      // Refresh complaint data
      await loadComplaintDetails(id);

      handleMenuClose();
    } catch (error) {
      console.error('Failed to update status', error);
      setError('فشل في تحديث حالة الشكوى، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Format date in a more readable way
  const formatDate = (date: Date) => {
    const now = moment();
    const messageDate = moment(date);

    if (now.diff(messageDate, 'days') < 1) {
      return messageDate.format('HH:mm');
    } else if (now.diff(messageDate, 'days') < 2) {
      return `الأمس ${messageDate.format('HH:mm')}`;
    } else if (now.diff(messageDate, 'days') < 7) {
      return messageDate.format('dddd HH:mm');
    } else {
      return messageDate.format('DD MMM YYYY HH:mm');
    }
  };

  // Handle delete complaint
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteComplaint = async () => {
    if (!id) return;

    try {
      setDeletingComplaint(true);
      await deleteComplaint(id);
      navigate('/complaints');
    } catch (error) {
      console.error('Failed to delete complaint', error);
      setError('فشل في حذف الشكوى، يرجى المحاولة مرة أخرى');
    } finally {
      setDeletingComplaint(false);
      closeDeleteDialog();
    }
  };

  // فتح حوار إرسال الإشعار داخل التطبيق
  const openInAppNotificationDialog = () => {
    if (!complaint) return;
    setNotificationTitle(`تحديث حالة الشكوى: ${complaint.title}`);
    setNotificationMessage(`تم تحديث حالة الشكوى الخاصة بك "${complaint.title}". يرجى الاطلاع على التفاصيل.`);
    setInAppNotificationDialogOpen(true);
  };

  // فتح حوار إرسال الإشعار خارج التطبيق
  const openPushNotificationDialog = () => {
    if (!complaint) return;
    setNotificationTitle(`تحديث حالة الشكوى: ${complaint.title}`);
    setNotificationMessage(`تم تحديث حالة الشكوى الخاصة بك "${complaint.title}". يرجى الاطلاع على التفاصيل.`);
    setPushNotificationDialogOpen(true);
  };

  // إغلاق حوار إرسال الإشعار داخل التطبيق
  const closeInAppNotificationDialog = () => {
    setInAppNotificationDialogOpen(false);
  };

  // إغلاق حوار إرسال الإشعار خارج التطبيق
  const closePushNotificationDialog = () => {
    setPushNotificationDialogOpen(false);
  };

  // فتح حوار إرسال الإشعار المدمج (داخلي وخارجي)
  const openCombinedNotificationDialog = () => {
    if (!complaint) return;
    setNotificationTitle(`تحديث حالة الشكوى: ${complaint.title}`);
    setNotificationMessage(`تم تحديث حالة الشكوى الخاصة بك "${complaint.title}". يرجى الاطلاع على التفاصيل.`);
    setCombinedNotificationDialogOpen(true);
  };

  // إغلاق حوار إرسال الإشعار المدمج
  const closeCombinedNotificationDialog = () => {
    setCombinedNotificationDialogOpen(false);
    setSendingNotification(false);
  };

  // إرسال إشعار داخل التطبيق فقط
  const handleSendInAppNotification = async () => {
    if (!complaint || !complaint.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closeInAppNotificationDialog();
      return;
    }

    try {
      setLoading(true);

      // إضافة إشعار في Firestore للمستخدم
      await addDoc(collection(db, 'notifications'), {
        userId: complaint.userId.trim(),
        title: notificationTitle,
        body: notificationMessage,
        type: 'complaint',
        timestamp: new Date(),
        isRead: false,
        additionalData: {
          complaintId: complaint.id,
          complaintTitle: complaint.title,
        },
        targetScreen: 'ComplaintDetails',
      });

      setSuccess(`تم إرسال الإشعار داخل التطبيق للمستخدم ${complaint.userName} بنجاح.`);
      closeInAppNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error sending in-app notification:', err);
      setError('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // إرسال إشعار خارج التطبيق فقط
  const handleSendPushNotification = async () => {
    if (!complaint || !complaint.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closePushNotificationDialog();
      return;
    }

    try {
      setLoading(true);

      // إرسال إشعار خارجي باستخدام OneSignal
      const oneSignalResult = await sendOneSignalNotification(
        complaint.userId.trim(),
        notificationTitle,
        notificationMessage,
        {
          type: 'complaint',
          complaintId: complaint.id,
          complaintTitle: complaint.title,
          targetScreen: 'ComplaintDetails'
        }
      );

      console.log('نتيجة إرسال إشعار OneSignal:', oneSignalResult);

      setSuccess(`تم إرسال الإشعار خارج التطبيق للمستخدم ${complaint.userName} بنجاح.`);
      closePushNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');

      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error sending push notification:', err);
      setError('حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // إرسال إشعار مدمج (داخلي وخارجي)
  const handleSendCombinedNotification = async () => {
    if (!complaint || !complaint.userId) {
      setError('لا يمكن إرسال الإشعار، لا يوجد معرف للمستخدم.');
      closeCombinedNotificationDialog();
      return;
    }

    try {
      setSendingNotification(true);
      let successMessages = [];
      let hasErrors = false;

      // إرسال إشعار داخل التطبيق
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: complaint.userId.trim(),
          title: notificationTitle,
          body: notificationMessage,
          type: 'complaint',
          timestamp: new Date(),
          isRead: false,
          additionalData: {
            complaintId: complaint.id,
            complaintTitle: complaint.title,
          },
          targetScreen: 'ComplaintDetails',
        });
        successMessages.push('تم إرسال الإشعار داخل التطبيق');
      } catch (err) {
        console.error('Error sending in-app notification:', err);
        hasErrors = true;
      }

      // إرسال إشعار خارج التطبيق
      try {
        await sendOneSignalNotification(
          complaint.userId.trim(),
          notificationTitle,
          notificationMessage,
          {
            type: 'complaint',
            complaintId: complaint.id,
            complaintTitle: complaint.title,
            targetScreen: 'ComplaintDetails'
          }
        );
        successMessages.push('تم إرسال الإشعار خارج التطبيق');
      } catch (err) {
        console.error('Error sending push notification:', err);
        hasErrors = true;
      }

      if (successMessages.length > 0) {
        const message = hasErrors
          ? `${successMessages.join(' و ')} للمستخدم ${complaint.userName}. بعض الإشعارات فشلت.`
          : `${successMessages.join(' و ')} للمستخدم ${complaint.userName} بنجاح.`;
        setSuccess(message);
      }

      if (hasErrors && successMessages.length === 0) {
        setError('فشل في إرسال جميع الإشعارات. يرجى المحاولة مرة أخرى.');
      }

      closeCombinedNotificationDialog();
      setNotificationMessage('');
      setNotificationTitle('');

      // إخفاء رسالة النجاح بعد 4 ثوان
      setTimeout(() => {
        setSuccess(null);
      }, 4000);

    } catch (err) {
      console.error('Error sending combined notifications:', err);
      setError('حدث خطأ أثناء إرسال الإشعارات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSendingNotification(false);
    }
  };

  // وظيفة للانتقال إلى صفحة إضافة رصيد للمستخدم الحالي
  const handleAddBalanceToUser = () => {
    if (complaint?.userId) {
      // فتح النافذة المنبثقة لإضافة الرصيد بدلاً من الانتقال لصفحة أخرى
      setBalanceAmount('');
      setBalanceNotes('');
      setAddBalanceDialogOpen(true);
    }
  };
  
  // إغلاق نافذة إضافة الرصيد
  const closeAddBalanceDialog = () => {
    setAddBalanceDialogOpen(false);
    setBalanceAmount('');
    setBalanceNotes('');
    setAddingBalance(false);
  };
  
  // إضافة الرصيد للمستخدم
  const handleSubmitAddBalance = async () => {
    if (!complaint?.userId || !balanceAmount || isNaN(Number(balanceAmount)) || Number(balanceAmount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح للرصيد');
      return;
    }
    
    try {
      setAddingBalance(true);
      
      // استخدام معاملة Firestore لضمان تزامن تحديث الرصيد وإضافة سجل المعاملة
      const amountToAdd = Number(balanceAmount);
      
      // 1. تحديث رصيد المستخدم في مجموعة users
      const userRef = doc(db, 'users', complaint.userId);
      
      // استخدام معاملة Firestore
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('لم يتم العثور على بيانات المستخدم');
        }
        
        // الحصول على الرصيد الحالي أو اعتباره صفراً إذا لم يكن موجوداً
        const currentBalance = userDoc.data().balance || 0;
        const newBalance = currentBalance + amountToAdd;
        
        // تحديث رصيد المستخدم
        transaction.update(userRef, { 
          balance: newBalance,
          lastUpdated: new Date()
        });
        
        // 2. إضافة سجل معاملة في مجموعة balanceTransactions
        const transactionRef = doc(collection(db, 'balanceTransactions'));
        transaction.set(transactionRef, {
          id: transactionRef.id,
          userId: complaint.userId,
          userName: complaint.userName || 'مستخدم',
          amount: amountToAdd,
          type: 'deposit', // إيداع
          notes: balanceNotes || 'تم إضافة الرصيد من قِبل الإدارة',
          createdAt: new Date(),
          adminId: 'admin-1', // يمكن استبدالها بمعرف المدير الحالي
          status: 'completed',
          previousBalance: currentBalance,
          newBalance: newBalance
        });
      });
      
      // إرسال إشعار للمستخدم بإضافة الرصيد
      const notificationTitle = `تم إضافة رصيد إلى حسابك`;
      const notificationMessage = `تم إضافة ${balanceAmount} جنيه إلى حسابك بنجاح. ${balanceNotes ? `ملاحظات: ${balanceNotes}` : ''}`;
      
      try {
        // إضافة إشعار داخلي
        await addDoc(collection(db, 'notifications'), {
          userId: complaint.userId,
          title: notificationTitle,
          body: notificationMessage,
          type: 'balance',
          timestamp: new Date(),
          isRead: false,
          additionalData: {
            amount: Number(balanceAmount)
          },
          targetScreen: 'Wallet',
        });
        
        // إرسال إشعار خارجي (push notification)
        await sendOneSignalNotification(
          complaint.userId.trim(),
          notificationTitle,
          notificationMessage,
          {
            type: 'balance',
            amount: Number(balanceAmount),
            targetScreen: 'Wallet'
          }
        );
      } catch (notificationErr) {
        console.error('Error sending balance notification:', notificationErr);
        // نستمر في التنفيذ حتى لو فشل إرسال الإشعار
      }
      
      setSuccess(`تم إضافة ${balanceAmount} جنيه إلى حساب ${complaint.userName} بنجاح وإرسال إشعار`);
      closeAddBalanceDialog();
      
      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error adding balance:', err);
      setError('حدث خطأ أثناء إضافة الرصيد. يرجى المحاولة مرة أخرى.');
    } finally {
      setAddingBalance(false);
    }
  };

  // وظيفة للانتقال إلى صفحة إشعارات الرصيد للمستخدم الحالي
  const handleViewBalanceNotifications = () => {
    if (complaint?.userId) {
      // الانتقال إلى صفحة إشعارات الرصيد مع تمرير معرف المستخدم
      navigate(`/notifications?type=balance&userId=${complaint.userId}&userName=${encodeURIComponent(complaint.userName || '')}`);
    }
  };

  if (loading && !complaint) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress sx={{ color: customColors.primary }} />
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="500px">
            <CircularProgress sx={{ color: customColors.primary }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="500px">
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={() => id && loadComplaintDetails(id)}
            sx={{
              mt: 2,
              borderRadius: '12px',
              px: 3,
              bgcolor: customColors.primary,
              '&:hover': {
                bgcolor: customColors.primaryDark
              }
            }}
          >
            إعادة المحاولة
          </Button>
        </Box>
      </Container>
    );
  }

  if (!complaint) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="500px">
          <Typography variant="h6" sx={{ color: customColors.textSecondary }}>
            لم يتم العثور على الشكوى
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Layout title="تفاصيل الشكوى">
      <GlobalStyles styles={slideInAnimation} />

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, mx: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

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

      {/* In-App Notification Dialog */}
      <Dialog
        open={inAppNotificationDialogOpen}
        onClose={closeInAppNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: 'info.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <NotificationsIcon />
          إرسال إشعار داخل التطبيق
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار داخل التطبيق فقط للمستخدم {complaint?.userName || ''} بخصوص الشكوى {complaint?.title || ''}
          </DialogContentText>

          <Alert severity="info" sx={{ mb: 2 }}>
            هذا الإشعار سيظهر فقط داخل التطبيق في قائمة الإشعارات ولن يتم إرساله كإشعار دفعي.
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeInAppNotificationDialog}
            variant="outlined"
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSendInAppNotification}
            variant="contained"
            color="info"
            startIcon={<NotificationsIcon />}
            disabled={!notificationMessage || !notificationTitle || loading}
          >
            {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار داخل التطبيق'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Push Notification Dialog */}
      <Dialog
        open={pushNotificationDialogOpen}
        onClose={closePushNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <NotificationsIcon />
          إرسال إشعار خارج التطبيق
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار خارج التطبيق (إشعار دفعي) للمستخدم {complaint?.userName || ''} بخصوص الشكوى {complaint?.title || ''}
          </DialogContentText>

          <Alert severity="info" sx={{ mb: 2 }}>
            هذا الإشعار سيظهر خارج التطبيق كإشعار دفعي على جهاز المستخدم ولن يظهر في قائمة الإشعارات داخل التطبيق.
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closePushNotificationDialog}
            variant="outlined"
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSendPushNotification}
            variant="contained"
            color="primary"
            startIcon={<NotificationsIcon />}
            disabled={!notificationMessage || !notificationTitle || loading}
          >
            {loading ? 'جارٍ الإرسال...' : 'إرسال الإشعار خارج التطبيق'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Combined Notification Dialog */}
      <Dialog
        open={combinedNotificationDialogOpen}
        onClose={closeCombinedNotificationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <NotificationsIcon />
          إرسال إشعار مدمج (داخلي وخارجي)
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            سيتم إرسال هذا الإشعار داخل وخارج التطبيق للمستخدم {complaint?.userName || ''} بخصوص الشكوى {complaint?.title || ''}
          </DialogContentText>

          <Alert severity="success" sx={{ mb: 2 }}>
            هذا الإشعار سيظهر داخل التطبيق في قائمة الإشعارات وسيتم إرساله أيضاً كإشعار دفعي على جهاز المستخدم.
          </Alert>

          <TextField
            autoFocus
            margin="dense"
            label="عنوان الإشعار"
            type="text"
            fullWidth
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="نص الإشعار"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeCombinedNotificationDialog}
            variant="outlined"
            color="inherit"
            disabled={sendingNotification}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSendCombinedNotification}
            variant="contained"
            color="primary"
            startIcon={sendingNotification ? <CircularProgress size={16} color="inherit" /> : <NotificationsIcon />}
            disabled={!notificationMessage || !notificationTitle || sendingNotification}
            sx={{
              minWidth: '200px'
            }}
          >
            {sendingNotification ? 'جارِ الإرسال...' : 'إرسال الإشعارين'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة إضافة الرصيد */}
      <Dialog
        open={addBalanceDialogOpen}
        onClose={closeAddBalanceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          fontWeight: 600,
          color: customColors.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CreditScoreIcon />
          إضافة رصيد للمستخدم
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            يرجى إدخال المبلغ المراد إضافته إلى حساب المستخدم {complaint?.userName || ''} (معرف: {complaint?.userId || ''})
          </DialogContentText>

          <TextField
            autoFocus
            margin="dense"
            label="المبلغ (جنيه)"
            type="number"
            fullWidth
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
          <TextField
            margin="dense"
            label="ملاحظات (اختياري)"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={balanceNotes}
            onChange={(e) => setBalanceNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeAddBalanceDialog}
            variant="outlined"
            color="inherit"
            disabled={addingBalance}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmitAddBalance}
            variant="contained"
            color="secondary"
            startIcon={addingBalance ? <CircularProgress size={16} color="inherit" /> : <CreditScoreIcon />}
            disabled={!balanceAmount || isNaN(Number(balanceAmount)) || Number(balanceAmount) <= 0 || addingBalance}
            sx={{
              minWidth: '150px',
              color: 'white'
            }}
          >
            {addingBalance ? 'جارِ الإضافة...' : 'إضافة الرصيد'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ position: 'relative', height: '100%' }}>
        {/* Top AppBar */}
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.primaryDark} 100%)`,
            borderBottom: `1px solid ${alpha(customColors.primary, 0.2)}`,
            zIndex: 10,
            boxShadow: `0 4px 20px ${alpha(customColors.primary, 0.15)}`
          }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
            {/* Back button & Title */}
            <Box display="flex" alignItems="center">
              <IconButton
                onClick={() => navigate('/complaints')}
                sx={{
                  mr: 1,
                  bgcolor: alpha('#ffffff', 0.2),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.3),
                  }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Stack>
                <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {complaint?.title}
                </Typography>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                  <Link
                    color="inherit"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/complaints');
                    }}
                    sx={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}
                  >
                    <Typography color={alpha('#ffffff', 0.8)} fontSize="inherit">إدارة الشكاوى</Typography>
                  </Link>
                  <Typography color={alpha('#ffffff', 0.9)} sx={{ fontWeight: 'medium', fontSize: '0.85rem' }}>
                    تفاصيل الشكوى #{complaint?.id?.substring(0, 6)}
                  </Typography>
                </Breadcrumbs>
              </Stack>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Status Chip and Menu */}
            <Box>
              <Chip
                icon={statusIcons[complaint?.status || 'open']}
                label={statusText[complaint?.status || 'open']}
                color="error"
                sx={{
                  fontWeight: 'bold',
                  mr: 1,
                  boxShadow: `0 2px 8px ${alpha('#000000', 0.15)}`,
                  borderRadius: '20px',
                  px: 0.5,
                  bgcolor: 'white',
                  color: customColors.error,
                  border: `1px solid ${alpha(customColors.error, 0.3)}`
                }}
              />

              <Tooltip title="إرسال إشعار (داخلي وخارجي)">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<NotificationsIcon />}
                    onClick={openCombinedNotificationDialog}
                    sx={{
                      mr: 1,
                      bgcolor: customColors.primary,
                      color: 'white',
                      borderRadius: '12px',
                      px: 2,
                      py: 1,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      boxShadow: `0 3px 8px ${alpha('#000000', 0.15)}`,
                      '&:hover': {
                        bgcolor: alpha(customColors.primary, 0.9),
                        boxShadow: `0 4px 12px ${alpha('#000000', 0.2)}`,
                      },
                      '&.Mui-disabled': {
                        bgcolor: alpha(customColors.primary, 0.5),
                        color: 'white'
                      }
                    }}
                    disabled={!complaint?.userId}
                  >
                    إرسال إشعار
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="إضافة رصيد للمستخدم">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<CreditScoreIcon />}
                    onClick={handleAddBalanceToUser}
                    sx={{
                      mr: 1,
                      bgcolor: customColors.secondary,
                      color: 'white',
                      borderRadius: '12px',
                      px: 2,
                      py: 1,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      boxShadow: `0 3px 8px ${alpha('#000000', 0.15)}`,
                      '&:hover': {
                        bgcolor: alpha(customColors.secondary, 0.9),
                        boxShadow: `0 4px 12px ${alpha('#000000', 0.2)}`,
                      },
                      '&.Mui-disabled': {
                        bgcolor: alpha(customColors.secondary, 0.5),
                        color: 'white'
                      }
                    }}
                    disabled={!complaint?.userId}
                  >
                    إضافة رصيد
                  </Button>
                </span>
              </Tooltip>

              <Tooltip title="حذف الشكوى">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={openDeleteDialog}
                  sx={{
                    mr: 1,
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    borderColor: 'white',
                    color: 'white',
                    bgcolor: alpha('#ffffff', 0.1),
                    '&:hover': {
                      bgcolor: alpha('#f44336', 0.2),
                      borderColor: 'white',
                      color: 'white'
                    }
                  }}
                >
                  حذف
                </Button>
              </Tooltip>

              <IconButton
                aria-label="more options"
                aria-controls="status-menu"
                aria-haspopup="true"
                onClick={handleMenuClick}
                sx={{
                  bgcolor: alpha('#ffffff', 0.2),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.3)
                  }
                }}
              >
                <MoreVert />
              </IconButton>

              <Menu
                id="status-menu"
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    border: `1px solid ${customColors.cardBorder}`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                  }
                }}
              >
                <MenuItem onClick={() => handleChangeStatus('open')} disabled={complaint?.status === 'open'}>
                  <ListItemIcon>
                    <FiberNew fontSize="small" sx={{ color: customColors.info }} />
                  </ListItemIcon>
                  <ListItemText primary="تحديث إلى مفتوحة" />
                </MenuItem>
                <MenuItem onClick={() => handleChangeStatus('in-progress')} disabled={complaint?.status === 'in-progress'}>
                  <ListItemIcon>
                    <HourglassEmpty fontSize="small" sx={{ color: customColors.warning }} />
                  </ListItemIcon>
                  <ListItemText primary="تحديث إلى قيد المعالجة" />
                </MenuItem>
                <MenuItem onClick={() => handleChangeStatus('closed')} disabled={complaint?.status === 'closed'}>
                  <ListItemIcon>
                    <CheckCircle fontSize="small" sx={{ color: customColors.success }} />
                  </ListItemIcon>
                  <ListItemText primary="إغلاق الشكوى" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={openDeleteDialog}>
                  <ListItemIcon>
                    <Delete fontSize="small" sx={{ color: '#f44336' }} />
                  </ListItemIcon>
                  <ListItemText primary="حذف الشكوى" primaryTypographyProps={{ sx: { color: '#f44336' } }} />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* New Message Alert */}
        {newMessageAlert && (
          <Alert
            severity="success"
            sx={{
              position: 'fixed',
              top: 80,
              right: 20,
              zIndex: 1300,
              minWidth: '300px',
              borderRadius: '12px',
              boxShadow: `0 8px 25px ${alpha(customColors.success, 0.3)}`,
              animation: 'slideInRight 0.3s ease-out'
            }}
            onClose={() => setNewMessageAlert(false)}
          >
            <Typography variant="body2" fontWeight="bold">
              وصلت رسالة جديدة!
            </Typography>
          </Alert>
        )}

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            {/* Complaint Details Panel */}
            <Grid item xs={12} md={3} lg={3} xl={2}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  height: '100%',
                  boxShadow: `0 8px 25px ${alpha(customColors.primary, 0.12)}`,
                  border: `1px solid ${alpha(customColors.primary, 0.1)}`,
                  background: `linear-gradient(135deg, white 0%, ${alpha(customColors.primary, 0.02)} 100%)`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 35px ${alpha(customColors.primary, 0.18)}`
                  }
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${alpha(getStatusColor(complaint.status), 0.9)} 0%, ${alpha(getStatusColor(complaint.status), 0.7)} 100%)`,
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)`,
                      opacity: 0.3
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    معلومات الشكوى
                  </Typography>
                </Box>

                <Box p={3} sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack spacing={2.5}>
                    {/* Submitter Info */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PermIdentity sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          مقدم الشكوى
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', pl: 3 }}>
                        <Avatar
                          sx={{ width: 32, height: 32, mr: 1, bgcolor: alpha(getStatusColor(complaint.status), 0.8) }}
                          src="/user.png"
                        >
                          {complaint.userName?.charAt(0) || '؟'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: customColors.textPrimary }}>
                            {complaint.userName}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: alpha(customColors.cardBorder, 0.8) }} />

                    {/* Title & Description */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Title sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          عنوان الشكوى
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ pl: 3, color: customColors.textPrimary, fontWeight: 'medium' }}>
                        {complaint.title}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: alpha(customColors.cardBorder, 0.8) }} />

                    {/* Description */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Description sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          وصف الشكوى
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          pl: 3,
                          color: customColors.textPrimary,
                          whiteSpace: 'pre-line',
                          lineHeight: 1.7,
                          maxHeight: '120px',
                          overflow: 'auto'
                        }}
                      >
                        {complaint.description}
                      </Typography>

                      {complaint.imageUrl && (
                        <Box mt={1.5} sx={{ pl: 3 }}>
                          <Card
                            variant="outlined"
                            sx={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              borderRadius: 2,
                              overflow: 'hidden',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              border: `1px solid ${customColors.cardBorder}`
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={complaint.imageUrl}
                              alt="صورة الشكوى"
                              sx={{
                                height: 120,
                                objectFit: 'cover',
                                bgcolor: '#f8f9fa'
                              }}
                            />
                          </Card>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ borderColor: alpha(customColors.cardBorder, 0.8) }} />

                    {/* Date Info */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          تاريخ الإنشاء
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ pl: 3, color: customColors.textPrimary }}>
                        {moment(complaint.createdAt).format('DD MMMM YYYY')}
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 3, color: customColors.textPrimary }}>
                        {moment(complaint.createdAt).format('HH:mm:ss')}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: alpha(customColors.cardBorder, 0.8) }} />

                    {/* Conversation Stats */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ChatBubbleOutline sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          إحصائيات المحادثة
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ pl: 3, color: customColors.textPrimary }}>
                        عدد الردود: {complaint.responses.length}
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 3, color: customColors.textPrimary }}>
                        آخر تحديث: {complaint.responses.length > 0
                          ? moment(complaint.responses[complaint.responses.length - 1].createdAt).fromNow()
                          : 'لا يوجد ردود'}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: alpha(customColors.cardBorder, 0.8) }} />

                    {/* Status Info */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EditNote sx={{ mr: 1, color: customColors.primary, fontSize: '1.1rem' }} />
                        <Typography variant="subtitle2" color="text.secondary">
                          حالة الشكوى
                        </Typography>
                      </Box>
                      <Box sx={{ pl: 3 }}>
                        <Chip
                          icon={statusIcons[complaint.status]}
                          label={statusText[complaint.status]}
                          color={statusColors[complaint.status] as any}
                          size="small"
                          sx={{ fontWeight: 'bold', borderRadius: '20px' }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Chat Messages Panel */}
            <Grid item xs={12} md={9} lg={9} xl={10}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: { xs: 'auto', md: '85vh' },
                  boxShadow: `0 8px 25px ${alpha(customColors.primary, 0.12)}`,
                  border: `1px solid ${alpha(customColors.primary, 0.1)}`,
                  background: 'white',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 12px 35px ${alpha(customColors.primary, 0.18)}`
                  }
                }}
              >
                {/* Chat Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: alpha(customColors.primary, 0.9),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <ChatBubbleOutline sx={{ mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      المحادثة ({complaint.responses.length} {complaint.responses.length === 1 ? 'رد' : 'ردود'})
                      {autoRefresh && (
                        <Chip
                          label="تحديث تلقائي"
                          size="small"
                          sx={{
                            ml: 1,
                            fontSize: '0.7rem',
                            height: '20px',
                            bgcolor: customColors.success,
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                      {lastRefreshTime && (
                        <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                          آخر تحديث: {moment(lastRefreshTime).format('HH:mm:ss')}
                        </Typography>
                      )}
                    </Typography>
                  </Box>

                  {complaint.status !== 'closed' && (
                    <Box display="flex" alignItems="center">
                      <Chip
                        label="المحادثة مفتوحة"
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: 'white',
                          color: customColors.error,
                          borderRadius: '12px'
                        }}
                      />
                      <Tooltip title={autoRefresh ? "إيقاف التحديث التلقائي" : "تفعيل التحديث التلقائي"}>
                        <IconButton
                          size="small"
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          sx={{
                            ml: 1,
                            bgcolor: autoRefresh ? customColors.success : 'white',
                            color: autoRefresh ? 'white' : customColors.primary,
                            '&:hover': {
                              bgcolor: autoRefresh ? '#2e7d32' : alpha('#ffffff', 0.9),
                            },
                            width: 30,
                            height: 30
                          }}
                        >
                          <AutorenewIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تحديث المحادثة">
                        <IconButton
                          size="small"
                          onClick={() => id && loadComplaintDetails(id)}
                          sx={{
                            ml: 1,
                            bgcolor: 'white',
                            color: customColors.primary,
                            '&:hover': {
                              bgcolor: alpha('#ffffff', 0.9),
                            },
                            width: 30,
                            height: 30
                          }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}

                  {complaint.status === 'closed' && (
                    <Box display="flex" alignItems="center">
                      <Chip
                        label="المحادثة مغلقة"
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: 'white',
                          color: customColors.error,
                          borderRadius: '12px'
                        }}
                      />
                      <Tooltip title="تحديث المحادثة">
                        <IconButton
                          size="small"
                          onClick={() => id && loadComplaintDetails(id)}
                          sx={{
                            ml: 1,
                            bgcolor: 'white',
                            color: customColors.primary,
                            '&:hover': {
                              bgcolor: alpha('#ffffff', 0.9),
                            },
                            width: 30,
                            height: 30
                          }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Chat Messages */}
                <Box
                  sx={{
                    p: 3,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    background: `linear-gradient(135deg, ${alpha(customColors.grey, 0.3)} 0%, ${alpha(customColors.primary, 0.05)} 100%)`,
                    minHeight: '500px',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `radial-gradient(circle at 20% 80%, ${alpha(customColors.primary, 0.03)} 0%, transparent 50%),
                                       radial-gradient(circle at 80% 20%, ${alpha(customColors.secondary, 0.03)} 0%, transparent 50%)`,
                      pointerEvents: 'none'
                    }
                  }}
                >
                  {complaint.responses.length === 0 ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: customColors.textSecondary,
                        py: 8
                      }}
                    >
                      <ChatBubbleOutline sx={{ fontSize: '4rem', color: alpha(customColors.primary, 0.2), mb: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: customColors.textPrimary }}>
                        لا توجد ردود على هذه الشكوى حتى الآن
                      </Typography>
                      {complaint.status !== 'closed' && (
                        <Typography variant="body2" sx={{ mt: 1, color: customColors.textSecondary }}>
                          قم بإضافة أول رد باستخدام نموذج الرد أدناه
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    complaint.responses.map((response, index) => (
                      <Box
                        key={response.id || index}
                        sx={{
                          display: 'flex',
                          justifyContent: response.isAdmin ? 'flex-start' : 'flex-end',
                          width: '100%',
                          opacity: 0,
                          animation: 'fadeInUp 0.5s ease-out forwards',
                          animationDelay: `${index * 0.1}s`,
                          '@keyframes fadeInUp': {
                            '0%': {
                              opacity: 0,
                              transform: 'translateY(20px)'
                            },
                            '100%': {
                              opacity: 1,
                              transform: 'translateY(0)'
                            }
                          }
                        }}
                      >
                        {response.isAdmin && (
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              mr: 1.5,
                              bgcolor: customColors.primary,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            <SupervisorAccount />
                          </Avatar>
                        )}

                        <Box sx={{
                          maxWidth: '75%',
                          bgcolor: response.isAdmin
                            ? 'white'
                            : alpha(customColors.success, 0.1),
                          borderRadius: response.isAdmin ? '20px 20px 20px 5px' : '20px 20px 5px 20px',
                          p: 2.5,
                          boxShadow: response.isAdmin
                            ? `0 4px 15px ${alpha(customColors.primary, 0.15)}`
                            : `0 4px 15px ${alpha(customColors.success, 0.15)}`,
                          border: `1px solid ${response.isAdmin
                            ? alpha(customColors.primary, 0.2)
                            : alpha(customColors.success, 0.3)}`,
                          position: 'relative',
                          zIndex: 1,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: response.isAdmin
                              ? `0 6px 20px ${alpha(customColors.primary, 0.2)}`
                              : `0 6px 20px ${alpha(customColors.success, 0.2)}`
                          }
                        }}>
                          <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1,
                            flexDirection: response.isAdmin ? 'row' : 'row-reverse'
                          }}>
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              flexDirection: response.isAdmin ? 'row' : 'row-reverse'
                            }}>
                              <Typography variant="subtitle2" sx={{
                                fontWeight: 'bold',
                                color: response.isAdmin ? customColors.primary : customColors.success,
                                mr: response.isAdmin ? 0 : 1,
                                ml: response.isAdmin ? 1 : 0
                              }}>
                                {response.responderName}
                              </Typography>
                              {response.isAdmin && (
                                <Chip
                                  label="مدير النظام"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    mr: 1,
                                    ml: 1,
                                    fontWeight: 'bold',
                                    bgcolor: alpha(customColors.primary, 0.1),
                                    color: customColors.primary,
                                    border: `1px solid ${alpha(customColors.primary, 0.3)}`,
                                    borderRadius: '10px'
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(response.createdAt)}
                            </Typography>
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-line',
                              lineHeight: 1.7,
                              color: customColors.textPrimary,
                              textAlign: response.isAdmin ? 'left' : 'right'
                            }}
                          >
                            {response.responseText}
                          </Typography>

                          {response.imageUrl && (
                            <Box mt={2} sx={{
                              maxWidth: '100%',
                              display: 'flex',
                              justifyContent: response.isAdmin ? 'flex-start' : 'flex-end'
                            }}>
                              <Card
                                variant="outlined"
                                sx={{
                                  display: 'inline-block',
                                  maxWidth: '100%',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  boxShadow: '0 1px 5px rgba(0,0,0,0.05)',
                                  border: `1px solid ${customColors.cardBorder}`
                                }}
                              >
                                <CardMedia
                                  component="img"
                                  image={response.imageUrl}
                                  alt="صورة مرفقة"
                                  sx={{
                                    maxHeight: 300,
                                    objectFit: 'contain',
                                    bgcolor: '#f8f9fa'
                                  }}
                                />
                              </Card>
                            </Box>
                          )}
                        </Box>

                        {!response.isAdmin && (
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              ml: 1.5,
                              bgcolor: alpha(customColors.success, 0.8),
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                            src="/user.png"
                          >
                            <Person />
                          </Avatar>
                        )}
                      </Box>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </Box>

                {/* Response Form */}
                {complaint.status !== 'closed' ? (
                  <Box
                    sx={{
                      p: 3,
                      borderTop: `1px solid ${alpha(customColors.primary, 0.1)}`,
                      background: `linear-gradient(135deg, ${alpha(customColors.primary, 0.02)} 0%, white 100%)`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${customColors.primary} 0%, ${customColors.secondary} 100%)`
                      }
                    }}
                  >
                    {responseSuccess && (
                      <Alert
                        severity="success"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          '& .MuiAlert-icon': { alignItems: 'center' }
                        }}
                      >
                        {responseSuccess}
                      </Alert>
                    )}

                    {responseError && (
                      <Alert
                        severity="error"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          '& .MuiAlert-icon': { alignItems: 'center' }
                        }}
                      >
                        {responseError}
                      </Alert>
                    )}

                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="اكتب ردك هنا... (اضغط Enter للإرسال، Shift+Enter لسطر جديد)"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (responseText.trim() && !submitting && !uploadingImage) {
                              handleSubmitResponse();
                            }
                          }
                        }}
                        disabled={submitting || uploadingImage}
                        InputProps={{
                          sx: {
                            borderRadius: '20px',
                            pr: 2,
                            bgcolor: 'white',
                            boxShadow: `0 2px 10px ${alpha(customColors.primary, 0.08)}`,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(customColors.primary, 0.2),
                              borderWidth: '2px'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(customColors.primary, 0.4)
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: customColors.primary,
                              boxShadow: `0 0 0 3px ${alpha(customColors.primary, 0.1)}`
                            }
                          },
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box>
                                {imagePreviewUrl && (
                                  <Badge
                                    badgeContent={
                                      <IconButton
                                        size="small"
                                        onClick={clearSelectedImage}
                                        sx={{
                                          bgcolor: customColors.error,
                                          color: 'white',
                                          '&:hover': { bgcolor: alpha(customColors.error, 0.9) }
                                        }}
                                      >
                                        <Close fontSize="small" />
                                      </IconButton>
                                    }
                                    sx={{
                                      position: 'absolute',
                                      top: -55,
                                      right: 10,
                                      '& .MuiBadge-badge': {
                                        top: -8,
                                        right: -8,
                                        border: `2px solid white`,
                                        padding: 0
                                      }
                                    }}
                                  >
                                    <Card sx={{ maxWidth: 60, borderRadius: 1 }}>
                                      <CardMedia
                                        component="img"
                                        height="50"
                                        image={imagePreviewUrl}
                                        alt="صورة مرفقة"
                                        sx={{ objectFit: 'cover' }}
                                      />
                                    </Card>
                                  </Badge>
                                )}
                              </Box>
                            </InputAdornment>
                          )
                        }}
                      />

                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          display: 'flex',
                          gap: 1
                        }}
                      >
                        <Tooltip title="إرفاق صورة">
                          <span>
                            <IconButton
                              onClick={openFilePicker}
                              disabled={submitting || uploadingImage || !!selectedImage}
                              size="small"
                              sx={{
                                bgcolor: alpha(customColors.primary, 0.1),
                                color: customColors.primary,
                                borderRadius: '12px',
                                border: `2px solid ${alpha(customColors.primary, 0.2)}`,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  bgcolor: alpha(customColors.primary, 0.2),
                                  transform: 'scale(1.05)',
                                  boxShadow: `0 4px 12px ${alpha(customColors.primary, 0.3)}`
                                }
                              }}
                            >
                              <AddPhotoAlternate fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {/* Floating Send Button */}
                        <Tooltip title="إرسال سريع">
                          <span>
                            <IconButton
                              onClick={handleSubmitResponse}
                              disabled={submitting || uploadingImage || !responseText.trim()}
                              size="medium"
                              sx={{
                                bgcolor: customColors.primary,
                                color: 'white',
                                borderRadius: '50%',
                                width: 48,
                                height: 48,
                                boxShadow: `0 4px 15px ${alpha(customColors.primary, 0.4)}`,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  bgcolor: customColors.primaryDark,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(customColors.primary, 0.5)}`
                                },
                                '&.Mui-disabled': {
                                  bgcolor: alpha(customColors.primary, 0.3),
                                  color: 'white',
                                  transform: 'none'
                                }
                              }}
                            >
                              {submitting || uploadingImage ?
                                <CircularProgress size={20} color="inherit" /> :
                                <Send fontSize="small" />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                    />
                  </Box>
                ) : (
                  <Box sx={{
                    p: 3,
                    background: `linear-gradient(135deg, ${alpha(customColors.warning, 0.05)} 0%, ${alpha(customColors.error, 0.02)} 100%)`,
                    borderTop: `1px solid ${alpha(customColors.warning, 0.2)}`,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${customColors.warning} 0%, ${customColors.error} 100%)`
                    }
                  }}>
                    <Alert
                      severity="warning"
                      sx={{
                        borderRadius: '16px',
                        boxShadow: `0 4px 15px ${alpha(customColors.warning, 0.15)}`,
                        border: `1px solid ${alpha(customColors.warning, 0.3)}`
                      }}
                      action={
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleChangeStatus('open')}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            bgcolor: customColors.primary,
                            color: 'white',
                            boxShadow: `0 3px 10px ${alpha(customColors.primary, 0.3)}`,
                            '&:hover': {
                              bgcolor: customColors.primaryDark,
                              boxShadow: `0 4px 15px ${alpha(customColors.primary, 0.4)}`
                            }
                          }}
                        >
                          إعادة فتح
                        </Button>
                      }
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        هذه الشكوى مغلقة. لا يمكن إضافة ردود جديدة.
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
};

export default ComplaintDetailPage;