import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config';
import { checkoutRequestService, CheckoutRequest } from './checkoutRequests';

// Interfaces para los tipos de datos
export interface Property {
  id?: string;
  name: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  isAvailable: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
  createdAt: Timestamp | Date;
  status?: string;
  faculty?: string;
  facultyEng?: string;  // إضافة حقل الكلية باللغة الإنجليزية
  branch?: string;
  batch?: string;
  studentId?: string;
  balance?: number;
}

export interface Reservation {
  id?: string;
  propertyId: string;
  propertyName?: string;
  userId: string;
  userName?: string;
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

// Función para convertir documentos de Firestore a objetos
const convertDoc = <T>(doc: DocumentSnapshot<DocumentData>): T => {
  try {
    const data = doc.data() || {};
    console.log(`Convirtiendo documento con ID: ${doc.id}`, data);

    // Verificar si hay campos de fecha y convertirlos correctamente
    const processedData: Record<string, any> = {};

    // Procesar cada campo del documento
    Object.entries(data).forEach(([key, value]) => {
      // Convertir Timestamp a Date para facilitar su manejo
      if (value instanceof Timestamp) {
        processedData[key] = value;
      } else {
        processedData[key] = value;
      }
    });

    // Asegurarse de que los campos requeridos existan
    if (doc.id.startsWith('user') || doc.id.length > 20) {
      // Probablemente es un documento de usuario
      if (!processedData.status) {
        processedData.status = 'طالب'; // Valor predeterminado para usuarios
      }
      if (!processedData.createdAt) {
        processedData.createdAt = new Date();
      }
    }

    const result = {
      id: doc.id,
      ...processedData,
    } as T;

    console.log(`Documento convertido:`, result);
    return result;
  } catch (error) {
    console.error('Error al convertir documento:', error, doc.id);
    // Devolver un objeto con al menos el ID en caso de error
    return { id: doc.id } as T;
  }
};

// Función para convertir una colección de documentos
const convertCollection = <T>(snapshot: QuerySnapshot<DocumentData>): T[] => {
  try {
    return snapshot.docs
      .filter(doc => doc.exists()) // Solo incluir documentos que existen
      .map(doc => convertDoc<T>(doc));
  } catch (error) {
    console.error('Error al convertir colección:', error);
    return [];
  }
};

// Servicios para propiedades
export const propertyService = {
  // Obtener todas las propiedades
  getAll: async (): Promise<Property[]> => {
    const q = query(collection(db, 'apartments'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return convertCollection<Property>(snapshot);
  },

  // Obtener una propiedad por ID
  getById: async (id: string): Promise<Property | null> => {
    const docRef = doc(db, 'apartments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertDoc<Property>(docSnap);
    }

    return null;
  },

  // Crear una nueva propiedad
  create: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date();
    const newProperty = {
      ...property,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, 'apartments'), newProperty);
    return docRef.id;
  },

  // Actualizar una propiedad
  update: async (id: string, property: Partial<Property>): Promise<void> => {
    const updateData = {
      ...property,
      updatedAt: new Date()
    };

    const docRef = doc(db, 'apartments', id);
    await updateDoc(docRef, updateData);
  },

  // Eliminar una propiedad
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, 'apartments', id);
    await deleteDoc(docRef);
  }
};

// Función para crear usuarios de prueba si no existen
const createDefaultUsers = async (): Promise<void> => {
  try {
    console.log('Verificando si es necesario crear usuarios predeterminados...');

    // Verificar si ya existen usuarios
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);

    if (snapshot.size === 0) {
      console.log('No se encontraron usuarios. Creando usuarios predeterminados...');

      // Crear usuarios predeterminados
      const defaultUsers = [
        {
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '+966501234567',
          role: 'user',
          status: 'طالب',
          faculty: 'حاسبات ومعلومات',
          facultyEng: 'IT',
          branch: 'فرع القاهرة',
          batch: '2023',
          studentId: 'ST12345',
          balance: 500,
          createdAt: new Date()
        },
        {
          name: 'فاطمة علي',
          email: 'fatima@example.com',
          phone: '+966507654321',
          role: 'user',
          status: 'طالب',
          faculty: 'هندسة',
          facultyEng: 'ENG',
          branch: 'فرع العريش',
          batch: '2022',
          studentId: 'ST67890',
          balance: 750,
          createdAt: new Date()
        },
        {
          name: 'محمد خالد',
          email: 'mohamed@example.com',
          phone: '+966509876543',
          role: 'user',
          status: 'صاحب عقار',
          faculty: 'طب',
          facultyEng: 'MED',
          branch: 'فرع القنطرة',
          batch: '2021',
          studentId: 'ST24680',
          balance: 1000,
          createdAt: new Date()
        }
      ];

      // Guardar usuarios en Firestore
      for (const user of defaultUsers) {
        await addDoc(usersCollection, user);
      }

      console.log('Usuarios predeterminados creados con éxito');
    } else {
      console.log(`Ya existen ${snapshot.size} usuarios en la base de datos`);
    }
  } catch (error) {
    console.error('Error al crear usuarios predeterminados:', error);
  }
};

// Servicios para usuarios
export const userService = {
  // Obtener todos los usuarios
  getAll: async (): Promise<User[]> => {
    try {
      console.log('Obteniendo usuarios desde Firebase...');

      // Verificar si es necesario crear usuarios predeterminados
      await createDefaultUsers();

      // Obtener todos los usuarios sin ordenamiento para evitar errores
      const q = query(collection(db, 'users'));

      const snapshot = await getDocs(q);
      const users = convertCollection<User>(snapshot);
      console.log(`Se obtuvieron ${users.length} usuarios de Firebase`);

      // Imprimir información detallada para depuración
      users.forEach((user, index) => {
        console.log(`Usuario ${index + 1}:`, {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt
        });
      });

      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      // En caso de error, devolver un array vacío en lugar de datos de prueba
      return [];
    }
  },

  // Obtener un usuario por ID
  getById: async (id: string): Promise<User | null> => {
    try {
      console.log(`Obteniendo usuario con ID: ${id}`);
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = convertDoc<User>(docSnap);
        console.log('Usuario encontrado:', userData);
        return userData;
      }

      console.log(`No se encontró usuario con ID: ${id}`);
      return null;
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return null;
    }
  },

  // Crear un nuevo usuario
  create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<string> => {
    // Asegurarse de que la fecha de creación sea un objeto Date válido
    const now = new Date();
    const newUser = {
      ...user,
      createdAt: now
    };

    console.log('Creando nuevo usuario con fecha:', now);
    const docRef = await addDoc(collection(db, 'users'), newUser);

    // Registrar la creación exitosa
    console.log(`Usuario creado con ID: ${docRef.id} y fecha: ${now}`);

    return docRef.id;
  },

  // Actualizar un usuario
  update: async (id: string, user: Partial<User>): Promise<void> => {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, user);
  },

  // Eliminar un usuario
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
  },

  // Verificar si un usuario es administrador
  isAdmin: async (id: string): Promise<boolean> => {
    const docRef = doc(db, 'admins', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }
};

// Servicios para reservaciones
export const reservationService = {
  // Obtener todas las reservaciones
  getAll: async (): Promise<Reservation[]> => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const reservations = convertCollection<Reservation>(snapshot);

    // Enriquecer con nombres de propiedades y usuarios
    for (const reservation of reservations) {
      if (reservation.propertyId) {
        const property = await propertyService.getById(reservation.propertyId);
        if (property) {
          reservation.propertyName = property.name;
        }
      }

      if (reservation.userId) {
        const user = await userService.getById(reservation.userId);
        if (user) {
          reservation.userName = user.name;
        }
      }
    }

    return reservations;
  },

  // Obtener una reservación por ID
  getById: async (id: string): Promise<Reservation | null> => {
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const reservation = convertDoc<Reservation>(docSnap);

      // Enriquecer con nombres de propiedad y usuario
      if (reservation.propertyId) {
        const property = await propertyService.getById(reservation.propertyId);
        if (property) {
          reservation.propertyName = property.name;
        }
      }

      if (reservation.userId) {
        const user = await userService.getById(reservation.userId);
        if (user) {
          reservation.userName = user.name;
        }
      }

      return reservation;
    }

    return null;
  },

  // Crear una nueva reservación
  create: async (reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<string> => {
    const newReservation = {
      ...reservation,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'bookings'), newReservation);
    return docRef.id;
  },

  // Actualizar una reservación
  update: async (id: string, reservation: Partial<Reservation>): Promise<void> => {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, reservation);
  },

  // Eliminar una reservación
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, 'bookings', id);
    await deleteDoc(docRef);
  },

  // Aprobar una reservación
  approve: async (id: string): Promise<void> => {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, { status: 'approved' });
  },

  // Rechazar una reservación
  reject: async (id: string): Promise<void> => {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, { status: 'rejected' });
  },

  // Obtener reservaciones recientes
  getRecent: async (limitCount: number = 5): Promise<Reservation[]> => {
    const q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const reservations = convertCollection<Reservation>(snapshot);

    // Enriquecer con nombres de propiedades y usuarios
    for (const reservation of reservations) {
      if (reservation.propertyId) {
        const property = await propertyService.getById(reservation.propertyId);
        if (property) {
          reservation.propertyName = property.name;
        }
      }

      if (reservation.userId) {
        const user = await userService.getById(reservation.userId);
        if (user) {
          reservation.userName = user.name;
        }
      }
    }

    return reservations;
  }
};

// Exportar el servicio de checkout requests
export { checkoutRequestService };
export type { CheckoutRequest };

// Servicios para el dashboard
export const dashboardService = {
  // Obtener estadísticas del dashboard
  getStats: async (): Promise<{
    propertiesCount: number;
    usersCount: number;
    reservationsCount: number;
    pendingReservationsCount: number;
    revenue: number;
    checkoutRequestsCount: number;
  }> => {
    // Obtener conteo de propiedades
    const propertiesSnapshot = await getDocs(collection(db, 'apartments'));
    const propertiesCount = propertiesSnapshot.size;

    // Obtener conteo de usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersCount = usersSnapshot.size;

    // Obtener conteo de reservaciones
    const reservationsSnapshot = await getDocs(collection(db, 'bookings'));
    const reservations = convertCollection<Reservation>(reservationsSnapshot);
    const reservationsCount = reservationsSnapshot.size;

    // Obtener conteo de checkout requests
    const checkoutRequestsSnapshot = await getDocs(collection(db, 'checkout_requests_backup'));
    const checkoutRequestsCount = checkoutRequestsSnapshot.size;

    // Obtener conteo de reservaciones pendientes
    const pendingReservationsCount = reservations.filter(r => r.status === 'pending').length;

    // Calcular ingresos totales (de reservaciones aprobadas)
    const revenue = reservations
      .filter(r => r.status === 'approved')
      .reduce((total, r) => total + r.totalPrice, 0);

    return {
      propertiesCount,
      usersCount,
      reservationsCount,
      pendingReservationsCount,
      revenue,
      checkoutRequestsCount
    };
  },

  // Obtener reservaciones recientes
  getRecentReservations: async (limitCount: number = 5): Promise<Reservation[]> => {
    return reservationService.getRecent(limitCount);
  },

  // Obtener usuarios recientes
  getRecentUsers: async (limitCount: number = 5): Promise<User[]> => {
    try {
      console.log(`Obteniendo los ${limitCount} usuarios más recientes...`);

      // Asegurarse de que la consulta ordene correctamente por fecha de creación
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const users = convertCollection<User>(snapshot);

      console.log(`Se obtuvieron ${users.length} usuarios recientes`);

      // Imprimir información detallada para depuración
      users.forEach((user, index) => {
        console.log(`Usuario reciente ${index + 1}:`, {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : 'No es Date'
        });
      });

      return users;
    } catch (error) {
      console.error('Error al obtener usuarios recientes:', error);
      return [];
    }
  },

  // Obtener propiedades más reservadas
  getTopProperties: async (limitCount: number = 5): Promise<{
    id: string;
    name: string;
    reservationsCount: number;
  }[]> => {
    // Obtener todas las reservaciones
    const reservationsSnapshot = await getDocs(collection(db, 'bookings'));
    const reservations = convertCollection<Reservation>(reservationsSnapshot);

    // Contar reservaciones por propiedad
    const propertyCounts: Record<string, number> = {};
    for (const reservation of reservations) {
      if (reservation.propertyId) {
        propertyCounts[reservation.propertyId] = (propertyCounts[reservation.propertyId] || 0) + 1;
      }
    }

    // Convertir a array y ordenar
    const propertyCountsArray = Object.entries(propertyCounts)
      .map(([propertyId, count]) => ({ propertyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount);

    // Obtener detalles de las propiedades
    const topProperties = [];
    for (const { propertyId, count } of propertyCountsArray) {
      const property = await propertyService.getById(propertyId);
      if (property) {
        topProperties.push({
          id: propertyId,
          name: property.name,
          reservationsCount: count
        });
      }
    }

    return topProperties;
  }
};
