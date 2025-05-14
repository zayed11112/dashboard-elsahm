import { Timestamp } from 'firebase/firestore';
import {
  Property as FirebaseProperty,
  User as FirebaseUser,
  Reservation as FirebaseReservation,
  CheckoutRequest as FirebaseCheckoutRequest
} from './services/firestore';

// Función para formatear fechas de Firestore
export const formatFirestoreDate = (date: Timestamp | Date): string => {
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('ar-SA');
  }
  return date.toLocaleDateString('ar-SA');
};

// Adaptadores para el Dashboard
export const dashboardAdapters = {
  // Adaptar reservaciones para el dashboard
  adaptReservation: (reservation: FirebaseReservation): any => {
    return {
      id: reservation.id || '',
      propertyName: reservation.propertyName || 'عقار غير معروف',
      userName: reservation.userName || 'مستخدم غير معروف',
      status: reservation.status,
      createdAt: reservation.createdAt instanceof Timestamp
        ? reservation.createdAt.toDate().toLocaleDateString('ar-SA')
        : (reservation.createdAt as Date).toLocaleDateString('ar-SA'),
      totalPrice: reservation.totalPrice,
      startDate: reservation.startDate instanceof Timestamp
        ? reservation.startDate.toDate().toLocaleDateString('ar-SA')
        : (reservation.startDate as Date).toLocaleDateString('ar-SA'),
      endDate: reservation.endDate instanceof Timestamp
        ? reservation.endDate.toDate().toLocaleDateString('ar-SA')
        : (reservation.endDate as Date).toLocaleDateString('ar-SA'),
      propertyId: reservation.propertyId,
      userId: reservation.userId,
    };
  },

  // Adaptar usuarios para el dashboard
  adaptUser: (user: FirebaseUser): any => {
    // Verificar si los datos existen antes de adaptarlos
    if (!user) return null;

    console.log('Adaptando usuario:', user);

    // Convertir fecha de creación
    let createdAtFormatted = '';
    let createdAtTimestamp: Date | null = null;

    if (user.createdAt) {
      if (user.createdAt instanceof Timestamp) {
        createdAtTimestamp = user.createdAt.toDate();
        createdAtFormatted = createdAtTimestamp.toLocaleDateString('ar-SA');
      } else if (user.createdAt instanceof Date) {
        createdAtTimestamp = user.createdAt;
        createdAtFormatted = createdAtTimestamp.toLocaleDateString('ar-SA');
      } else if (typeof user.createdAt === 'string') {
        createdAtTimestamp = new Date(user.createdAt);
        createdAtFormatted = createdAtTimestamp.toLocaleDateString('ar-SA');
      }
    } else {
      // Si no hay fecha de creación, usar la fecha actual
      createdAtTimestamp = new Date();
      createdAtFormatted = createdAtTimestamp.toLocaleDateString('ar-SA');
    }

    // Asignar un tipo de usuario predeterminado si no existe
    let userStatus = user.status || 'طالب';

    // Verificar si el estado es uno de los valores válidos
    const validStatuses = ['طالب', 'صاحب عقار', 'امتياز', 'وسيط'];
    if (!validStatuses.includes(userStatus)) {
      // Si el estado no es válido, asignar un valor predeterminado
      userStatus = 'طالب';
    }

    const adaptedUser = {
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: userStatus,
      // Guardar tanto la fecha formateada como el objeto Date original
      createdAt: createdAtFormatted,
      createdAtTimestamp: createdAtTimestamp ? createdAtTimestamp.toISOString() : new Date().toISOString(),
      avatarUrl: user.avatarUrl || '',
      // تضمين الحقول الإضافية
      faculty: user.faculty || '',
      facultyEng: user.facultyEng || 'IT', // القيمة الافتراضية للكلية باللغة الإنجليزية
      branch: user.branch || 'فرع القاهرة', // القيمة الافتراضية للفرع
      batch: user.batch || '',
      studentId: user.studentId || '',
      balance: user.balance || 0, // إضافة الرصيد مع قيمة افتراضية 0
    };

    console.log('Usuario adaptado:', adaptedUser);
    return adaptedUser;
  },

  // Adaptar propiedades para el dashboard
  adaptProperty: (property: FirebaseProperty): any => {
    return {
      id: property.id || '',
      name: property.name,
      description: property.description,
      price: property.price,
      location: property.location,
      address: property.location, // Para compatibilidad
      type: 'apartment', // Valor por defecto para compatibilidad
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      images: property.images,
      features: property.features,
      isAvailable: property.isAvailable,
      createdAt: property.createdAt instanceof Timestamp
        ? property.createdAt.toDate().toLocaleDateString('ar-SA')
        : (property.createdAt as Date).toLocaleDateString('ar-SA'),
      updatedAt: property.updatedAt instanceof Timestamp
        ? property.updatedAt.toDate().toLocaleDateString('ar-SA')
        : (property.updatedAt as Date).toLocaleDateString('ar-SA'),
    };
  },

  // Adaptar propiedades más reservadas para el dashboard
  adaptTopProperty: (property: { id: string; name: string; reservationsCount: number }): any => {
    return {
      id: property.id,
      name: property.name,
      reservationsCount: property.reservationsCount,
    };
  },

  // Adaptar solicitudes de checkout para el dashboard
  adaptCheckoutRequest: (request: FirebaseCheckoutRequest): any => {
    return {
      id: request.id || '',
      propertyId: request.property_id || '',
      propertyName: request.property_name || 'عقار غير معروف',
      customerName: request.customer_name || '',
      customerPhone: request.customer_phone || '',
      universityId: request.university_id || '',
      college: request.college || '',
      status: request.status || 'جاري المعالجة',
      commission: request.commission || 0,
      deposit: request.deposit || 0,
      propertyPrice: request.property_price || 0,
      userId: request.user_id || '',
      createdAt: request.created_at instanceof Timestamp
        ? request.created_at.toDate().toLocaleDateString('ar-SA')
        : (request.created_at as Date).toLocaleDateString('ar-SA'),
      updatedAt: request.updated_at instanceof Timestamp
        ? request.updated_at.toDate().toLocaleDateString('ar-SA')
        : request.updated_at
          ? (request.updated_at as Date).toLocaleDateString('ar-SA')
          : new Date().toLocaleDateString('ar-SA'),
    };
  }
};
