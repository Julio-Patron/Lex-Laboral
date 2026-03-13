
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXM2oj2V77iAXFVMzgKpZ8J28ET8Sq9Go",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studio-6462708856-c0f94.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "studio-6462708856-c0f94",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studio-6462708856-c0f94.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "633653766713",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:633653766713:web:013fb5967a2ffb2345fbe8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-50HED5N9W5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
