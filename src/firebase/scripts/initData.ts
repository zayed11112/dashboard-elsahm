import { 
  collection, 
  doc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config';

// Función para inicializar datos de prueba
export const initializeTestData = async () => {
  try {
    console.log('Inicializando datos de prueba...');
    
    // Crear usuario administrador
    const adminEmail = 'admin@elsahm.com';
    const adminPassword = 'Admin123!';
    
    try {
      // Intentar crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const userId = userCredential.user.uid;
      
      // Crear documento de usuario en Firestore
      await setDoc(doc(db, 'users', userId), {
        name: 'مدير النظام',
        email: adminEmail,
        role: 'admin',
        createdAt: Timestamp.now()
      });
      
      // Marcar como administrador
      await setDoc(doc(db, 'admins', userId), {
        isAdmin: true,
        createdAt: Timestamp.now()
      });
      
      console.log('Usuario administrador creado con éxito');
    } catch (error: any) {
      // Si el usuario ya existe, ignorar el error
      if (error.code === 'auth/email-already-in-use') {
        console.log('El usuario administrador ya existe');
      } else {
        throw error;
      }
    }
    
    // Crear propiedades de ejemplo
    const properties = [
      {
        id: 'prop1',
        name: 'شقة فاخرة في الرياض',
        description: 'شقة فاخرة في حي النخيل بالرياض، مؤثثة بالكامل مع إطلالة رائعة',
        price: 1500,
        location: 'الرياض، حي النخيل',
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
        features: ['مكيف', 'مسبح', 'موقف سيارات', 'أمن'],
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        id: 'prop2',
        name: 'استوديو حديث في جدة',
        description: 'استوديو حديث في حي الشاطئ بجدة، قريب من البحر والخدمات',
        price: 800,
        location: 'جدة، حي الشاطئ',
        bedrooms: 1,
        bathrooms: 1,
        area: 60,
        images: [
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
        ],
        features: ['مكيف', 'انترنت', 'مطبخ مجهز'],
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        id: 'prop3',
        name: 'فيلا فاخرة في الدمام',
        description: 'فيلا فاخرة في حي الشاطئ بالدمام، مناسبة للعائلات الكبيرة',
        price: 2500,
        location: 'الدمام، حي الشاطئ',
        bedrooms: 5,
        bathrooms: 4,
        area: 300,
        images: [
          'https://example.com/image5.jpg',
          'https://example.com/image6.jpg',
        ],
        features: ['مكيف', 'مسبح', 'حديقة', 'موقف سيارات', 'أمن'],
        isAvailable: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];
    
    // Guardar propiedades en Firestore
    for (const property of properties) {
      const { id, ...propertyData } = property;
      await setDoc(doc(db, 'apartments', id), propertyData);
    }
    
    console.log('Propiedades creadas con éxito');
    
    // Crear usuarios de ejemplo
    const users = [
      {
        id: 'user1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '+966501234567',
        role: 'user',
        createdAt: Timestamp.now(),
      },
      {
        id: 'user2',
        name: 'فاطمة علي',
        email: 'fatima@example.com',
        phone: '+966507654321',
        role: 'user',
        createdAt: Timestamp.now(),
      },
    ];
    
    // Guardar usuarios en Firestore
    for (const user of users) {
      const { id, ...userData } = user;
      await setDoc(doc(db, 'users', id), userData);
    }
    
    console.log('Usuarios creados con éxito');
    
    // Crear reservaciones de ejemplo
    const bookings = [
      {
        id: 'booking1',
        propertyId: 'prop1',
        userId: 'user1',
        startDate: Timestamp.fromDate(new Date(2023, 11, 1)),
        endDate: Timestamp.fromDate(new Date(2023, 11, 7)),
        totalPrice: 10500,
        status: 'approved',
        createdAt: Timestamp.now(),
      },
      {
        id: 'booking2',
        propertyId: 'prop2',
        userId: 'user2',
        startDate: Timestamp.fromDate(new Date(2023, 11, 10)),
        endDate: Timestamp.fromDate(new Date(2023, 11, 15)),
        totalPrice: 4000,
        status: 'pending',
        createdAt: Timestamp.now(),
      },
      {
        id: 'booking3',
        propertyId: 'prop3',
        userId: 'user1',
        startDate: Timestamp.fromDate(new Date(2023, 12, 1)),
        endDate: Timestamp.fromDate(new Date(2023, 12, 10)),
        totalPrice: 25000,
        status: 'pending',
        createdAt: Timestamp.now(),
      },
    ];
    
    // Guardar reservaciones en Firestore
    for (const booking of bookings) {
      const { id, ...bookingData } = booking;
      await setDoc(doc(db, 'bookings', id), bookingData);
    }
    
    console.log('Reservaciones creadas con éxito');
    
    console.log('Datos de prueba inicializados con éxito');
    return true;
  } catch (error) {
    console.error('Error al inicializar datos de prueba:', error);
    return false;
  }
};

// Ejecutar la función si se llama directamente
if (require.main === module) {
  initializeTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
