/**
 * Cloud Functions for Firebase - Elsahm App Push Notifications
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// تهيئة Firebase Admin SDK
admin.initializeApp();

/**
 * إرسال إشعار Push للمستخدم
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  // CORS already handled by onCall functions
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
  // CORS already handled by onCall functions
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

    // 2. الحصول على FCM tokens للمستخدم من مصفوفة fcmTokens
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `لم يتم العثور على المستخدم بالمعرّف: ${userId}`
      );
    }

    const userData = userDoc.data();
    
    // التحقق من وجود مصفوفة fcmTokens
    if (!userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
      functions.logger.warn(`لم يتم العثور على FCM tokens للمستخدم: ${userId}`);
      
      // استخدام التوكن القديم اذا كان موجوداً (للتوافق مع الإصدارات القديمة)
      if (userData.fcmToken) {
        functions.logger.info(`استخدام توكن قديم للمستخدم: ${userId}`);
        await sendSingleNotification(userData.fcmToken, title, body, type, notificationRef.id, targetScreen);
      } else {
        functions.logger.warn(`لا يمكن إرسال إشعار Push للمستخدم: ${userId} - لا يوجد أي token FCM`);
      }
      
      return {
        success: true,
        notificationId: notificationRef.id,
        messageId: null,
        tokensCount: 0
      };
    }

    // 3. إرسال إشعار Push لكل جهاز
    const tokens = userData.fcmTokens.map(tokenObj => tokenObj.token);
    const validTokens = [];
    const results = [];
    
    functions.logger.info(`إرسال إشعار إلى ${tokens.length} جهاز للمستخدم ${userId}`);
    
    // إرسال إشعار لكل توكن
    for (let i = 0; i < tokens.length; i++) {
      try {
        const token = tokens[i];
        if (!token) continue;
        
        validTokens.push(token);
        const messageId = await sendSingleNotification(token, title, body, type, notificationRef.id, targetScreen);
        results.push({ token, messageId });
        
        functions.logger.info(`تم إرسال الإشعار بنجاح للجهاز ${i+1}`, { messageId });
      } catch (err) {
        functions.logger.error(`فشل إرسال الإشعار للجهاز ${i+1}`, { error: err });
      }
    }
    
    functions.logger.info('تم إرسال الإشعارات بنجاح', {
      notificationId: notificationRef.id,
      tokensCount: validTokens.length,
      results,
    });

    return {
      success: true,
      notificationId: notificationRef.id,
      tokensCount: validTokens.length,
      results,
    };
  } catch (error) {
    functions.logger.error('خطأ في إرسال الإشعار', { error });
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// دالة مساعدة لإرسال إشعار لتوكن واحد
async function sendSingleNotification(token, title, body, type, notificationId, targetScreen = null) {
  const message = {
    notification: {
      title,
      body,
    },
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      type,
      notification_id: notificationId,
      ...(targetScreen && { target_screen: targetScreen }),
    },
    token: token,
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

  return await admin.messaging().send(message);
}

/**
 * دالة لإرسال إشعار عند الموافقة على طلب شحن الرصيد
 */
exports.sendWalletRechargeNotification = functions.https.onCall(async (data, context) => {
  // CORS already handled by onCall functions
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

    // استخدام دالة sendNotification للإرسال
    const result = await exports.sendNotification({
      data: {
        userId,
        title: 'تم شحن رصيدك بنجاح',
        body: `تم إضافة ${amount} ${currency} إلى رصيد محفظتك بنجاح`,
        type: 'wallet',
        targetScreen: 'walletScreen',
        additionalData: {
          amount,
          currency
        }
      },
      auth: context.auth
    });

    return result;
  } catch (error) {
    functions.logger.error('خطأ في إرسال إشعار شحن الرصيد', { error });
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 