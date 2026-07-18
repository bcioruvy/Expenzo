// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
// @ts-ignore
import { getFirestore } from 'firebase/firestore';

/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * Credentials are read from environment variables (see .env.example) instead of being
 * committed directly to source. Copy .env.example to .env and fill in your Firebase
 * project's values — find them in Firebase Console under Project Settings > General > Your Apps.
 *
 * NOTE: Until real values are provided, the application operates in a fully featured
 * local simulation mode so you can test and preview all functionality instantly!
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Check if the user has replaced the placeholder credentials
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: any = null;
let auth: any = null;
let db: any = null;

// Tracks whether Firebase actually initialized successfully — distinct from
// isFirebaseConfigured, which only checks that credentials look present.
// Previously, if initializeApp() threw despite real-looking credentials, the app
// would silently fall through to serving fake mock data with no visible warning
// that anything had gone wrong.
export let firebaseInitError: string | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Explicitly set local (IndexedDB-backed) persistence immediately on init, rather than
    // only when a "Remember me" login completes. This ensures every browser context — including
    // a fresh Safari tab opened by an iOS Shortcut — persists the session as durably as iOS
    // allows from the very first load, instead of depending on a prior login having already run
    // setAuthPersistence() in that specific context. This does not fix Safari-vs-Home-Screen-app
    // storage isolation on iOS (those remain separate origins), but it removes persistence itself
    // as a source of unnecessary re-logins within either context.
    setPersistence(auth, browserLocalPersistence).catch((err: any) => {
      console.warn('Failed to set Firebase Auth persistence:', err);
    });
  } catch (error: any) {
    console.error("Firebase initialization error:", error);
    firebaseInitError = error?.message || String(error);
  }
}

export { app, auth, db };
