import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { Transactions } from './components/transactions/Transactions';
import { Accounts } from './components/accounts/Accounts';
import { Analytics } from './components/analytics/Analytics';
import { Budgets } from './components/budgets/Budgets';
import { Goals } from './components/goals/Goals';
import { Reports } from './components/reports/Reports';
import { SmartInsights } from './components/smart/SmartInsights';
import { Settings } from './components/settings/Settings';

// Actions that can be triggered by an external link (e.g. an iOS Shortcut) via a URL like
// https://expenzo-home.vercel.app/?action=add-expense&amount=500
const VALID_ACTIONS = ['add-expense', 'add-income', 'transfer'];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoAction, setAutoAction] = useState<{ action: string; amount?: string } | null>(null);

  // Read ?action=/&amount= from the URL once on load (e.g. opened via an iOS Shortcut),
  // route to the Dashboard, and clean the URL so refreshing doesn't re-trigger the modal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action && VALID_ACTIONS.includes(action)) {
      setActiveTab('dashboard');
      setAutoAction({ action, amount: params.get('amount') || undefined });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard
          setActiveTab={setActiveTab}
          autoAction={autoAction}
          onAutoActionHandled={() => setAutoAction(null)}
        />
      );
      case 'transactions': return <Transactions />;
      case 'accounts': return <Accounts />;
      case 'analytics': return <Analytics />;
      case 'budgets': return <Budgets />;
      case 'goals': return <Goals />;
      case 'reports': return <Reports />;
      case 'smart': return <SmartInsights setActiveTab={setActiveTab} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActiveTab={setActiveTab} autoAction={autoAction} onAutoActionHandled={() => setAutoAction(null)} />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </ProtectedRoute>
  );
};

export default App;
