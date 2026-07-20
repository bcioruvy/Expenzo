export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: string;
}

export type AccountType = 'Cash' | 'Bank Account' | 'Savings Account' | 'Wallet' | 'Credit Card';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  accountNumber?: string;
  color?: string;
  isDefault?: boolean;
}

export type TransactionType = 'Income' | 'Expense';

export type IncomeCategory = 
  | 'Salary' 
  | 'Bonus' 
  | 'Overtime' 
  | 'Freelance' 
  | 'Investment Returns' 
  | 'Rental Income' 
  | 'Gift Received' 
  | 'Refund' 
  | 'Other Income';

export type ExpenseCategory = 
  | 'Food & Dining' 
  | 'Groceries' 
  | 'Transportation' 
  | 'Fuel' 
  | 'Utilities' 
  | 'Internet' 
  | 'Mobile Package' 
  | 'Rent' 
  | 'Mortgage' 
  | 'Healthcare' 
  | 'Insurance' 
  | 'Education' 
  | 'Clothing' 
  | 'Entertainment' 
  | 'Subscriptions' 
  | 'Travel' 
  | 'Family Support' 
  | 'Charity' 
  | 'Personal Care' 
  | 'Shopping' 
  | 'Fitness' 
  | 'Emergency' 
  | 'Miscellaneous';

export type PaymentMethod = 'Cash' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'Mobile Wallet' | 'Online Service';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory | string;
  date: string; // ISO String YYYY-MM-DD
  notes: string;
  tags: string[];
  paymentMethod: PaymentMethod | string;
  accountId: string;
  accountName: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export type BudgetType = 'Monthly Budget' | 'Category Budget' | 'Savings Budget';

export interface Budget {
  id: string;
  userId: string;
  name: string;
  type: BudgetType;
  category?: ExpenseCategory | string;
  targetAmount: number;
  spentAmount: number;
  period: 'monthly' | 'weekly' | 'annual';
  alertThreshold: number; // percentage e.g., 85
}

export interface Goal {
  id: string;
  userId: string;
  name: string; // e.g., Emergency Fund, New Phone, Car, House Deposit
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  category: string;
  notes?: string;
  color?: string;
}

export interface ReportSummary {
  id: string;
  userId: string;
  title: string;
  type: 'Monthly Summary' | 'Income Report' | 'Expense Report' | 'Budget Report' | 'Savings Report';
  dateRange: string;
  generatedAt: string;
  downloadUrl?: string;
}

export interface SmartInsight {
  id: string;
  type: 'alert' | 'recommendation' | 'info' | 'success';
  title: string;
  message: string;
  metric?: string;
  actionText?: string;
}

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  isAutoPay: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'budget_exceeded' | 'bill_reminder' | 'savings_milestone' | 'monthly_summary';
  isRead: boolean;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory | string;
  notes: string;
  tags: string[];
  paymentMethod: PaymentMethod | string;
  accountId: string;
  accountName: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string; // YYYY-MM-DD — first occurrence
  nextDueDate: string; // YYYY-MM-DD — next date a transaction should be auto-created
  endDate?: string; // YYYY-MM-DD — optional, stop generating after this date
  isActive: boolean; // paused rules don't generate new transactions
  lastGeneratedDate?: string; // YYYY-MM-DD — for display, not used in scheduling logic
}

export interface UserSettings {
  userId: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark';
  dateFormat: string;
  enableNotifications: boolean;
  monthlyBudgetCap: number;
}
