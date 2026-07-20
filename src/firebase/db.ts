// @ts-ignore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured, firebaseInitError } from './config';
import { Transaction, Account, Budget, Goal, AppNotification, UserSettings, ReportSummary, RecurringRule } from '../types';

// True only when real-looking Firebase credentials were provided but initialization
// genuinely failed — as opposed to isFirebaseConfigured being false because no
// credentials were provided at all (intentional local simulation mode, not an error).
// The app should surface this loudly rather than silently serving fake demo data
// while appearing to work normally.
export const isServingMockDataUnintentionally = isFirebaseConfigured && !!firebaseInitError;

// ==========================================
// INITIAL MOCK DATA FOR SIMULATION MODE
// ==========================================
let mockAccounts: Account[] = [
  { id: 'acc-1', userId: 'mock-user-123', name: 'Primary Salary Account', type: 'Bank Account', balance: 5420.50, currency: 'PKR', isDefault: true, color: '#6E8B74' },
  { id: 'acc-2', userId: 'mock-user-123', name: 'Emergency Savings', type: 'Savings Account', balance: 12500.00, currency: 'PKR', color: '#89A48E' },
  { id: 'acc-3', userId: 'mock-user-123', name: 'Daily Spending Wallet', type: 'Wallet', balance: 450.00, currency: 'PKR', color: '#f59e0b' },
  { id: 'acc-4', userId: 'mock-user-123', name: 'Platinum Credit Card', type: 'Credit Card', balance: -1240.20, currency: 'PKR', color: '#ef4444' },
  { id: 'acc-5', userId: 'mock-user-123', name: 'Pocket Cash', type: 'Cash', balance: 180.00, currency: 'PKR', color: '#8b5cf6' },
];

let mockTransactions: Transaction[] = [
  { id: 'tx-1', userId: 'mock-user-123', type: 'Income', amount: 4800, category: 'Salary', date: '2026-06-01', notes: 'Monthly corporate salary', tags: ['salary', 'corporate'], paymentMethod: 'Bank Transfer', accountId: 'acc-1', accountName: 'Primary Salary Account', isRecurring: true, recurrenceInterval: 'monthly' },
  { id: 'tx-2', userId: 'mock-user-123', type: 'Income', amount: 850, category: 'Freelance', date: '2026-06-10', notes: 'Client UI design consultation', tags: ['freelance', 'design'], paymentMethod: 'Bank Transfer', accountId: 'acc-1', accountName: 'Primary Salary Account' },
  { id: 'tx-3', userId: 'mock-user-123', type: 'Expense', amount: 1450, category: 'Rent', date: '2026-06-02', notes: 'Downtown apartment rent', tags: ['housing', 'fixed'], paymentMethod: 'Bank Transfer', accountId: 'acc-1', accountName: 'Primary Salary Account', isRecurring: true, recurrenceInterval: 'monthly' },
  { id: 'tx-4', userId: 'mock-user-123', type: 'Expense', amount: 185.50, category: 'Groceries', date: '2026-06-05', notes: 'Organic weekly groceries', tags: ['food', 'supermarket'], paymentMethod: 'Credit Card', accountId: 'acc-4', accountName: 'Platinum Credit Card' },
  { id: 'tx-5', userId: 'mock-user-123', type: 'Expense', amount: 84.20, category: 'Food & Dining', date: '2026-06-08', notes: 'Bistro dinner with friends', tags: ['dining', 'social'], paymentMethod: 'Credit Card', accountId: 'acc-4', accountName: 'Platinum Credit Card' },
  { id: 'tx-6', userId: 'mock-user-123', type: 'Expense', amount: 65.00, category: 'Utilities', date: '2026-06-12', notes: 'Monthly electricity bill', tags: ['utilities', 'home'], paymentMethod: 'Debit Card', accountId: 'acc-1', accountName: 'Primary Salary Account' },
  { id: 'tx-7', userId: 'mock-user-123', type: 'Expense', amount: 45.00, category: 'Internet', date: '2026-06-14', notes: 'High speed fiber internet', tags: ['work', 'subscription'], paymentMethod: 'Credit Card', accountId: 'acc-4', accountName: 'Platinum Credit Card' },
  { id: 'tx-8', userId: 'mock-user-123', type: 'Expense', amount: 120.00, category: 'Transportation', date: '2026-06-15', notes: 'Monthly subway & transit pass', tags: ['commute'], paymentMethod: 'Wallet', accountId: 'acc-3', accountName: 'Daily Spending Wallet' },
  { id: 'tx-9', userId: 'mock-user-123', type: 'Expense', amount: 250.00, category: 'Shopping', date: '2026-06-18', notes: 'New ergonomic office chair', tags: ['wfh', 'setup'], paymentMethod: 'Credit Card', accountId: 'acc-4', accountName: 'Platinum Credit Card' },
  { id: 'tx-10', userId: 'mock-user-123', type: 'Expense', amount: 35.00, category: 'Fitness', date: '2026-06-20', notes: 'Gym monthly membership', tags: ['health', 'active'], paymentMethod: 'Debit Card', accountId: 'acc-1', accountName: 'Primary Salary Account' },
  { id: 'tx-11', userId: 'mock-user-123', type: 'Income', amount: 200.00, category: 'Investment Returns', date: '2026-06-22', notes: 'Quarterly stock dividends', tags: ['portfolio', 'passive'], paymentMethod: 'Bank Transfer', accountId: 'acc-2', accountName: 'Emergency Savings' },
  { id: 'tx-12', userId: 'mock-user-123', type: 'Expense', amount: 55.00, category: 'Subscriptions', date: '2026-06-25', notes: 'Netflix, Spotify & Cloud storage', tags: ['services', 'digital'], paymentMethod: 'Credit Card', accountId: 'acc-4', accountName: 'Platinum Credit Card' }
];

let mockBudgets: Budget[] = [
  { id: 'b-1', userId: 'mock-user-123', name: 'Total Monthly Living', type: 'Monthly Budget', targetAmount: 3000, spentAmount: 2289.70, period: 'monthly', alertThreshold: 85 },
  { id: 'b-2', userId: 'mock-user-123', name: 'Dining & Restaurants', type: 'Category Budget', category: 'Food & Dining', targetAmount: 400, spentAmount: 310.20, period: 'monthly', alertThreshold: 80 },
  { id: 'b-3', userId: 'mock-user-123', name: 'Groceries & Essentials', type: 'Category Budget', category: 'Groceries', targetAmount: 600, spentAmount: 425.50, period: 'monthly', alertThreshold: 90 },
  { id: 'b-4', userId: 'mock-user-123', name: 'Tech & Subscriptions', type: 'Category Budget', category: 'Subscriptions', targetAmount: 100, spentAmount: 55.00, period: 'monthly', alertThreshold: 85 },
  { id: 'b-5', userId: 'mock-user-123', name: 'Monthly Savings Target', type: 'Savings Budget', targetAmount: 1200, spentAmount: 1050, period: 'monthly', alertThreshold: 100 }
];

let mockGoals: Goal[] = [
  { id: 'g-1', userId: 'mock-user-123', name: 'Emergency Fund', targetAmount: 20000, currentAmount: 12500, deadline: '2026-12-31', category: 'Savings', notes: '6 months of living expenses buffer', color: '#89A48E' },
  { id: 'g-2', userId: 'mock-user-123', name: 'House Deposit', targetAmount: 50000, currentAmount: 28000, deadline: '2028-06-30', category: 'Real Estate', notes: 'Down payment for suburban home', color: '#6E8B74' },
  { id: 'g-3', userId: 'mock-user-123', name: 'New iPhone Pro', targetAmount: 1200, currentAmount: 850, deadline: '2026-09-15', category: 'Tech', notes: 'Special tech upgrade fund', color: '#a855f7' },
  { id: 'g-4', userId: 'mock-user-123', name: 'Japan Trip 2027', targetAmount: 5000, currentAmount: 2100, deadline: '2027-04-10', category: 'Travel', notes: 'Spring cherry blossom vacation', color: '#f59e0b' },
];

let mockNotifications: AppNotification[] = [
  { id: 'n-1', userId: 'mock-user-123', title: 'Dining Budget Alert', message: 'You have used 77% of your Food & Dining budget this month.', type: 'budget_exceeded', isRead: false, createdAt: '2026-06-25T14:22:00Z' },
  { id: 'n-2', userId: 'mock-user-123', title: 'Upcoming Bill Reminder', message: 'High speed fiber internet bill ($45.00) is due soon.', type: 'bill_reminder', isRead: false, createdAt: '2026-06-24T09:15:00Z' },
  { id: 'n-3', userId: 'mock-user-123', title: 'Savings Milestone', message: 'Congratulations! You reached 70% of your New iPhone Pro goal.', type: 'savings_milestone', isRead: true, createdAt: '2026-06-20T18:40:00Z' },
  { id: 'n-4', userId: 'mock-user-123', title: 'May Financial Summary', message: 'Your monthly financial summary report is ready to review.', type: 'monthly_summary', isRead: true, createdAt: '2026-06-01T08:00:00Z' }
];

let mockRecurringRules: RecurringRule[] = [];

let mockSettings: UserSettings = {
  userId: 'mock-user-123',
  currency: 'PKR',
  language: 'English',
  theme: 'dark',
  dateFormat: 'yyyy-MM-dd',
  enableNotifications: true,
  monthlyBudgetCap: 3500
};

// ==========================================
// SERVICE WRAPPER METHODS
// ==========================================

export const getAccounts = async (userId: string): Promise<Account[]> => {
  if (!isFirebaseConfigured || !db) return mockAccounts;
  const q = query(collection(db, 'accounts'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Account));
};

export const saveAccount = async (account: Account): Promise<Account> => {
  if (!isFirebaseConfigured || !db) {
    if (account.id) {
      mockAccounts = mockAccounts.map(a => a.id === account.id ? account : a);
      return account;
    }
    const newAcc = { ...account, id: 'acc-' + Date.now() };
    mockAccounts.push(newAcc);
    return newAcc;
  }
  const collectionRef = collection(db, 'accounts');
  if (account.id) {
    const docRef = doc(db, 'accounts', account.id);
    await updateDoc(docRef, { ...account });
    return account;
  } else {
    const docRef = await addDoc(collectionRef, { ...account });
    return { ...account, id: docRef.id };
  }
};

export const deleteAccount = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockAccounts = mockAccounts.filter(a => a.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'accounts', id));
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  if (!isFirebaseConfigured || !db) return mockTransactions;
  const q = query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Transaction));
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction> => {
  if (!isFirebaseConfigured || !db) {
    if (transaction.id) {
      mockTransactions = mockTransactions.map(t => t.id === transaction.id ? transaction : t);
      return transaction;
    }
    const newTx = { ...transaction, id: 'tx-' + Date.now() };
    mockTransactions = [newTx, ...mockTransactions];
    // adjust account balance
    const acc = mockAccounts.find(a => a.id === newTx.accountId);
    if (acc) {
      acc.balance += (newTx.type === 'Income' ? newTx.amount : -newTx.amount);
    }
    return newTx;
  }
  const collectionRef = collection(db, 'transactions');
  if (transaction.id) {
    const docRef = doc(db, 'transactions', transaction.id);
    await updateDoc(docRef, { ...transaction });
    return transaction;
  } else {
    const docRef = await addDoc(collectionRef, { ...transaction });
    return { ...transaction, id: docRef.id };
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    const tx = mockTransactions.find(t => t.id === id);
    if (tx) {
      const acc = mockAccounts.find(a => a.id === tx.accountId);
      if (acc) {
        acc.balance += (tx.type === 'Income' ? -tx.amount : tx.amount);
      }
    }
    mockTransactions = mockTransactions.filter(t => t.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'transactions', id));
};

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  if (!isFirebaseConfigured || !db) return mockBudgets;
  const q = query(collection(db, 'budgets'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Budget));
};

export const saveBudget = async (budget: Budget): Promise<Budget> => {
  if (!isFirebaseConfigured || !db) {
    if (budget.id) {
      mockBudgets = mockBudgets.map(b => b.id === budget.id ? budget : b);
      return budget;
    }
    const newB = { ...budget, id: 'b-' + Date.now() };
    mockBudgets.push(newB);
    return newB;
  }
  if (budget.id) {
    const docRef = doc(db, 'budgets', budget.id);
    await updateDoc(docRef, { ...budget });
    return budget;
  } else {
    const docRef = await addDoc(collection(db, 'budgets'), { ...budget });
    return { ...budget, id: docRef.id };
  }
};

export const deleteBudget = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockBudgets = mockBudgets.filter(b => b.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'budgets', id));
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  if (!isFirebaseConfigured || !db) return mockGoals;
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Goal));
};

export const saveGoal = async (goal: Goal): Promise<Goal> => {
  if (!isFirebaseConfigured || !db) {
    if (goal.id) {
      mockGoals = mockGoals.map(g => g.id === goal.id ? goal : g);
      return goal;
    }
    const newG = { ...goal, id: 'g-' + Date.now() };
    mockGoals.push(newG);
    return newG;
  }
  if (goal.id) {
    const docRef = doc(db, 'goals', goal.id);
    await updateDoc(docRef, { ...goal });
    return goal;
  } else {
    const docRef = await addDoc(collection(db, 'goals'), { ...goal });
    return { ...goal, id: docRef.id };
  }
};

export const deleteGoal = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockGoals = mockGoals.filter(g => g.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'goals', id));
};

export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  if (!isFirebaseConfigured || !db) return mockNotifications;
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as AppNotification));
};

export const markNotificationRead = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockNotifications = mockNotifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    return;
  }
  await updateDoc(doc(db, 'notifications', id), { isRead: true });
};

export const getRecurringRules = async (userId: string): Promise<RecurringRule[]> => {
  if (!isFirebaseConfigured || !db) return mockRecurringRules;
  const q = query(collection(db, 'recurringRules'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as RecurringRule));
};

export const saveRecurringRule = async (rule: RecurringRule): Promise<RecurringRule> => {
  if (!isFirebaseConfigured || !db) {
    if (rule.id) {
      mockRecurringRules = mockRecurringRules.map(r => r.id === rule.id ? rule : r);
      return rule;
    }
    const newRule = { ...rule, id: 'rec-' + Date.now() };
    mockRecurringRules.push(newRule);
    return newRule;
  }
  if (rule.id) {
    const docRef = doc(db, 'recurringRules', rule.id);
    await updateDoc(docRef, { ...rule });
    return rule;
  } else {
    const docRef = await addDoc(collection(db, 'recurringRules'), { ...rule });
    return { ...rule, id: docRef.id };
  }
};

export const deleteRecurringRule = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockRecurringRules = mockRecurringRules.filter(r => r.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'recurringRules', id));
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  if (!isFirebaseConfigured || !db) return mockSettings;
  const docRef = doc(db, 'settings', userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  return mockSettings;
};

export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    mockSettings = settings;
    return;
  }
  await setDoc(doc(db, 'settings', settings.userId), settings);
};
