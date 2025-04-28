// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

export default app;
