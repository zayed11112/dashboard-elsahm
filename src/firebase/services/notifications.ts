import { collection, doc, addDoc, Timestamp, getFirestore, updateDoc, getDoc } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface NotificationData {
  userId: string;
  title: string;
  body: string;
  type?: string;
  targetScreen?: string | null;
  additionalData?: Record<string, any> | null;
}

/**
 * إرسال إشعار للمستخدم
 * تقوم بإنشاء وثيقة الإشعار في Firestore وإرسال إشعار push
 */
export const sendNotificationToUser = async (notificationData: NotificationData): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
  try {
    const { userId, title, body, type = 'general', targetScreen = null, additionalData = null } = notificationData;
    
    if (!userId || !title || !body) {
      return {
        success: false,
        error: 'يجب توفير معرف المستخدم، عنوان الإشعار والمحتوى'
      };
    }
    
    const db = getFirestore();
    
    // 1. إنشاء وثيقة الإشعار في Firestore
    const notificationRef = collection(db, 'notifications', userId, 'notifications');
    
    const notificationDoc = await addDoc(notificationRef, {
      userId,
      title,
      body,
      type,
      timestamp: Timestamp.now(),
      isRead: false,
      targetScreen,
      additionalData,
    });
    
    console.log('تم إنشاء الإشعار بنجاح:', notificationDoc.id);
    
    // 2. الآن نحاول إرسال إشعار Push
    try {
      // الحصول على FCM token المستخدم من وثيقة المستخدم
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('لم يتم العثور على المستخدم:', userId);
        return {
          success: true,
          notificationId: notificationDoc.id,
          error: 'تم إنشاء الإشعار في قاعدة البيانات ولكن لم يتم العثور على المستخدم لإرسال إشعار Push'
        };
      }
      
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      
      if (!fcmToken) {
        console.error('لم يتم العثور على FCM token للمستخدم:', userId);
        return {
          success: true,
          notificationId: notificationDoc.id,
          error: 'تم إنشاء الإشعار في قاعدة البيانات ولكن لم يتم العثور على FCM token للمستخدم'
        };
      }
      
      // استدعاء Cloud Function لإرسال الإشعار
      const functions = getFunctions();
      const sendPushNotification = httpsCallable(functions, 'sendPushNotification');
      
      const result = await sendPushNotification({
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type,
          notification_id: notificationDoc.id,
          ...(targetScreen && { target_screen: targetScreen }),
        }
      });
      
      console.log('تم إرسال الإشعار بنجاح:', result);
      
      return {
        success: true,
        notificationId: notificationDoc.id
      };
    } catch (pushError) {
      console.error('خطأ في إرسال إشعار Push:', pushError);
      
      // حتى إذا فشل إرسال إشعار Push، فإن الإشعار لا يزال في قاعدة البيانات
      return {
        success: true,
        notificationId: notificationDoc.id,
        error: `تم إنشاء الإشعار في قاعدة البيانات ولكن فشل إرسال إشعار Push: ${pushError}`
      };
    }
  } catch (error: any) {
    console.error('خطأ في إرسال الإشعار:', error);
    return {
      success: false,
      error: error.message || 'خطأ غير معروف في إرسال الإشعار'
    };
  }
};

/**
 * وظيفة لإرسال إشعار للمستخدم بعد الموافقة على طلب شحن الرصيد
 */
export const sendWalletRechargeNotification = async (
  userId: string,
  amount: number,
  currency: string = 'جنيه'
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
  try {
    return await sendNotificationToUser({
      userId,
      title: 'تم شحن رصيدك بنجاح',
      body: `تم إضافة ${amount} ${currency} إلى رصيد محفظتك بنجاح`,
      type: 'wallet',
      targetScreen: 'walletScreen',
      additionalData: {
        amount,
        currency
      }
    });
  } catch (error: any) {
    console.error('خطأ في إرسال إشعار شحن الرصيد:', error);
    return {
      success: false,
      error: error.message || 'خطأ غير معروف في إرسال إشعار شحن الرصيد'
    };
  }
};

/**
 * وظيفة لإرسال إشعار للمستخدم عند الموافقة على طلب الحجز
 */
export const sendBookingConfirmationNotification = async (
  userId: string,
  propertyName: string,
  checkInDate: string,
  checkOutDate: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
  try {
    return await sendNotificationToUser({
      userId,
      title: 'تم تأكيد حجزك',
      body: `تم تأكيد حجزك في ${propertyName} من ${checkInDate} إلى ${checkOutDate}`,
      type: 'booking',
      targetScreen: 'bookingDetailsScreen',
      additionalData: {
        propertyName,
        checkInDate,
        checkOutDate
      }
    });
  } catch (error: any) {
    console.error('خطأ في إرسال إشعار تأكيد الحجز:', error);
    return {
      success: false,
      error: error.message || 'خطأ غير معروف في إرسال إشعار تأكيد الحجز'
    };
  }
}; 