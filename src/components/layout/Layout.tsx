import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu } from 'lucide-react';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <span className="font-bold text-warm-text dark:text-warm-dark-text text-lg tracking-tight">Expenzo</span>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto page-transition-enter-active">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
};
