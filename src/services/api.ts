import {
  propertyService,
  userService,
  reservationService,
  dashboardService,
  checkoutRequestService,
  Property as FirebaseProperty,
  User as FirebaseUser,
  Reservation as FirebaseReservation,
  CheckoutRequest as FirebaseCheckoutRequest
} from '../firebase/services/firestore';
import { dashboardAdapters } from '../firebase/adapters';

// Properties API
export const propertiesApi = {
  getAll: async (params?: any) => {
    const properties = await propertyService.getAll();
    // Adaptar propiedades para el dashboard
    const adaptedProperties = properties.map(property => dashboardAdapters.adaptProperty(property));
    return { data: adaptedProperties };
  },

  getById: async (id: string) => {
    const property = await propertyService.getById(id);
    // Adaptar propiedad para el dashboard
    const adaptedProperty = property ? dashboardAdapters.adaptProperty(property) : null;
    return { data: adaptedProperty };
  },

  create: async (data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Omit<FirebaseProperty, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name,
      description: data.description,
      price: data.price,
      location: data.address || data.location,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area: data.area,
      images: data.images || [],
      features: data.features || [],
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
    };

    const id = await propertyService.create(firebaseData);
    return { data: { id } };
  },

  update: async (id: string, data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Partial<FirebaseProperty> = {};

    if (data.name !== undefined) firebaseData.name = data.name;
    if (data.description !== undefined) firebaseData.description = data.description;
    if (data.price !== undefined) firebaseData.price = data.price;
    if (data.address !== undefined || data.location !== undefined) {
      firebaseData.location = data.address || data.location;
    }
    if (data.bedrooms !== undefined) firebaseData.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) firebaseData.bathrooms = data.bathrooms;
    if (data.area !== undefined) firebaseData.area = data.area;
    if (data.images !== undefined) firebaseData.images = data.images;
    if (data.features !== undefined) firebaseData.features = data.features;
    if (data.isAvailable !== undefined) firebaseData.isAvailable = data.isAvailable;

    await propertyService.update(id, firebaseData);
    return { data: { success: true } };
  },

  delete: async (id: string) => {
    await propertyService.delete(id);
    return { data: { success: true } };
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: any) => {
    console.log('Obteniendo usuarios con parámetros:', params);

    try {
      // Obtener todos los usuarios de Firebase
      const users = await userService.getAll();
      console.log(`Se obtuvieron ${users.length} usuarios sin filtrar`);

      // Verificar si hay usuarios
      if (users.length === 0) {
        console.log('No se encontraron usuarios en la base de datos');
        return { data: [] };
      }

      // Adaptar usuarios para el dashboard
      let adaptedUsers = users
        .filter(user => user) // Filtrar valores nulos o undefined
        .map(user => dashboardAdapters.adaptUser(user))
        .filter(user => user); // Filtrar adaptaciones fallidas

      console.log(`Se adaptaron ${adaptedUsers.length} usuarios`);

      // Verificar si hay usuarios adaptados
      if (adaptedUsers.length === 0) {
        console.log('No se pudieron adaptar los usuarios correctamente');

        // Intentar adaptar manualmente
        adaptedUsers = users.map(user => ({
          id: user.id || '',
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || user.phoneNumber || '',
          role: user.role || 'user',
          status: 'طالب', // Valor predeterminado
          createdAt: new Date().toLocaleDateString('ar-SA'),
          faculty: '',
          facultyEng: 'IT',
          branch: 'فرع القاهرة',
          batch: '',
          studentId: '',
          balance: 0
        }));

        console.log(`Se adaptaron manualmente ${adaptedUsers.length} usuarios`);
      }

      // Aplicar filtros si existen
      if (params) {
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          adaptedUsers = adaptedUsers.filter(user =>
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.phone && user.phone.toLowerCase().includes(searchLower))
          );
        }

        if (params.role) {
          adaptedUsers = adaptedUsers.filter(user => user.role === params.role);
        }

        if (params.status) {
          adaptedUsers = adaptedUsers.filter(user => user.status === params.status);
        }

        console.log(`Después de filtrar: ${adaptedUsers.length} usuarios`);
      }

      return { data: adaptedUsers };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return { data: [] }; // Devolver array vacío en caso de error
    }
  },

  getById: async (id: string) => {
    try {
      console.log(`Obteniendo usuario con ID: ${id}`);
      const user = await userService.getById(id);

      // Adaptar usuario para el dashboard
      const adaptedUser = user ? dashboardAdapters.adaptUser(user) : null;

      if (adaptedUser) {
        console.log('Usuario encontrado y adaptado:', adaptedUser);
      } else {
        console.log(`No se encontró usuario con ID: ${id}`);
      }

      return { data: adaptedUser };
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return { data: null };
    }
  },

  create: async (data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Omit<FirebaseUser, 'id' | 'createdAt'> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      phoneNumber: data.phone, // Add phoneNumber for mobile app compatibility
      role: data.role === 'admin' ? 'admin' : 'user',
      avatarUrl: data.avatarUrl,
      status: data.status,
      faculty: data.faculty,
      facultyEng: data.facultyEng,
      branch: data.branch,
      batch: data.batch,
      studentId: data.studentId,
      balance: data.balance !== undefined ? Number(data.balance) : 0,
    };

    const id = await userService.create(firebaseData);
    return { data: { id } };
  },

  update: async (id: string, data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Partial<FirebaseUser> = {};

    if (data.name !== undefined) firebaseData.name = data.name;
    if (data.email !== undefined) firebaseData.email = data.email;
    if (data.phone !== undefined) {
      firebaseData.phone = data.phone;
      firebaseData.phoneNumber = data.phone; // Also update phoneNumber for mobile app compatibility
    }
    if (data.role !== undefined) firebaseData.role = data.role === 'admin' ? 'admin' : 'user';
    if (data.avatarUrl !== undefined) firebaseData.avatarUrl = data.avatarUrl;
    if (data.status !== undefined) firebaseData.status = data.status;
    if (data.faculty !== undefined) firebaseData.faculty = data.faculty;
    if (data.facultyEng !== undefined) firebaseData.facultyEng = data.facultyEng;
    if (data.branch !== undefined) firebaseData.branch = data.branch;
    if (data.batch !== undefined) firebaseData.batch = data.batch;
    if (data.studentId !== undefined) firebaseData.studentId = data.studentId;
    if (data.balance !== undefined) firebaseData.balance = Number(data.balance);

    await userService.update(id, firebaseData);
    return { data: { success: true } };
  },

  delete: async (id: string) => {
    await userService.delete(id);
    return { data: { success: true } };
  },
};

// Reservations API
export const reservationsApi = {
  getAll: async (params?: any) => {
    const reservations = await reservationService.getAll();
    // Adaptar reservaciones para el dashboard
    const adaptedReservations = reservations.map(reservation =>
      dashboardAdapters.adaptReservation(reservation)
    );
    return { data: adaptedReservations };
  },

  getById: async (id: string) => {
    const reservation = await reservationService.getById(id);
    // Adaptar reservación para el dashboard
    const adaptedReservation = reservation ? dashboardAdapters.adaptReservation(reservation) : null;
    return { data: adaptedReservation };
  },

  create: async (data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Omit<FirebaseReservation, 'id' | 'createdAt'> = {
      propertyId: data.propertyId,
      userId: data.userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      totalPrice: data.totalPrice,
      status: data.status || 'pending',
    };

    const id = await reservationService.create(firebaseData);
    return { data: { id } };
  },

  update: async (id: string, data: any) => {
    // Convertir datos del dashboard a formato de Firebase
    const firebaseData: Partial<FirebaseReservation> = {};

    if (data.propertyId !== undefined) firebaseData.propertyId = data.propertyId;
    if (data.userId !== undefined) firebaseData.userId = data.userId;
    if (data.startDate !== undefined) firebaseData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) firebaseData.endDate = new Date(data.endDate);
    if (data.totalPrice !== undefined) firebaseData.totalPrice = data.totalPrice;
    if (data.status !== undefined) firebaseData.status = data.status;

    await reservationService.update(id, firebaseData);
    return { data: { success: true } };
  },

  delete: async (id: string) => {
    await reservationService.delete(id);
    return { data: { success: true } };
  },

  approve: async (id: string) => {
    await reservationService.approve(id);
    return { data: { success: true } };
  },

  reject: async (id: string) => {
    await reservationService.reject(id);
    return { data: { success: true } };
  },
};

// Checkout Requests API
export const checkoutRequestsApi = {
  getAll: async (params?: any) => {
    try {
      const checkoutRequests = await checkoutRequestService.getAll();

      // Adaptar los datos para el dashboard
      const adaptedRequests = checkoutRequests.map(request => {
        // Map database status values to Arabic UI values
        let uiStatus = request.status || 'جاري المعالجة';
        if (request.status === 'pending') {
          uiStatus = 'جاري المعالجة';
        } else if (request.status === 'confirmed') {
          uiStatus = 'مؤكد';
        } else if (request.status === 'cancelled') {
          uiStatus = 'ملغي';
        }
        
        return {
          id: request.id || '',
          propertyId: request.property_id || '',
          propertyName: request.property_name || '',
          customerName: request.customer_name || '',
          customerPhone: request.customer_phone || '',
          universityId: request.university_id || '',
          college: request.college || '',
          status: uiStatus,
          commission: request.commission || 0,
          deposit: request.deposit || 0,
          propertyPrice: request.property_price || 0,
          userId: request.user_id || '',
          notes: request.notes || '',
          createdAt: request.created_at instanceof Date
            ? request.created_at.toLocaleDateString('ar-SA')
            : new Date().toLocaleDateString('ar-SA'),
          updatedAt: request.updated_at instanceof Date
            ? request.updated_at.toLocaleDateString('ar-SA')
            : new Date().toLocaleDateString('ar-SA'),
        };
      });

      // Aplicar filtros si existen
      let filteredRequests = [...adaptedRequests];

      if (params) {
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          filteredRequests = filteredRequests.filter(request =>
            (request.propertyName && request.propertyName.toLowerCase().includes(searchLower)) ||
            (request.customerName && request.customerName.toLowerCase().includes(searchLower)) ||
            (request.customerPhone && request.customerPhone.toLowerCase().includes(searchLower))
          );
        }

        if (params.status) {
          filteredRequests = filteredRequests.filter(request => request.status === params.status);
        }
      }

      return { data: filteredRequests };
    } catch (error) {
      console.error('Error al obtener solicitudes de checkout:', error);
      return { data: [] };
    }
  },

  getById: async (id: string) => {
    try {
      const request = await checkoutRequestService.getById(id);

      if (!request) {
        return { data: null };
      }

      // Map database status values to Arabic UI values
      let uiStatus = request.status || 'جاري المعالجة';
      if (request.status === 'pending') {
        uiStatus = 'جاري المعالجة';
      } else if (request.status === 'confirmed') {
        uiStatus = 'مؤكد';
      } else if (request.status === 'cancelled') {
        uiStatus = 'ملغي';
      }

      // Adaptar para el dashboard
      const adaptedRequest = {
        id: request.id || '',
        propertyId: request.property_id || '',
        propertyName: request.property_name || '',
        customerName: request.customer_name || '',
        customerPhone: request.customer_phone || '',
        universityId: request.university_id || '',
        college: request.college || '',
        status: uiStatus,
        commission: request.commission || 0,
        deposit: request.deposit || 0,
        propertyPrice: request.property_price || 0,
        userId: request.user_id || '',
        notes: request.notes || '',
        createdAt: request.created_at instanceof Date
          ? request.created_at.toLocaleDateString('ar-SA')
          : new Date().toLocaleDateString('ar-SA'),
        updatedAt: request.updated_at instanceof Date
          ? request.updated_at.toLocaleDateString('ar-SA')
          : new Date().toLocaleDateString('ar-SA'),
      };

      return { data: adaptedRequest };
    } catch (error) {
      console.error(`Error al obtener solicitud de checkout con ID ${id}:`, error);
      return { data: null };
    }
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    try {
      await checkoutRequestService.updateStatus(id, status, notes);
      return { data: { success: true } };
    } catch (error) {
      console.error(`Error al actualizar estado de solicitud ${id}:`, error);
      return { data: { success: false, error: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  },

  delete: async (id: string) => {
    try {
      await checkoutRequestService.delete(id);
      return { data: { success: true } };
    } catch (error) {
      console.error(`Error al eliminar solicitud ${id}:`, error);
      return { data: { success: false, error: error instanceof Error ? error.message : 'Error desconocido' } };
    }
  },

  getRecent: async (limit: number = 5) => {
    try {
      const requests = await checkoutRequestService.getRecent(limit);

      // Adaptar para el dashboard
      const adaptedRequests = requests.map(request => {
        // Map database status values to Arabic UI values
        let uiStatus = request.status || 'جاري المعالجة';
        if (request.status === 'pending') {
          uiStatus = 'جاري المعالجة';
        } else if (request.status === 'confirmed') {
          uiStatus = 'مؤكد';
        } else if (request.status === 'cancelled') {
          uiStatus = 'ملغي';
        }
        
        return {
          id: request.id || '',
          propertyName: request.property_name || '',
          customerName: request.customer_name || '',
          status: uiStatus,
          createdAt: request.created_at instanceof Date
            ? request.created_at.toLocaleDateString('ar-SA')
            : new Date().toLocaleDateString('ar-SA'),
        };
      });

      return { data: adaptedRequests };
    } catch (error) {
      console.error('Error al obtener solicitudes recientes:', error);
      return { data: [] };
    }
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const stats = await dashboardService.getStats();
    return { data: stats };
  },

  getRecentReservations: async () => {
    const reservations = await dashboardService.getRecentReservations();
    // Adaptar reservaciones para el dashboard
    const adaptedReservations = reservations.map(reservation =>
      dashboardAdapters.adaptReservation(reservation)
    );
    return { data: adaptedReservations };
  },

  getRecentUsers: async () => {
    const users = await dashboardService.getRecentUsers();
    // Adaptar usuarios para el dashboard
    const adaptedUsers = users.map(user => dashboardAdapters.adaptUser(user));
    return { data: adaptedUsers };
  },

  getAllUsers: async () => {
    // Reutilizar la función existente de usersApi
    return usersApi.getAll();
  },

  getTopProperties: async () => {
    const properties = await dashboardService.getTopProperties();
    // Adaptar propiedades para el dashboard
    const adaptedProperties = properties.map(property =>
      dashboardAdapters.adaptTopProperty(property)
    );
    return { data: adaptedProperties };
  },
};