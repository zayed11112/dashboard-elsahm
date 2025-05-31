// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase - usando las mismas credenciales que en la app Flutter
const firebaseConfig = {
  apiKey: "AIzaSyBco6LHTdUotjBpqwzAwLMOh4A6ERcfgxI",
  authDomain: "elsahm-d8ebd.firebaseapp.com",
  projectId: "elsahm-d8ebd",
  storageBucket: "elsahm-d8ebd.firebasestorage.app",
  messagingSenderId: "992039187831",
  appId: "1:992039187831:web:d84c394088380e5ca71d72"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Firestore logging level
// This will suppress warnings like BloomFilter errors
// Options: 'debug', 'error', 'silent', 'warn', 'info'
if (process.env.NODE_ENV === 'production') {
  // In production, only show errors
  setLogLevel('error');
} else {
  // In development, you might want to see warnings
  // but you can change to 'error' if the BloomFilter warnings are annoying
  setLogLevel('error');
}

export default app;
