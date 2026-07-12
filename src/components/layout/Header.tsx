import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Bell, Search, Calendar, Check, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { notifications, markNotificationAsRead } = useFinance();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const tabTitles: Record<string, string> = {
    dashboard: 'Financial Overview',
    transactions: 'All Transactions',
    analytics: 'Financial Analytics',
    budgets: 'Budget Management',
    goals: 'Savings Goals',
    reports: 'Financial Reports',
    smart: 'Smart Insights & Recommendations',
    settings: 'System & User Settings',
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md bg-white/80 dark:bg-[#0f172a]/80">
      
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight capitalize">
          {tabTitles[activeTab] || activeTab}
        </h1>
      </div>

      {/* Action Bar */}
      <div className="flex items-center space-x-4">
        
        {/* Date Indicator (matches the specific 2026 prompt base) */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-sky-500" />
          <span>June 2026</span>
        </div>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative group"
          >
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden py-2">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-white">Notifications</span>
                <span className="text-xs bg-sky-500/10 text-sky-500 font-semibold px-2 py-0.5 rounded-full">{unreadCount} new</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No new notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40 flex items-start space-x-3 ${!n.isRead ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''}`}>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          title="Mark as read"
                          className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-700/60 text-center">
                <button
                  type="button"
                  onClick={() => { setShowNotificationDropdown(false); setActiveTab('smart'); }}
                  className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors py-1"
                >
                  View All Alerts & Insights
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
