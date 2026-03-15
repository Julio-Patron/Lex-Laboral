import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAI, GoogleAIBackend } from "firebase/ai";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "studio-6462708856-c0f94";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXM2oj2V77iAXFVMzgKpZ8J28ET8Sq9Go",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "studio-6462708856-c0f94.firebaseapp.com",
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "studio-6462708856-c0f94.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "633653766713",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:633653766713:web:013fb5967a2ffb2345fbe8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-50HED5N9W5"
};

// Defensive initialization to prevent white screen on missing config
let app;
let auth;
let db;
let ai;
let functions;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing. Check your .env file.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  ai = getAI(app, {
    backend: new GoogleAIBackend()
  });

  // Connect to emulators in development mode
  if (import.meta.env.DEV) {
    console.log("Connecting to Firebase Emulators...");
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth, db, ai, functions };
export default app;
