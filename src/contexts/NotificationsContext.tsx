import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, Timestamp, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

// Definir el tipo de notificación
export interface Notification {
  id: string;
  message: string;
  time: string;
  timestamp: Timestamp;
  read: boolean;
  type: 'user' | 'property' | 'reservation' | 'system';
}

// Definir el tipo del contexto
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (message: string, type: 'user' | 'property' | 'reservation' | 'system') => Promise<void>;
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
  const addNotification = async (message: string, type: 'user' | 'property' | 'reservation' | 'system') => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        message,
        timestamp: Timestamp.now(),
        read: false,
        type,
      });
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
