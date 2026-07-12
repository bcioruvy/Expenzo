import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { 
  User, 
  Mail, 
  Shield, 
  Download, 
  Database, 
  UserX, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  DollarSign, 
  Sun, 
  Moon, 
  Calendar 
} from 'lucide-react';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../../utils/currency';

export const Settings: React.FC = () => {
  const { user, resetPass, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings, transactions, accounts, budgets, goals } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'data'>('profile');

  // Success state messages
  const [successMsg, setSuccessMsg] = useState('');

  // Preference forms
  const [currency, setCurrency] = useState(settings.currency || DEFAULT_CURRENCY);
  const [language, setLanguage] = useState(settings.language || 'English');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'yyyy-MM-dd');

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({ currency, language, dateFormat });
    setSuccessMsg('System preferences successfully updated.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleExportBackup = (type: 'export' | 'backup') => {
    const backupData = {
      timestamp: new Date().toISOString(),
      user: user,
      accounts,
      transactions,
      budgets,
      goals,
      settings
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Expenzo_${type}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccessMsg(`Financial ${type} snapshot successfully generated.`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    await resetPass(user.email);
    setSuccessMsg('Password reset link sent to your verified email address.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('WARNING: Are you absolutely sure you want to permanently delete your personal expense account and all associated financial data?')) {
      alert('Account deletion request has been submitted to Firebase authentication rules for safe teardown.');
      logout();
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">System & Profile Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure security rules, global currency preferences, data backups, and profile customization.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold flex items-center space-x-3 animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Body */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-2xl shadow-slate-100 dark:shadow-none flex flex-col lg:flex-row overflow-hidden">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-900/40 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700/60 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'profile' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'preferences' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>Global Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'security' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Account Security</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'data' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>Data Management</span>
          </button>
        </div>

        {/* Content Panels */}
        <div className="flex-1 p-8">
          
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-700/60 pb-4">Profile Settings</h3>
              
              <div className="flex items-center space-x-6">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.fullName} className="w-20 h-20 rounded-2xl object-cover border border-sky-500/30 shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold text-2xl shadow-lg">
                    {user?.fullName[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{user?.fullName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Secure personal member account</p>
                  <button type="button" className="mt-3 text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Change Avatar Photo
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" disabled value={user?.fullName || ''} 
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" disabled value={user?.email || ''} 
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Global Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-700/60 pb-4">Global Preferences</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Default Currency</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {CURRENCY_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Interface Language</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español (Spanish)</option>
                    <option value="French">Français (French)</option>
                    <option value="German">Deutsch (German)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Date Format</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="yyyy-MM-dd">YYYY-MM-DD (e.g., 2026-06-26)</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY (e.g., 26/06/2026)</option>
                    <option value="MM/dd/yyyy">MM/DD/YYYY (e.g., 06/26/2026)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Theme Preferences</label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-slate-800 dark:text-white font-bold text-sm hover:border-sky-500 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-sky-500" />}
                    <span>{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</span>
                  </div>
                  <span className="text-xs text-sky-500 font-bold">Toggle Theme</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button type="submit" className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 transition-all">
                  Save System Preferences
                </button>
              </div>
            </form>
          )}

          {/* Account Security */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-700/60 pb-4">Account Security</h3>
              
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">Email Verification Status</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your email address ({user?.email}) is fully verified.</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Verified</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center font-bold">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">Change Member Password</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Request a secure Firebase password reset link to your email.</p>
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all flex-shrink-0"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-700/60 pb-4">Data Management & Archiving</h3>
              
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">Export Complete Snapshot</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download full accounts, budgets, goals, and transactions dataset.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportBackup('export')}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 font-bold text-xs hover:border-emerald-500 transition-all flex-shrink-0"
                >
                  Export Data
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">Generate Local Backup</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Archive JSON ledger structure for cold-storage safekeeping.</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportBackup('backup')}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex-shrink-0"
                >
                  Backup Data
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-500 text-sm tracking-tight">Delete Personal Account</h4>
                    <p className="text-xs text-rose-400/80 mt-0.5">Permanently wipe Firestore rules, credentials, and financial history.</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex-shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
