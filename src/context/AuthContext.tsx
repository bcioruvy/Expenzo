import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  logoutUser, 
  resetPassword, 
  subscribeToAuthChanges 
} from '../firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string, remember: boolean) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPass: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string, remember: boolean) => {
    setLoading(true);
    try {
      const u = await signInWithEmail(email, pass, remember);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const u = await signUpWithEmail(email, pass, name);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const u = await signInWithGoogle();
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPass = async (email: string) => {
    await resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInGoogle, logout, resetPass }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
