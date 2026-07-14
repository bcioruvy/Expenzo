import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthScreen } from './AuthScreen';
import { Shield } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-dark-bg text-warm-dark-text space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-warm-dark-sage/20 border border-warm-dark-sage flex items-center justify-center animate-bounce">
          <Shield className="w-8 h-8 text-warm-dark-sage" />
        </div>
        <p className="text-warm-dark-muted text-sm font-medium tracking-wide animate-pulse">Checking Secure Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};
