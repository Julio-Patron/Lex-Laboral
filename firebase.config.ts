import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "studio-6462708856-c0f94";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Defensive initialization to prevent white screen on missing config
let app;
let auth;
let db;
let ai;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing. Check your .env file.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  ai = getAI(app, {
    backend: new GoogleAIBackend()
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, ai };
export default app;
