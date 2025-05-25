import { db } from '../firebase/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, arrayUnion, Timestamp, where, deleteDoc } from 'firebase/firestore';

export interface ComplaintResponse {
  id: string;
  responseText: string;
  responderId: string;
  responderName: string;
  isAdmin: boolean;
  createdAt: Date;
  imageUrl?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: Date;
  responses: ComplaintResponse[];
  imageUrl?: string;
}

/**
 * Fetches all complaints from Firestore
 */
export const fetchAllComplaints = async (): Promise<Complaint[]> => {
  try {
    const q = query(
      collection(db, 'complaints'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Transform Firestore timestamp to Date
      const createdAt = data.createdAt?.toDate() || new Date();
      
      // Transform responses timestamps
      const responses = data.responses?.map((response: any) => ({
        ...response,
        createdAt: response.createdAt?.toDate() || new Date(),
        imageUrl: response.imageUrl || undefined,
      })) || [];
      
      return {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || '',
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'open',
        createdAt,
        responses,
        imageUrl: data.imageUrl || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

/**
 * Fetches complaints filtered by status
 */
export const fetchComplaintsByStatus = async (status: string): Promise<Complaint[]> => {
  try {
    const q = query(
      collection(db, 'complaints'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Transform Firestore timestamp to Date
      const createdAt = data.createdAt?.toDate() || new Date();
      
      // Transform responses timestamps
      const responses = data.responses?.map((response: any) => ({
        ...response,
        createdAt: response.createdAt?.toDate() || new Date(),
        imageUrl: response.imageUrl || undefined,
      })) || [];
      
      return {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || '',
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'open',
        createdAt,
        responses,
        imageUrl: data.imageUrl || undefined,
      };
    });
  } catch (error) {
    console.error(`Error fetching ${status} complaints:`, error);
    throw error;
  }
};

/**
 * Fetches a single complaint by ID
 */
export const fetchComplaintById = async (complaintId: string): Promise<Complaint | null> => {
  try {
    const docRef = doc(db, 'complaints', complaintId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Transform Firestore timestamp to Date
      const createdAt = data.createdAt?.toDate() || new Date();
      
      // Transform responses timestamps
      const responses = data.responses?.map((response: any) => ({
        ...response,
        createdAt: response.createdAt?.toDate() || new Date(),
        imageUrl: response.imageUrl || undefined,
      })) || [];
      
      return {
        id: docSnap.id,
        userId: data.userId || '',
        userName: data.userName || '',
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'open',
        createdAt,
        responses,
        imageUrl: data.imageUrl || undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching complaint:', error);
    throw error;
  }
};

/**
 * Updates the status of a complaint
 */
export const updateComplaintStatus = async (
  complaintId: string, 
  newStatus: 'open' | 'in-progress' | 'closed'
): Promise<void> => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, {
      status: newStatus,
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw error;
  }
};

/**
 * Adds an admin response to a complaint
 */
export const addAdminResponse = async (
  complaintId: string, 
  responseText: string, 
  adminId: string,
  adminName: string,
  imageUrl?: string
): Promise<void> => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    
    const response = {
      id: Date.now().toString(), // simple ID generation
      responseText,
      responderId: adminId,
      responderName: adminName,
      isAdmin: true,
      createdAt: Timestamp.now(),
      imageUrl: imageUrl || null,
    };
    
    await updateDoc(complaintRef, {
      responses: arrayUnion(response),
      // Automatically set status to in-progress if it was open
      status: 'in-progress',
    });
  } catch (error) {
    console.error('Error adding response:', error);
    throw error;
  }
};

/**
 * Deletes a complaint from Firestore
 */
export const deleteComplaint = async (complaintId: string): Promise<void> => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await deleteDoc(complaintRef);
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
}; 