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
  Zap
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
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals & Savings', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'smart', label: 'Smart Insights', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`relative transition-all duration-300 ease-in-out flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 h-screen z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Brand & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 h-16">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 flex-shrink-0">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight truncate">Expenzo</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 mx-auto">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full p-1 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-50 hidden md:flex"
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
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-sky-500'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
        
        {/* Dark/Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm group"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400 flex-shrink-0 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 text-sky-500 flex-shrink-0 group-hover:-rotate-12 transition-transform" />}
            {!isCollapsed && <span className="text-sm font-medium truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </div>
        </button>

        {/* User Profile Section */}
        <div className={`flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.fullName} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-sky-500/30" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-sky-500" />
              </div>
            )}
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors"
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
            className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-rose-500 rounded-2xl hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

    </aside>
  );
};
