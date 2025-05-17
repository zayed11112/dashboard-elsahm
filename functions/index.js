/**
 * Cloud Functions for Firebase - Elsahm App Push Notifications
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK
admin.initializeApp();

/**
 * إرسال إشعار Push للمستخدم
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  try {
    // التحقق من صلاحية المستخدم (يمكن إضافة المزيد من التحقق حسب الحاجة)
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'يجب تسجيل الدخول لاستخدام هذه الوظيفة'
      );
    }

    // التحقق من وجود البيانات المطلوبة
    const { token, notification, data: messageData } = data;

    if (!token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'يجب توفير رمز FCM (token) للمستخدم'
      );
    }

    if (!notification || !notification.title || !notification.body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'يجب توفير عنوان ومحتوى الإشعار'
      );
    }

    // إنشاء رسالة الإشعار
    const message = {
      token,
      notification,
      data: messageData || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'high_importance_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    // إرسال الإشعار
    const response = await admin.messaging().send(message);
    
    functions.logger.info('تم إرسال الإشعار بنجاح', {
      messageId: response,
      recipientToken: token,
    });

    return { success: true, messageId: response };
  } catch (error) {
    functions.logger.error('خطأ في إرسال الإشعار', { error });
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * إضافة إشعار للمستخدم في Firestore وإرسال إشعار Push
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
  try {
    // التحقق من صلاحية المستخدم
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'يجب تسجيل الدخول لاستخدام هذه الوظيفة'
      );
    }

    // التحقق من وجود البيانات المطلوبة
    const { userId, title, body, type = 'general', targetScreen = null, additionalData = null } = data;

    if (!userId || !title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'يجب توفير معرف المستخدم، عنوان الإشعار والمحتوى'
      );
    }

    // 1. إنشاء وثيقة الإشعار في Firestore
    const notificationRef = admin.firestore()
      .collection('notifications')
      .doc(userId)
      .collection('notifications')
      .doc();
      
    await notificationRef.set({
      userId,
      title,
      body,
      type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      additionalData,
      targetScreen,
    });

    // 2. الحصول على FCM token للمستخدم
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `لم يتم العثور على المستخدم بالمعرّف: ${userId}`
      );
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;
    
    if (!fcmToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `لم يتم العثور على FCM token للمستخدم: ${userId}`
      );
    }

    // 3. إرسال إشعار Push
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        type,
        notification_id: notificationRef.id,
        ...(targetScreen && { target_screen: targetScreen }),
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'high_importance_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    
    functions.logger.info('تم إرسال الإشعار بنجاح', {
      notificationId: notificationRef.id,
      messageId: response,
    });

    return {
      success: true,
      notificationId: notificationRef.id,
      messageId: response
    };
  } catch (error) {
    functions.logger.error('خطأ في إرسال الإشعار', { error });
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * دالة لإرسال إشعار عند الموافقة على طلب شحن الرصيد
 */
exports.sendWalletRechargeNotification = functions.https.onCall(async (data, context) => {
  try {
    // التحقق من صلاحية المستخدم
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'يجب تسجيل الدخول لاستخدام هذه الوظيفة'
      );
    }

    const { userId, amount, currency = 'جنيه' } = data;

    if (!userId || !amount) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'يجب توفير معرف المستخدم والمبلغ'
      );
    }

    // استخدام دالة sendNotification السابقة لإرسال إشعار شحن الرصيد
    return await exports.sendNotification.run({
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
  } catch (error) {
    functions.logger.error('خطأ في إرسال إشعار شحن الرصيد', { error });
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 