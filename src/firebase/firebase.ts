// Firebase configuration and exports
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBco6LHTdUotjBpqwzAwLMOh4A6ERcfgxI",
  authDomain: "elsahm-d8ebd.firebaseapp.com",
  projectId: "elsahm-d8ebd",
  storageBucket: "elsahm-d8ebd.firebasestorage.app",
  messagingSenderId: "992039187831",
  appId: "1:992039187831:web:d84c394088380e5ca71d72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app; 