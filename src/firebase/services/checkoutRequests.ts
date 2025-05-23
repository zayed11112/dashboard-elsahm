import { collection, query, orderBy, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '../config';

// تعريف واجهة طلب الحجز
export interface CheckoutRequest {
  id?: string;
  property_id: string;
  property_name: string;
  customer_name: string;
  customer_phone: string;
  university_id: string;
  college: string;
  status: string; // جاري المعالجة، مؤكد، ملغي
  commission?: number;
  deposit?: number;
  property_price?: number;
  user_id?: string;
  notes?: string;
  created_at: Timestamp | Date;
  updated_at?: Timestamp | Date;
}

// تحويل وثيقة Firestore إلى كائن CheckoutRequest
const convertDoc = <T>(doc: any): T => {
  return {
    id: doc.id,
    ...doc.data()
  } as T;
};

// تحويل مجموعة وثائق Firestore إلى مصفوفة من كائنات CheckoutRequest
const convertCollection = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((doc: any) => convertDoc<T>(doc));
};

// خدمة للتعامل مع طلبات الحجز من جدول checkout_requests_backup
export const checkoutRequestService = {
  // الحصول على جميع طلبات الحجز
  getAll: async (): Promise<CheckoutRequest[]> => {
    try {
      const q = query(collection(db, 'checkout_requests_backup'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return convertCollection<CheckoutRequest>(snapshot);
    } catch (error) {
      console.error('Error fetching checkout requests:', error);
      throw error;
    }
  },

  // الحصول على طلب حجز بواسطة المعرف
  getById: async (id: string): Promise<CheckoutRequest | null> => {
    try {
      const docRef = doc(db, 'checkout_requests_backup', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertDoc<CheckoutRequest>(docSnap);
      }

      return null;
    } catch (error) {
      console.error(`Error fetching checkout request with ID ${id}:`, error);
      throw error;
    }
  },

  // إنشاء طلب حجز جديد
  create: async (checkoutRequest: Omit<CheckoutRequest, 'id' | 'created_at'>): Promise<string> => {
    try {
      const newCheckoutRequest = {
        ...checkoutRequest,
        created_at: new Date(),
        updated_at: new Date(),
        status: checkoutRequest.status || 'جاري المعالجة'
      };

      const docRef = await addDoc(collection(db, 'checkout_requests_backup'), newCheckoutRequest);
      return docRef.id;
    } catch (error) {
      console.error('Error creating checkout request:', error);
      throw error;
    }
  },

  // تحديث طلب حجز
  update: async (id: string, checkoutRequest: Partial<CheckoutRequest>): Promise<void> => {
    try {
      const updateData = {
        ...checkoutRequest,
        updated_at: new Date()
      };

      const docRef = doc(db, 'checkout_requests_backup', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating checkout request with ID ${id}:`, error);
      throw error;
    }
  },

  // حذف طلب حجز
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'checkout_requests_backup', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting checkout request with ID ${id}:`, error);
      throw error;
    }
  },

  // تحديث حالة طلب الحجز
  updateStatus: async (id: string, status: string, notes?: string): Promise<void> => {
    try {
      const docRef = doc(db, 'checkout_requests_backup', id);
      
      // تحويل الحالة العربية إلى الإنجليزية للتخزين
      let dbStatus = status;
      if (status === 'جاري المعالجة') {
        dbStatus = 'pending';
      } else if (status === 'مؤكد') {
        dbStatus = 'confirmed';
      } else if (status === 'ملغي') {
        dbStatus = 'cancelled';
      }
      
      const updateData: any = { 
        status: dbStatus, 
        updated_at: new Date() 
      };
      
      // إضافة الملاحظات إذا تم توفيرها
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error(`Error updating status for checkout request with ID ${id}:`, error);
      throw error;
    }
  },

  // الحصول على طلبات الحجز حسب الحالة
  getByStatus: async (status: string): Promise<CheckoutRequest[]> => {
    try {
      const q = query(
        collection(db, 'checkout_requests_backup'),
        where('status', '==', status),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return convertCollection<CheckoutRequest>(snapshot);
    } catch (error) {
      console.error(`Error fetching checkout requests with status ${status}:`, error);
      throw error;
    }
  },

  // الحصول على طلبات الحجز الأخيرة
  getRecent: async (limit: number = 5): Promise<CheckoutRequest[]> => {
    try {
      const q = query(
        collection(db, 'checkout_requests_backup'),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      return convertCollection<CheckoutRequest>(snapshot).slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent checkout requests:', error);
      throw error;
    }
  }
};
