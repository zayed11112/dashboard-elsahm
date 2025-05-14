import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, Timestamp, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

// Definir el tipo de notificación
export interface Notification {
  id: string;
  message: string;
  time: string;
  timestamp?: Timestamp;
  read: boolean;
  type: 'user' | 'property' | 'reservation' | 'system' | 'payment' | 'success' | 'error';
}

// Definir el tipo del contexto
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (messageOrObject: string | Partial<Notification>, type?: 'user' | 'property' | 'reservation' | 'system' | 'payment' | 'success' | 'error') => Promise<void>;
  loading: boolean;
}

// Crear el contexto con valores predeterminados
const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  addNotification: async () => {},
  loading: true,
});

// Hook personalizado para usar el contexto
export const useNotifications = () => useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: ReactNode;
}

// Proveedor del contexto
export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Calcular el número de notificaciones no leídas
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Cargar notificaciones desde Firestore
  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          message: data.message,
          time: formatTime(data.timestamp),
          timestamp: data.timestamp,
          read: data.read || false,
          type: data.type || 'system',
        });
      });
      setNotifications(notificationsList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Formatear el tiempo de la notificación
  const formatTime = (timestamp: Timestamp): string => {
    const now = new Date();
    const notificationTime = timestamp.toDate();
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'الآن';
    } else if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `منذ ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `منذ ${days} يوم`;
    }
  };

  // وظيفة لتحويل التاريخ إلى كائن Timestamp من Firestore
  const getTimestamp = (dateString?: string): Timestamp => {
    if (dateString) {
      return Timestamp.fromDate(new Date(dateString));
    }
    return Timestamp.now();
  };

  // Marcar una notificación como leída
  const markAsRead = async (id: string) => {
    try {
      const notificationDoc = doc(db, 'notifications', id);
      await updateDoc(notificationDoc, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(db, 'notifications', notification.id);
          batch.update(notificationRef, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Añadir una nueva notificación
  const addNotification = async (
    messageOrObject: string | Partial<Notification>, 
    type: 'user' | 'property' | 'reservation' | 'system' | 'payment' | 'success' | 'error' = 'system'
  ) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      
      // إذا كان المدخل هو نص (الطريقة القديمة)
      if (typeof messageOrObject === 'string') {
        await addDoc(notificationsRef, {
          message: messageOrObject,
          timestamp: Timestamp.now(),
          read: false,
          type,
        });
      } 
      // إذا كان المدخل كائن (الطريقة الجديدة)
      else {
        const { id, message, read = false, type: objectType = type, time } = messageOrObject;
        
        // إعداد بيانات الإشعار
        const notificationData: any = {
          message,
          timestamp: messageOrObject.timestamp || getTimestamp(time),
          read,
          type: objectType,
        };
        
        // إذا تم تحديد معرف، استخدم وثيقة محددة
        if (id) {
          const docRef = doc(db, 'notifications', id);
          await updateDoc(docRef, notificationData);
        } else {
          // إضافة وثيقة جديدة
          await addDoc(notificationsRef, notificationData);
        }
        
        // أضف الإشعار محليًا أيضًا للتحديث الفوري
        const newNotification: Notification = {
          id: id || `temp-${Date.now()}`,
          message: message || '',
          time: time || formatTime(Timestamp.now()),
          read,
          type: objectType,
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        loading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
