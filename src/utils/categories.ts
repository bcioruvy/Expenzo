// Single source of truth for category lists, used by every dropdown across the app
// (Transactions, Budgets, Dashboard's quick-add budget modal, etc.) so they can never
// drift out of sync with each other or with the ExpenseCategory/IncomeCategory types.

export const INCOME_CATEGORIES: string[] = [
  'Salary',
  'Bonus',
  'Overtime',
  'Freelance',
  'Investment Returns',
  'Rental Income',
  'Gift Received',
  'Refund',
  'Other Income',
];

export const EXPENSE_CATEGORIES: string[] = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Fuel',
  'Utilities',
  'Internet',
  'Mobile Package',
  'Rent',
  'Mortgage',
  'Healthcare',
  'Insurance',
  'Education',
  'Clothing',
  'Entertainment',
  'Subscriptions',
  'Travel',
  'Family Support',
  'Charity',
  'Personal Care',
  'Shopping',
  'Fitness',
  'Emergency',
  'Miscellaneous',
];
