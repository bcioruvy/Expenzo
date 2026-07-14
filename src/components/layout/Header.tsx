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
    <header className="h-16 bg-white dark:bg-warm-dark-bg border-b border-warm-surface dark:border-warm-dark-surface px-6 sm:px-8 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md bg-white/80 dark:bg-warm-dark-bg/80">
      
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-warm-text dark:text-warm-dark-text tracking-tight capitalize">
          {tabTitles[activeTab] || activeTab}
        </h1>
      </div>

      {/* Action Bar */}
      <div className="flex items-center space-x-4">
        
        {/* Date Indicator (matches the specific 2026 prompt base) */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-warm-surface dark:bg-warm-dark-card/80 border border-warm-surface dark:border-warm-dark-surface/60 text-xs font-medium text-warm-muted dark:text-warm-dark-muted">
          <Calendar className="w-4 h-4 text-warm-sage" />
          <span>June 2026</span>
        </div>

        {/* Notifications Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2.5 rounded-xl bg-warm-surface dark:bg-warm-dark-card/80 border border-warm-surface dark:border-warm-dark-surface/60 text-warm-muted dark:text-warm-dark-muted hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors relative group"
          >
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-warm-terracotta border-2 border-white dark:border-warm-dark-surface rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface shadow-2xl z-50 overflow-hidden py-2">
              <div className="px-4 py-3 border-b border-warm-surface dark:border-warm-dark-surface/60 flex items-center justify-between">
                <span className="font-bold text-sm text-warm-text dark:text-warm-dark-text">Notifications</span>
                <span className="text-xs bg-warm-sage/10 text-warm-sage font-semibold px-2 py-0.5 rounded-full">{unreadCount} new</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-warm-surface dark:divide-warm-dark-surface/50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-xs text-warm-muted dark:text-warm-dark-muted">No new notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 transition-colors hover:bg-warm-bg dark:hover:bg-warm-dark-surface/40 flex items-start space-x-3 ${!n.isRead ? 'bg-warm-sage/5 dark:bg-warm-sage/10' : ''}`}>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold text-warm-text dark:text-warm-dark-text">{n.title}</p>
                        <p className="text-[11px] text-warm-muted dark:text-warm-dark-muted leading-relaxed">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          title="Mark as read"
                          className="p-1 text-warm-dark-muted hover:text-warm-sage dark:text-warm-dark-sage hover:bg-warm-sage/10 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-warm-surface dark:border-warm-dark-surface/60 text-center">
                <button
                  type="button"
                  onClick={() => { setShowNotificationDropdown(false); setActiveTab('smart'); }}
                  className="text-xs font-bold text-warm-sage hover:text-warm-sage dark:hover:text-warm-dark-sage transition-colors py-1"
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
