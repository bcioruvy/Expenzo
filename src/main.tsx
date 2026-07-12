import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { FinanceProvider } from './context/FinanceContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <App />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
