import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  Account, Transaction, Budget, Goal, AppNotification, UserSettings, SmartInsight, BillReminder, RecurringRule 
} from '../types';
import { 
  getAccounts, saveAccount as dbSaveAccount, deleteAccount as dbDeleteAccount,
  getTransactions, saveTransaction as dbSaveTransaction, deleteTransaction as dbDeleteTransaction,
  getBudgets, saveBudget as dbSaveBudget, deleteBudget as dbDeleteBudget,
  getGoals, saveGoal as dbSaveGoal, deleteGoal as dbDeleteGoal,
  getNotifications, markNotificationRead as dbMarkNotificationRead,
  getUserSettings, saveUserSettings as dbSaveUserSettings,
  getRecurringRules, saveRecurringRule as dbSaveRecurringRule, deleteRecurringRule as dbDeleteRecurringRule,
  isServingMockDataUnintentionally
} from '../firebase/db';
import { formatCurrency } from '../utils/currency';
import { getBudgetSpentAmount } from '../utils/chartData';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notifications: AppNotification[];
  recurringRules: RecurringRule[];
  settings: UserSettings;
  loading: boolean;
  initialLoadComplete: boolean;
  dataLoadError: boolean;
  dataLoadErrorDetails: string[];
  isServingMockData: boolean;
  deleteError: string | null;
  clearDeleteError: () => void;
  // Computed stats
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsThisMonth: number;
  budgetUsagePercent: number;
  financialHealthScore: number | null;
  balanceChangePercent: number | null;
  topIncomeSources: string;
  smartInsights: SmartInsight[];
  upcomingBills: BillReminder[];
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  editTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  removeMultipleTransactions: (ids: string[]) => Promise<void>;
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
  addRecurringRule: (r: Omit<RecurringRule, 'id' | 'userId'>) => Promise<void>;
  editRecurringRule: (r: RecurringRule) => Promise<void>;
  removeRecurringRule: (id: string) => Promise<void>;
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
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: '', currency: 'PKR', language: 'English', theme: 'light', dateFormat: 'yyyy-MM-dd', enableNotifications: true, monthlyBudgetCap: 3500
  });
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [dataLoadError, setDataLoadError] = useState(false);
  const [dataLoadErrorDetails, setDataLoadErrorDetails] = useState<string[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        getUserSettings(user.uid),
        getRecurringRules(user.uid)
      ]);

      const [accsRes, txsRes, bdgsRes, glsRes, notifsRes, setsRes, recRes] = results;
      const errors: string[] = [];

      if (accsRes.status === 'fulfilled') setAccounts(accsRes.value);
      else { console.error('Failed to load accounts:', accsRes.reason); errors.push(`Accounts: ${accsRes.reason?.message || accsRes.reason}`); }

      if (txsRes.status === 'fulfilled') setTransactions(txsRes.value);
      else { console.error('Failed to load transactions:', txsRes.reason); errors.push(`Transactions: ${txsRes.reason?.message || txsRes.reason}`); }

      if (bdgsRes.status === 'fulfilled') setBudgets(bdgsRes.value);
      else { console.error('Failed to load budgets:', bdgsRes.reason); errors.push(`Budgets: ${bdgsRes.reason?.message || bdgsRes.reason}`); }

      if (glsRes.status === 'fulfilled') setGoals(glsRes.value);
      else { console.error('Failed to load goals:', glsRes.reason); errors.push(`Goals: ${glsRes.reason?.message || glsRes.reason}`); }

      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value);
      else { console.error('Failed to load notifications:', notifsRes.reason); errors.push(`Notifications: ${notifsRes.reason?.message || notifsRes.reason}`); }

      if (setsRes.status === 'fulfilled') setSettings(setsRes.value);
      else { console.error('Failed to load settings:', setsRes.reason); errors.push(`Settings: ${setsRes.reason?.message || setsRes.reason}`); }

      if (recRes.status === 'fulfilled') setRecurringRules(recRes.value);
      else { console.error('Failed to load recurring rules:', recRes.reason); errors.push(`Recurring Rules: ${recRes.reason?.message || recRes.reason}`); }

      setDataLoadErrorDetails(errors);
      setDataLoadError(errors.length > 0);
    } catch (err: any) {
      console.error("Unexpected error fetching finance data:", err);
      setDataLoadErrorDetails([err?.message || String(err)]);
      setDataLoadError(true);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
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
      setRecurringRules([]);
      setLoading(false);
    }
  }, [user, fetchData]);

  // Computed Calculations
  const currentBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Internal transfers (money moved between the user's own accounts) are recorded as an
  // Expense + Income pair so each account's balance stays accurate, but they are not real
  // earned income or real spending — they must be excluded from every "money in/out" stat
  // (monthly income/expenses, savings, budget usage, health score, charts) or those numbers
  // get inflated every time the user moves money between accounts.
  const isInternalTransfer = (t: Transaction) => t.category === 'Transfer' && (t.tags || []).includes('internal');

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
    .filter(t => t.type === 'Income' && t.date.startsWith(currentMonthPrefix) && !isInternalTransfer(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'Expense' && t.date.startsWith(currentMonthPrefix) && !isInternalTransfer(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsThisMonth = monthlyIncome - monthlyExpenses;

  // Previous month's net (income - expenses), used to show a genuine month-over-month
  // change on the Current Balance card instead of a fixed placeholder percentage.
  const prevMonthDate = new Date(currentMonthPrefix + '-01T00:00:00');
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthIncome = transactions
    .filter(t => t.type === 'Income' && t.date.startsWith(prevMonthPrefix) && !isInternalTransfer(t))
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthExpenses = transactions
    .filter(t => t.type === 'Expense' && t.date.startsWith(prevMonthPrefix) && !isInternalTransfer(t))
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthNet = prevMonthIncome - prevMonthExpenses;
  const balanceChangePercent = prevMonthNet !== 0
    ? Math.round(((savingsThisMonth - prevMonthNet) / Math.abs(prevMonthNet)) * 100)
    : null; // null when there's no prior-month data to compare against

  // Top income category label for this month, e.g. "Salary" or "Salary + Freelance"
  const incomeByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'Income' && t.date.startsWith(currentMonthPrefix) && !isInternalTransfer(t))
    .forEach(t => { incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount; });
  const topIncomeSources = Object.entries(incomeByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat)
    .join(' + ');

  const totalMonthlyBudget = budgets
    .filter(b => b.type === 'Monthly Budget')
    .reduce((sum, b) => sum + b.targetAmount, 0) || settings.monthlyBudgetCap;

  const budgetUsagePercent = Math.min(100, Math.round((monthlyExpenses / totalMonthlyBudget) * 100));

  // Financial Health Score calculation (0 - 100)
  // Only computed once there's real activity to base it on — no free "base score" for an empty account.
  // Factors: savings rate (+40 max), budget usage < 80% (+20), emergency fund saved (+25), income logged (+15 base once earned)
  const hasEnoughDataForScore = monthlyIncome > 0 || monthlyExpenses > 0;
  let financialHealthScore: number | null = null;
  if (hasEnoughDataForScore) {
    let score = 0;
    if (monthlyIncome > 0) {
      score += 15; // credit for having real income data to evaluate against
      const savingsRate = savingsThisMonth / monthlyIncome;
      if (savingsRate >= 0.25) score += 40;
      else if (savingsRate >= 0.10) score += 25;
      else if (savingsRate > 0) score += 10;
    }
    // Budget usage only counts if a real budget target exists AND money has actually been spent against it
    if (monthlyExpenses > 0 && budgetUsagePercent < 80) score += 20;
    const emergencySaved = goals.find(g => g.name.toLowerCase().includes('emergency'))?.currentAmount || 0;
    if (emergencySaved >= 10000) score += 25;
    else if (emergencySaved >= 5000) score += 15;
    financialHealthScore = Math.min(96, score); // keep realistic max
  }

  // Smart Insights generation — only shows insights genuinely supported by real transaction/goal data
  const smartInsights: SmartInsight[] = [];

  // Health score insight — only if a real score was computed
  if (financialHealthScore !== null) {
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
    const thisMonthDining = diningTxs.filter(t => t.date.startsWith(currentMonthPrefix)).reduce((s, t) => s + t.amount, 0);
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
    const newTx = await dbSaveTransaction({ ...tx, userId: user.uid } as Transaction);
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
    try {
      await dbDeleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      await fetchData(); // refresh balances
      setDeleteError(null);
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      setDeleteError(err?.message || 'Failed to delete transaction. Please try again.');
    }
  };

  // Deletes multiple transactions, then refreshes balances exactly once at the end.
  // Deleting one-by-one with a refetch after each caused a race condition where
  // in-flight refetches could overwrite state mid-loop, sometimes skipping or
  // mismatching which transaction actually got removed.
  const removeMultipleTransactions = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => dbDeleteTransaction(id)));
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      await fetchData(); // refresh balances once, after all deletes have completed
      setDeleteError(null);
    } catch (err: any) {
      console.error('Failed to delete transactions:', err);
      setDeleteError(err?.message || 'Failed to delete one or more transactions. Please try again.');
    }
  };

  const addAccount = async (acc: Omit<Account, 'id' | 'userId'>) => {
    if (!user) return;
    const newAcc = await dbSaveAccount({ ...acc, userId: user.uid } as Account);
    setAccounts(prev => [...prev, newAcc]);
  };

  const editAccount = async (acc: Account) => {
    if (!user) return;
    const updated = await dbSaveAccount(acc);
    setAccounts(prev => prev.map(a => a.id === acc.id ? updated : a));
  };

  const removeAccount = async (id: string) => {
    if (!user) return;
    try {
      await dbDeleteAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      setDeleteError(null);
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
    }
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
    const newB = await dbSaveBudget({ ...b, userId: user.uid } as Budget);
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
    const newG = await dbSaveGoal({ ...g, userId: user.uid } as Goal);
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

  const addRecurringRule = async (r: Omit<RecurringRule, 'id' | 'userId'>) => {
    if (!user) return;
    const newRule = await dbSaveRecurringRule({ ...r, userId: user.uid } as RecurringRule);
    setRecurringRules(prev => [...prev, newRule]);
  };

  const editRecurringRule = async (r: RecurringRule) => {
    if (!user) return;
    const updated = await dbSaveRecurringRule(r);
    setRecurringRules(prev => prev.map(rule => rule.id === r.id ? updated : rule));
  };

  const removeRecurringRule = async (id: string) => {
    if (!user) return;
    await dbDeleteRecurringRule(id);
    setRecurringRules(prev => prev.filter(rule => rule.id !== id));
  };

  // Advances a YYYY-MM-DD date string by one occurrence of the given frequency.
  const advanceDate = (dateStr: string, frequency: RecurringRule['frequency']): string => {
    const d = new Date(dateStr + 'T00:00:00');
    switch (frequency) {
      case 'daily': d.setDate(d.getDate() + 1); break;
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'biweekly': d.setDate(d.getDate() + 14); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split('T')[0];
  };

  // Auto-generates real transactions from active recurring rules whose nextDueDate has arrived.
  // Runs once per session after rules and transactions have loaded. Catches up on any occurrences
  // missed while the app was closed (e.g. a weekly rule not opened for 3 weeks creates 3 transactions),
  // capped at 24 catch-up occurrences per rule per run as a safety limit against a data error causing
  // a runaway loop, and stops early if an end date has passed.
  useEffect(() => {
    if (!user || !initialLoadComplete || recurringRules.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const runDueRules = async () => {
      for (const rule of recurringRules) {
        if (!rule.isActive) continue;
        let due = rule.nextDueDate;
        let generatedAny = false;
        let safetyCounter = 0;
        while (due <= todayStr && safetyCounter < 24) {
          if (rule.endDate && due > rule.endDate) break;
          const newTx = await dbSaveTransaction({
            userId: user.uid,
            type: rule.type,
            amount: rule.amount,
            category: rule.category,
            date: due,
            notes: rule.notes,
            tags: rule.tags,
            paymentMethod: rule.paymentMethod,
            accountId: rule.accountId,
            accountName: rule.accountName,
          } as Transaction);
          setTransactions(prev => [newTx, ...prev]);
          setAccounts(prev => prev.map(acc => {
            if (acc.id === rule.accountId) {
              return { ...acc, balance: acc.balance + (rule.type === 'Income' ? rule.amount : -rule.amount) };
            }
            return acc;
          }));
          due = advanceDate(due, rule.frequency);
          generatedAny = true;
          safetyCounter++;
        }
        if (generatedAny) {
          const updatedRule = { ...rule, nextDueDate: due, lastGeneratedDate: todayStr };
          await dbSaveRecurringRule(updatedRule);
          setRecurringRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r));
        }
      }
    };

    runDueRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadComplete, user?.uid]);

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, budgets, goals, notifications, recurringRules, settings, loading, initialLoadComplete, dataLoadError, dataLoadErrorDetails, isServingMockData: isServingMockDataUnintentionally, deleteError, clearDeleteError: () => setDeleteError(null),
      currentBalance, monthlyIncome, monthlyExpenses, savingsThisMonth, budgetUsagePercent,
      financialHealthScore, balanceChangePercent, topIncomeSources, smartInsights, upcomingBills,
      addTransaction, editTransaction, removeTransaction, removeMultipleTransactions, addAccount, editAccount, removeAccount,
      transferFunds, addBudget, editBudget, removeBudget, addGoal, editGoal, removeGoal,
      markNotificationAsRead, updateSettings, addRecurringRule, editRecurringRule, removeRecurringRule, refreshData
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
