import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu, Wallet } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { LogoMark } from '../shared/LogoMark';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { initialLoadComplete } = useFinance();

  return (
    <div className="flex h-screen bg-warm-bg dark:bg-warm-dark-bg overflow-hidden">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden flex`}>
        <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-6 h-16 bg-warm-card dark:bg-warm-dark-bg border-b border-warm-surface dark:border-warm-dark-surface z-30 sticky top-0">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl text-warm-muted dark:text-warm-dark-muted hover:bg-warm-surface dark:hover:bg-warm-dark-card transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <LogoMark size={28} />
            <span className="font-bold text-warm-text dark:text-warm-dark-text text-lg tracking-tight">Expenzo</span>
          </div>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto page-transition-enter-active">
            {!initialLoadComplete ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-warm-sage/10 dark:bg-warm-dark-sage/15 border border-warm-sage/30 dark:border-warm-dark-sage/30 flex items-center justify-center animate-pulse">
                  <Wallet className="w-7 h-7 text-warm-sage dark:text-warm-dark-sage" />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-sage dark:bg-warm-dark-sage animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-sage dark:bg-warm-dark-sage animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-sage dark:bg-warm-dark-sage animate-bounce"></span>
                </div>
                <p className="text-sm font-medium text-warm-muted dark:text-warm-dark-muted tracking-wide">Loading your household finances...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </main>

      </div>

    </div>
  );
};
