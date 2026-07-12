// @ts-ignore
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  signOut, 
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { UserProfile } from '../types';

// Mock user for simulation mode
const MOCK_USER: UserProfile = {
  uid: 'mock-user-123',
  email: 'john.doe@example.com',
  fullName: 'John Doe',
  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  emailVerified: true,
  createdAt: new Date().toISOString()
};

let currentMockUser: UserProfile | null = MOCK_USER;

export const setAuthPersistence = async (rememberMe: boolean): Promise<void> => {
  if (!isFirebaseConfigured || !auth) return;
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  await setPersistence(auth, persistence);
};

export const signUpWithEmail = async (email: string, password: string, fullName: string): Promise<UserProfile> => {
  if (!isFirebaseConfigured || !auth) {
    currentMockUser = {
      uid: 'mock-user-' + Date.now(),
      email,
      fullName,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    };
    return currentMockUser;
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: fullName });
  await sendEmailVerification(userCredential.user);
  
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    fullName,
    photoURL: userCredential.user.photoURL || undefined,
    emailVerified: userCredential.user.emailVerified,
    createdAt: userCredential.user.metadata.creationTime || new Date().toISOString()
  };
};

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean): Promise<UserProfile> => {
  if (!isFirebaseConfigured || !auth) {
    if (email === currentMockUser?.email || email === 'john.doe@example.com') {
      return currentMockUser!;
    }
    currentMockUser = {
      uid: 'mock-user-' + Date.now(),
      email,
      fullName: email.split('@')[0].toUpperCase(),
      emailVerified: true,
      createdAt: new Date().toISOString(),
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    };
    return currentMockUser;
  }

  await setAuthPersistence(rememberMe);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    fullName: userCredential.user.displayName || email.split('@')[0],
    photoURL: userCredential.user.photoURL || undefined,
    emailVerified: userCredential.user.emailVerified,
    createdAt: userCredential.user.metadata.creationTime || new Date().toISOString()
  };
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  if (!isFirebaseConfigured || !auth) {
    currentMockUser = {
      uid: 'google-mock-user',
      email: 'alex.smith@gmail.com',
      fullName: 'Alex Smith',
      photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };
    return currentMockUser;
  }

  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    fullName: userCredential.user.displayName || 'Google User',
    photoURL: userCredential.user.photoURL || undefined,
    emailVerified: userCredential.user.emailVerified,
    createdAt: userCredential.user.metadata.creationTime || new Date().toISOString()
  };
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!isFirebaseConfigured || !auth) {
    console.log(`Password reset email simulated for ${email}`);
    return;
  }
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) {
    currentMockUser = null;
    return;
  }
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: UserProfile | null) => void): (() => void) => {
  if (!isFirebaseConfigured || !auth) {
    callback(currentMockUser);
    return () => {};
  }

  return firebaseOnAuthStateChanged(auth, (firebaseUser: any) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        fullName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      });
    } else {
      callback(null);
    }
  });
};
