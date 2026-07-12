import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthScreen } from './AuthScreen';
import { Shield } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500 flex items-center justify-center animate-bounce">
          <Shield className="w-8 h-8 text-sky-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Checking Secure Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};
