import React, { useState } from 'react';
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'transactions': return <Transactions />;
      case 'accounts': return <Accounts />;
      case 'analytics': return <Analytics />;
      case 'budgets': return <Budgets />;
      case 'goals': return <Goals />;
      case 'reports': return <Reports />;
      case 'smart': return <SmartInsights setActiveTab={setActiveTab} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
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
