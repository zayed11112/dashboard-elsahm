import { getFunctions, httpsCallable } from 'firebase/functions';

interface NotificationParams {
  userId: string;
  title: string;
  body: string;
  type?: string;
  targetScreen?: string | null;
  additionalData?: Record<string, any> | null;
}

interface WalletRechargeParams {
  userId: string;
  amount: number;
  currency?: string;
}

class NotificationService {
  /**
   * إرسال إشعار للمستخدم من لوحة التحكم
   */
  async sendNotification(params: NotificationParams): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { userId, title, body, type = 'general', targetScreen = null, additionalData = null } = params;
      
      if (!userId || !title || !body) {
        return {
          success: false,
          error: 'يجب توفير معرف المستخدم، عنوان الإشعار والمحتوى'
        };
      }
      
      const functions = getFunctions();
      const sendNotificationFn = httpsCallable(functions, 'sendNotification');
      
      const result = await sendNotificationFn({
        userId,
        title,
        body,
        type,
        targetScreen,
        additionalData
      });
      
      console.log('تم إرسال الإشعار بنجاح:', result);
      
      // @ts-ignore
      const { success, notificationId, messageId } = result.data;
      
      return {
        success: true,
        notificationId
      };
    } catch (error: any) {
      console.error('خطأ في إرسال الإشعار:', error);
      return {
        success: false,
        error: error.message || 'خطأ غير معروف في إرسال الإشعار'
      };
    }
  }
  
  /**
   * إرسال إشعار شحن الرصيد للمستخدم
   */
  async sendWalletRechargeNotification(params: WalletRechargeParams): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { userId, amount, currency = 'جنيه' } = params;
      
      if (!userId || !amount) {
        return {
          success: false,
          error: 'يجب توفير معرف المستخدم والمبلغ'
        };
      }
      
      const functions = getFunctions();
      const sendWalletRechargeNotificationFn = httpsCallable(functions, 'sendWalletRechargeNotification');
      
      const result = await sendWalletRechargeNotificationFn({
        userId,
        amount,
        currency
      });
      
      console.log('تم إرسال إشعار شحن الرصيد بنجاح:', result);
      
      // @ts-ignore
      const { success, notificationId } = result.data;
      
      return {
        success: true,
        notificationId
      };
    } catch (error: any) {
      console.error('خطأ في إرسال إشعار شحن الرصيد:', error);
      return {
        success: false,
        error: error.message || 'خطأ غير معروف في إرسال إشعار شحن الرصيد'
      };
    }
  }
}

// Export instance of the service
export const notificationService = new NotificationService(); 