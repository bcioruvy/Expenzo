import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Check } from 'lucide-react';
import { LogoMark } from '../shared/LogoMark';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInGoogle, resetPass } = useAuth();
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // State indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (showForgotPassword) return true;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (activeTab === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (showForgotPassword) {
        await resetPass(email);
        setSuccessMessage('Password reset link sent to your email.');
      } else if (activeTab === 'signin') {
        await signIn(email, password, rememberMe);
      } else {
        await signUp(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg dark:bg-warm-dark-bg px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-warm-sage/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-warm-gold/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Card wrapper with animated border beam */}
      <div className="max-w-md w-full relative z-10 group">
        {/* Rotating gradient beam sitting behind the card, revealed through padding */}
        <div
          className="absolute -inset-[1px] rounded-3xl opacity-90"
          style={{
            background: 'conic-gradient(from var(--beam-angle), transparent 0%, transparent 78%, #6E8B74 86%, #C7A86B 92%, transparent 100%)',
            animation: 'border-beam-spin 4.5s linear infinite',
          }}
        ></div>

        <div className="max-w-md w-full space-y-5 bg-warm-card/95 dark:bg-warm-dark-card/95 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/50 shadow-2xl relative">
          <style>{`
            @property --beam-angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
            @keyframes border-beam-spin {
              from { --beam-angle: 0deg; }
              to { --beam-angle: 360deg; }
            }
          `}</style>
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <LogoMark size={56} />
          </div>
          <h2 className="text-2xl font-bold text-warm-text dark:text-warm-dark-text tracking-tight">
            {showForgotPassword ? 'Reset Password' : activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-1.5 text-sm text-warm-muted dark:text-warm-dark-muted">
            {showForgotPassword 
              ? 'Enter your email to receive a password reset link' 
              : activeTab === 'signin' 
              ? 'Sign in to your household dashboard' 
              : 'Start managing your household finances'}
          </p>
        </div>

        {/* Tabs */}
        {!showForgotPassword && (
          <div className="flex bg-warm-surface dark:bg-warm-dark-bg/60 p-1 rounded-2xl border border-warm-surface dark:border-warm-dark-surface/50">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'signin' ? 'bg-warm-sage text-white shadow-lg shadow-warm/30' : 'text-warm-muted dark:text-warm-dark-muted hover:text-warm-text dark:hover:text-warm-dark-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === 'signup' ? 'bg-warm-sage text-white shadow-lg shadow-warm/30' : 'text-warm-muted dark:text-warm-dark-muted hover:text-warm-text dark:hover:text-warm-dark-text'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-4 bg-warm-terracotta/10 border border-warm-terracotta/30 rounded-2xl text-warm-terracotta dark:text-warm-dark-terracotta text-sm flex items-center space-x-3 animate-pulse">
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-warm-sage/10 border border-warm-sage/30 rounded-2xl text-warm-sage dark:text-warm-dark-sage text-sm flex items-center space-x-3">
            <Check className="w-5 h-5 text-warm-sage dark:text-warm-dark-sage flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          
          {/* Full Name field for Sign Up */}
          {activeTab === 'signup' && !showForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-warm-muted dark:text-warm-dark-muted mb-1">Full Name</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-warm-muted" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full pl-12 pr-4 py-3 bg-warm-surface dark:bg-warm-dark-bg/50 border border-warm-surface dark:border-warm-dark-surface/50 rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-warm-muted/60 dark:placeholder-warm-dark-muted/60 focus:outline-none focus:border-warm-sage focus:ring-1 focus:ring-warm-sage transition-colors text-sm"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-warm-muted dark:text-warm-dark-muted mb-1">Email Address</label>
            <div className="relative rounded-2xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-warm-muted" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                className="block w-full pl-12 pr-4 py-3 bg-warm-surface dark:bg-warm-dark-bg/50 border border-warm-surface dark:border-warm-dark-surface/50 rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-warm-muted/60 dark:placeholder-warm-dark-muted/60 focus:outline-none focus:border-warm-sage focus:ring-1 focus:ring-warm-sage transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          {!showForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-warm-muted dark:text-warm-dark-muted mb-1">Password</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-warm-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-3 bg-warm-surface dark:bg-warm-dark-bg/50 border border-warm-surface dark:border-warm-dark-surface/50 rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-warm-muted/60 dark:placeholder-warm-dark-muted/60 focus:outline-none focus:border-warm-sage focus:ring-1 focus:ring-warm-sage transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-warm-muted dark:text-warm-dark-muted hover:text-warm-text dark:hover:text-warm-dark-text transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          {activeTab === 'signup' && !showForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-warm-muted dark:text-warm-dark-muted mb-1">Confirm Password</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-warm-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-3 bg-warm-surface dark:bg-warm-dark-bg/50 border border-warm-surface dark:border-warm-dark-surface/50 rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-warm-muted/60 dark:placeholder-warm-dark-muted/60 focus:outline-none focus:border-warm-sage focus:ring-1 focus:ring-warm-sage transition-colors text-sm"
                />
              </div>
            </div>
          )}

          {/* Additional Options */}
          {!showForgotPassword && activeTab === 'signin' && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-warm-surface dark:bg-warm-dark-bg border-warm-surface dark:border-warm-dark-surface text-warm-sage focus:ring-warm-sage focus:ring-offset-0"
                />
                <span className="text-warm-muted dark:text-warm-dark-muted transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); setSuccessMessage(''); }}
                className="text-warm-sage dark:text-warm-dark-sage hover:opacity-80 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-warm-sage to-warm-dark-sage hover:from-warm-sage hover:to-warm-dark-sage text-white font-semibold rounded-2xl shadow-xl shadow-warm/20 focus:outline-none focus:ring-2 focus:ring-warm-sage focus:ring-offset-2 focus:ring-offset-warm-card dark:focus:ring-offset-warm-dark-card transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : showForgotPassword ? 'Send Reset Link' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>

          {/* Back to sign in from forgot password */}
          {showForgotPassword && (
            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setError(''); setSuccessMessage(''); }}
              className="w-full py-3 bg-warm-surface dark:bg-warm-dark-bg/50 hover:bg-warm-surface dark:hover:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface/50 text-warm-muted dark:text-warm-dark-muted font-medium rounded-2xl transition-colors text-sm"
            >
              Back to Sign In
            </button>
          )}

          {/* Google Sign-In */}
          {!showForgotPassword && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-warm-surface dark:border-warm-dark-surface/50"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-warm-card dark:bg-warm-dark-card px-3 text-warm-muted dark:text-warm-dark-muted">Or continue with</span></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-warm-surface dark:bg-warm-dark-bg/50 hover:bg-warm-surface dark:hover:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface/50 text-warm-text dark:text-warm-dark-text font-medium rounded-2xl shadow-lg focus:outline-none transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </>
          )}

        </form>
        </div>
      </div>
    </div>
  );
};
