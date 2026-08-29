import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAWsDC3H-JbnNPaOsqnRYG7v6H0s-QgN4w",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0176274868.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0176274868",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0176274868.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "875855394939",
  appId: env.VITE_FIREBASE_APP_ID || "1:875855394939:web:dd38545542f4ac5a870ade"
};

export const isFirebaseConfigured = true;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
