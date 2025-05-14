import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config';

// Interfaz para el usuario autenticado
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}

// Static password for dashboard access
const STATIC_PASSWORD = "Okaeslam2020###";

// Servicio de autenticación
export const authService = {
  // Iniciar sesión con correo y contraseña
  login: async (email: string, password: string): Promise<AuthUser> => {
    try {
      // Check if this is a static password login (our custom system)
      if (password === STATIC_PASSWORD) {
        // Return mock admin user
        return {
          id: 'admin',
          email: email || 'admin@elsahm.com',
          name: 'Admin',
          role: 'admin'
        };
      }
      
      // If not using static password, proceed with Firebase auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verificar si el usuario es administrador
      const isAdmin = await checkIfAdmin(user.uid);
      
      if (!isAdmin) {
        await signOut(auth);
        throw new Error('No tienes permisos de administrador');
      }
      
      // Obtener datos adicionales del usuario desde Firestore
      const userData = await getUserData(user.uid);
      
      return {
        id: user.uid,
        email: user.email || '',
        name: userData?.name,
        role: 'admin',
        avatarUrl: userData?.avatarUrl
      };
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  },
  
  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      // Clear local storage (for our custom auth)
      localStorage.removeItem('authToken');
      
      // Also sign out from Firebase if needed
      await signOut(auth);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  },
  
  // Registrar un nuevo usuario administrador
  registerAdmin: async (email: string, password: string, name: string): Promise<AuthUser> => {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Crear documento de usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email: user.email,
        role: 'admin',
        createdAt: new Date()
      });
      
      // Marcar como administrador
      await setDoc(doc(db, 'admins', user.uid), {
        isAdmin: true,
        createdAt: new Date()
      });
      
      return {
        id: user.uid,
        email: user.email || '',
        name,
        role: 'admin'
      };
    } catch (error: any) {
      console.error('Error al registrar administrador:', error);
      throw new Error(error.message || 'Error al registrar administrador');
    }
  },
  
  // Obtener el usuario actual
  getCurrentUser: (): Promise<AuthUser | null> => {
    return new Promise((resolve) => {
      // Check for our custom auth token first
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        // Return mock admin user
        resolve({
          id: 'admin',
          email: 'admin@elsahm.com',
          name: 'Admin',
          role: 'admin'
        });
        return;
      }
      
      // If not using custom auth, proceed with Firebase
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (user) {
          // Verificar si es administrador
          const isAdmin = await checkIfAdmin(user.uid);
          
          if (!isAdmin) {
            resolve(null);
            return;
          }
          
          // Obtener datos adicionales
          const userData = await getUserData(user.uid);
          
          resolve({
            id: user.uid,
            email: user.email || '',
            name: userData?.name,
            role: 'admin',
            avatarUrl: userData?.avatarUrl
          });
        } else {
          resolve(null);
        }
      });
    });
  }
};

// Función auxiliar para verificar si un usuario es administrador
async function checkIfAdmin(userId: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error al verificar permisos de administrador:', error);
    return false;
  }
}

// Función auxiliar para obtener datos adicionales del usuario
async function getUserData(userId: string): Promise<any | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
}
