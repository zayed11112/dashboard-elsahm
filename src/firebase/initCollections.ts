import { collection, getDocs, query, limit, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Función para inicializar la colección de notificaciones si no existe
export const initNotificationsCollection = async () => {
  try {
    // Verificar si ya existen notificaciones
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, limit(1));
    const snapshot = await getDocs(q);

    // Si no hay notificaciones, crear algunas por defecto
    if (snapshot.empty) {
      console.log('Inicializando colección de notificaciones...');
      
      const defaultNotifications = [
        {
          message: 'مرحبًا بك في لوحة تحكم السهم للتسكين',
          timestamp: Timestamp.now(),
          read: false,
          type: 'system',
        },
        {
          message: 'تم تهيئة النظام بنجاح',
          timestamp: Timestamp.now(),
          read: false,
          type: 'system',
        }
      ];

      // Guardar notificaciones en Firestore
      for (const notification of defaultNotifications) {
        await addDoc(notificationsRef, notification);
      }

      console.log('تم إنشاء الإشعارات الافتراضية بنجاح');
    } else {
      console.log('تم العثور على إشعارات موجودة بالفعل');
    }
  } catch (error) {
    console.error('خطأ في تهيئة الإشعارات:', error);
  }
};

// Función para inicializar todas las colecciones
export const initAllCollections = async () => {
  await initNotificationsCollection();
};
