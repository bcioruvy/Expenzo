// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth } from 'firebase/auth';
// @ts-ignore
import { getFirestore } from 'firebase/firestore';

/**
 * FIREBASE CONFIGURATION
 * ----------------------
 * Replace the placeholder values below with your actual Firebase project credentials.
 * You can find these in your Firebase Console under Project Settings > General > Your Apps.
 * 
 * NOTE: Until you replace these placeholders, the application operates in a fully featured
 * local simulation mode so you can test and preview all functionality instantly!
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDHlrHJNsDl5oBqVHLuIl-LOfi4gCMQsu0",
  authDomain: "expenzo-c9ab0.firebaseapp.com",
  projectId: "expenzo-c9ab0",
  storageBucket: "expenzo-c9ab0.firebasestorage.app",
  messagingSenderId: "625037762919",
  appId: "1:625037762919:web:32bd15760f8a205e58cfc2"
};

// Check if the user has replaced the placeholder credentials
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export { app, auth, db };
