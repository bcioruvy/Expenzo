import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  PieChart, 
  Target, 
  FileText, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight,
  User,
  Zap,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals & Savings', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'smart', label: 'Smart Insights', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`relative transition-all duration-300 ease-in-out flex flex-col bg-white dark:bg-warm-dark-bg border-r border-warm-surface dark:border-warm-dark-surface h-screen z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Brand & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-warm-surface dark:border-warm-dark-surface h-16">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-warm-sage to-warm-dark-sage flex items-center justify-center shadow-md shadow-warm/20 flex-shrink-0">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-warm-text dark:text-warm-dark-text text-lg tracking-tight truncate">Expenzo</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-warm-sage to-warm-dark-sage flex items-center justify-center shadow-md shadow-warm/20 mx-auto">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-5 bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface text-warm-muted dark:text-warm-dark-muted rounded-full p-1 shadow-md hover:bg-warm-bg dark:hover:bg-warm-dark-surface transition-colors z-50 hidden md:flex"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-medium text-sm transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-warm-sage text-white shadow-lg shadow-warm/25 dark:shadow-warm/10' 
                  : 'text-warm-muted dark:text-warm-dark-muted hover:bg-warm-surface dark:hover:bg-warm-dark-card/60 hover:text-warm-text dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-warm-muted dark:text-warm-dark-muted group-hover:text-warm-sage'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-warm-dark-card text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-warm-surface dark:border-warm-dark-surface space-y-3 bg-warm-bg/50 dark:bg-warm-dark-bg/40">
        
        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 text-warm-text dark:text-warm-dark-muted hover:bg-warm-bg dark:hover:bg-warm-dark-surface/80 transition-all shadow-sm group"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-warm-gold dark:text-warm-dark-gold flex-shrink-0 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 text-warm-sage flex-shrink-0 group-hover:-rotate-12 transition-transform" />}
            {!isCollapsed && <span className="text-sm font-medium truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </div>
        </button>

        {/* User Profile Section */}
        <div className={`flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-warm-dark-card/80 border border-warm-surface dark:border-warm-dark-surface/50 shadow-sm ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.fullName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-warm-sage/30" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-warm-sage/10 border border-warm-sage/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-warm-sage" />
              </div>
            )}
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-warm-text dark:text-warm-dark-text truncate">{user?.fullName}</p>
                <p className="text-[10px] text-warm-muted dark:text-warm-dark-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-warm-dark-muted hover:text-warm-terracotta dark:text-warm-dark-terracotta rounded-xl hover:bg-warm-terracotta/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Logout button */}
        {isCollapsed && (
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="w-full flex items-center justify-center p-3 text-warm-dark-muted hover:text-warm-terracotta dark:text-warm-dark-terracotta rounded-2xl hover:bg-warm-terracotta/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

    </aside>
  );
};
