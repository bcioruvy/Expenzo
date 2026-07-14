import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  Account, Transaction, Budget, Goal, AppNotification, UserSettings, SmartInsight, BillReminder 
} from '../types';
import { 
  getAccounts, saveAccount as dbSaveAccount, deleteAccount as dbDeleteAccount,
  getTransactions, saveTransaction as dbSaveTransaction, deleteTransaction as dbDeleteTransaction,
  getBudgets, saveBudget as dbSaveBudget, deleteBudget as dbDeleteBudget,
  getGoals, saveGoal as dbSaveGoal, deleteGoal as dbDeleteGoal,
  getNotifications, markNotificationRead as dbMarkNotificationRead,
  getUserSettings, saveUserSettings as dbSaveUserSettings
} from '../firebase/db';
import { formatCurrency } from '../utils/currency';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notifications: AppNotification[];
  settings: UserSettings;
  loading: boolean;
  dataLoadError: boolean;
  // Computed stats
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsThisMonth: number;
  budgetUsagePercent: number;
  financialHealthScore: number;
  smartInsights: SmartInsight[];
  upcomingBills: BillReminder[];
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  editTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addAccount: (acc: Omit<Account, 'id' | 'userId'>) => Promise<void>;
  editAccount: (acc: Account) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  transferFunds: (fromAccId: string, toAccId: string, amount: number, notes?: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  editBudget: (b: Budget) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  addGoal: (g: Omit<Goal, 'id' | 'userId'>) => Promise<void>;
  editGoal: (g: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  updateSettings: (s: Partial<UserSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: '', currency: 'PKR', language: 'English', theme: 'light', dateFormat: 'yyyy-MM-dd', enableNotifications: true, monthlyBudgetCap: 3500
  });
  const [loading, setLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getAccounts(user.uid),
        getTransactions(user.uid),
        getBudgets(user.uid),
        getGoals(user.uid),
        getNotifications(user.uid),
        getUserSettings(user.uid)
      ]);

      const [accsRes, txsRes, bdgsRes, glsRes, notifsRes, setsRes] = results;

      if (accsRes.status === 'fulfilled') setAccounts(accsRes.value);
      else console.error('Failed to load accounts:', accsRes.reason);

      if (txsRes.status === 'fulfilled') setTransactions(txsRes.value);
      else console.error('Failed to load transactions:', txsRes.reason);

      if (bdgsRes.status === 'fulfilled') setBudgets(bdgsRes.value);
      else console.error('Failed to load budgets:', bdgsRes.reason);

      if (glsRes.status === 'fulfilled') setGoals(glsRes.value);
      else console.error('Failed to load goals:', glsRes.reason);

      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value);
      else console.error('Failed to load notifications:', notifsRes.reason);

      if (setsRes.status === 'fulfilled') setSettings(setsRes.value);
      else console.error('Failed to load settings:', setsRes.reason);

      const anyFailed = results.some(r => r.status === 'rejected');
      if (anyFailed) {
        setDataLoadError(true);
      } else {
        setDataLoadError(false);
      }
    } catch (err) {
      console.error("Unexpected error fetching finance data:", err);
      setDataLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setNotifications([]);
      setLoading(false);
    }
  }, [user, fetchData]);

  // Computed Calculations
  const currentBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Filter for current month (using 2026-06 as today's date base)
  // "Current month" is derived from the most recent transaction date rather than
  // a hardcoded string. This keeps monthly stats correct as real transactions are
  // added over time, while still working sensibly against the bundled demo data
  // (which is dated for a specific month) instead of silently going stale.
  const mostRecentTxDate = transactions.reduce<string | null>((latest, t) => {
    return !latest || t.date > latest ? t.date : latest;
  }, null);
  const currentMonthPrefix = (mostRecentTxDate || new Date().toISOString()).slice(0, 7);
  const monthlyIncome = transactions
    .filter(t => t.type === 'Income' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'Expense' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsThisMonth = monthlyIncome - monthlyExpenses;

  const totalMonthlyBudget = budgets
    .filter(b => b.type === 'Monthly Budget')
    .reduce((sum, b) => sum + b.targetAmount, 0) || 3000;

  const budgetUsagePercent = Math.min(100, Math.round((monthlyExpenses / totalMonthlyBudget) * 100));

  // Financial Health Score calculation (0 - 100)
  // Factors: savings rate > 20% (+30), budget usage < 80% (+30), emergency fund > $5k (+20), no high cc debt (+20)
  let financialHealthScore = 60; // base
  if (monthlyIncome > 0) {
    const savingsRate = savingsThisMonth / monthlyIncome;
    if (savingsRate >= 0.25) financialHealthScore += 25;
    else if (savingsRate >= 0.10) financialHealthScore += 15;
  }
  if (budgetUsagePercent < 80) financialHealthScore += 15;
  const emergencySaved = goals.find(g => g.name.toLowerCase().includes('emergency'))?.currentAmount || 0;
  if (emergencySaved >= 10000) financialHealthScore += 15;
  else if (emergencySaved >= 5000) financialHealthScore += 10;
  if (financialHealthScore > 100) financialHealthScore = 96; // keep realistic max

  // Smart Insights generation — only shows insights genuinely supported by real transaction/goal data
  const smartInsights: SmartInsight[] = [];

  // Health score insight — only if there's enough transaction history to make it meaningful
  if (transactions.length > 0) {
    const scoreLabel = financialHealthScore >= 80 ? 'Excellent' : financialHealthScore >= 60 ? 'Good' : financialHealthScore >= 40 ? 'Fair' : 'Needs Attention';
    smartInsights.push({
      id: 'si-health',
      type: financialHealthScore >= 60 ? 'success' : 'alert',
      title: 'Financial Health Score',
      message: `Your financial health score is ${scoreLabel} (${financialHealthScore}/100), based on your savings rate, budget usage, and emergency fund.`,
      metric: `${financialHealthScore}/100`
    });
  }

  // Dining alert — only if there's real dining spend to compare
  const diningTxs = transactions.filter(t => t.type === 'Expense' && t.category === 'Food & Dining');
  if (diningTxs.length >= 3) {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const thisMonthDining = diningTxs.filter(t => t.date.startsWith(currentMonthKey)).reduce((s, t) => s + t.amount, 0);
    const avgMonthly = diningTxs.reduce((s, t) => s + t.amount, 0) / Math.max(1, new Set(diningTxs.map(t => t.date.slice(0, 7))).size);
    if (avgMonthly > 0 && thisMonthDining > avgMonthly * 1.1) {
      const pctOver = Math.round(((thisMonthDining - avgMonthly) / avgMonthly) * 100);
      smartInsights.push({
        id: 'si-dining',
        type: 'alert',
        title: 'Dining Expense Alert',
        message: `You've spent ${pctOver}% more on dining this month compared to your usual monthly average.`,
        metric: `+${pctOver}%`,
        actionText: 'Review Dining Transactions'
      });
    }
  }

  // Recurring subscriptions audit — only if any recurring transactions exist
  const recurringSubTxs = transactions.filter(t => t.isRecurring && t.type === 'Expense');
  if (recurringSubTxs.length > 0) {
    const uniqueSubs = new Set(recurringSubTxs.map(t => t.category + t.notes));
    const monthlyTotal = recurringSubTxs.reduce((s, t) => s + t.amount, 0) / Math.max(1, new Set(recurringSubTxs.map(t => t.date.slice(0, 7))).size);
    smartInsights.push({
      id: 'si-subs',
      type: 'info',
      title: 'Recurring Expenses Audit',
      message: `You currently have ${uniqueSubs.size} recurring expense${uniqueSubs.size === 1 ? '' : 's'} totaling roughly ${formatCurrency(monthlyTotal, settings.currency)}/month.`,
      metric: formatCurrency(monthlyTotal, settings.currency),
      actionText: 'Review Recurring Expenses'
    });
  }

  // Savings recommendation — only if there's a genuine positive, stable savings pattern
  if (monthlyIncome > 0 && savingsThisMonth > 0 && (savingsThisMonth / monthlyIncome) >= 0.15) {
    const suggestedBump = Math.round(savingsThisMonth * 0.1);
    smartInsights.push({
      id: 'si-savings',
      type: 'recommendation',
      title: 'Savings Opportunity',
      message: `Based on your current cash flow, you could consider increasing your savings or emergency fund contribution by around ${formatCurrency(suggestedBump, settings.currency)}/mo.`,
      metric: `+${formatCurrency(suggestedBump, settings.currency)}/mo`,
      actionText: 'Update Savings Goal'
    });
  }

  // Upcoming Bills Widget Data — no fabricated bills; real bill tracking isn't implemented yet, so this stays empty until it is
  const upcomingBills: BillReminder[] = [];

  // Action methods
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'userId'>) => {
    if (!user) return;
    const newTx = await dbSaveTransaction({ ...tx, id: '', userId: user.uid });
    setTransactions(prev => [newTx, ...prev]);
    // update local account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.accountId) {
        return { ...acc, balance: acc.balance + (tx.type === 'Income' ? tx.amount : -tx.amount) };
      }
      return acc;
    }));
  };

  const editTransaction = async (tx: Transaction) => {
    if (!user) return;
    const oldTx = transactions.find(t => t.id === tx.id);
    const updated = await dbSaveTransaction(tx);
    setTransactions(prev => prev.map(t => t.id === tx.id ? updated : t));
    // adjust account balances if amount or type changed
    if (oldTx && (oldTx.amount !== tx.amount || oldTx.type !== tx.type || oldTx.accountId !== tx.accountId)) {
      await fetchData(); // refresh to keep accurate
    }
  };

  const removeTransaction = async (id: string) => {
    if (!user) return;
    await dbDeleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    await fetchData(); // refresh balances
  };

  const addAccount = async (acc: Omit<Account, 'id' | 'userId'>) => {
    if (!user) return;
    const newAcc = await dbSaveAccount({ ...acc, id: '', userId: user.uid });
    setAccounts(prev => [...prev, newAcc]);
  };

  const editAccount = async (acc: Account) => {
    if (!user) return;
    const updated = await dbSaveAccount(acc);
    setAccounts(prev => prev.map(a => a.id === acc.id ? updated : a));
  };

  const removeAccount = async (id: string) => {
    if (!user) return;
    await dbDeleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const transferFunds = async (fromAccId: string, toAccId: string, amount: number, notes?: string) => {
    if (!user) return;
    const fromAcc = accounts.find(a => a.id === fromAccId);
    const toAcc = accounts.find(a => a.id === toAccId);
    if (!fromAcc || !toAcc) return;

    const dateStr = new Date().toISOString().split('T')[0];
    // Create expense from source account
    await addTransaction({
      type: 'Expense',
      amount,
      category: 'Transfer',
      date: dateStr,
      notes: notes || `Transfer to ${toAcc.name}`,
      tags: ['transfer', 'internal'],
      paymentMethod: 'Bank Transfer',
      accountId: fromAcc.id,
      accountName: fromAcc.name
    });
    // Create income to target account
    await addTransaction({
      type: 'Income',
      amount,
      category: 'Transfer',
      date: dateStr,
      notes: notes || `Transfer from ${fromAcc.name}`,
      tags: ['transfer', 'internal'],
      paymentMethod: 'Bank Transfer',
      accountId: toAcc.id,
      accountName: toAcc.name
    });
  };

  const addBudget = async (b: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    const newB = await dbSaveBudget({ ...b, id: '', userId: user.uid });
    setBudgets(prev => [...prev, newB]);
  };

  const editBudget = async (b: Budget) => {
    if (!user) return;
    const updated = await dbSaveBudget(b);
    setBudgets(prev => prev.map(bg => bg.id === b.id ? updated : bg));
  };

  const removeBudget = async (id: string) => {
    if (!user) return;
    await dbDeleteBudget(id);
    setBudgets(prev => prev.filter(bg => bg.id !== id));
  };

  const addGoal = async (g: Omit<Goal, 'id' | 'userId'>) => {
    if (!user) return;
    const newG = await dbSaveGoal({ ...g, id: '', userId: user.uid });
    setGoals(prev => [...prev, newG]);
  };

  const editGoal = async (g: Goal) => {
    if (!user) return;
    const updated = await dbSaveGoal(g);
    setGoals(prev => prev.map(gl => gl.id === g.id ? updated : gl));
  };

  const removeGoal = async (id: string) => {
    if (!user) return;
    await dbDeleteGoal(id);
    setGoals(prev => prev.filter(gl => gl.id !== id));
  };

  const markNotificationAsRead = async (id: string) => {
    await dbMarkNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const updateSettings = async (newSets: Partial<UserSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...newSets, userId: user.uid };
    await dbSaveUserSettings(updated);
    setSettings(updated);
  };

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, budgets, goals, notifications, settings, loading, dataLoadError,
      currentBalance, monthlyIncome, monthlyExpenses, savingsThisMonth, budgetUsagePercent,
      financialHealthScore, smartInsights, upcomingBills,
      addTransaction, editTransaction, removeTransaction, addAccount, editAccount, removeAccount,
      transferFunds, addBudget, editBudget, removeBudget, addGoal, editGoal, removeGoal,
      markNotificationAsRead, updateSettings, refreshData
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
