import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

// الحصول على مثيل Firebase Functions
const functions = getFunctions();

// إذا كنا في بيئة التطوير، استخدم المحاكي المحلي
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Connected to Firebase Functions local emulator");
  } catch (error) {
    console.error("Failed to connect to Firebase Functions emulator:", error);
  }
}

/**
 * دالة لإرسال إشعار Push للمستخدم
 */
export const sendPushNotification = async (params: {
  token: string,
  notification: {
    title: string,
    body: string
  },
  data?: Record<string, string>
}) => {
  try {
    const sendPush = httpsCallable(functions, 'sendPushNotification');
    return await sendPush(params);
  } catch (error) {
    console.error("Error calling sendPushNotification:", error);
    throw error;
  }
}; 