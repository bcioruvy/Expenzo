import { Transaction, Budget } from '../types';

// Internal transfers (money moved between the user's own accounts) are recorded as an
// Expense + Income pair so each account's balance stays accurate, but they aren't real
// earned income or real spending. Every chart that sums "money in/out" must exclude them,
// or moving money between accounts inflates income/expense trends and cash flow charts.
const isInternalTransfer = (t: Transaction) => t.category === 'Transfer' && (t.tags || []).includes('internal');


// Returns the "current month" (YYYY-MM) to treat as "today" for chart windows and
// budget calculations. Derived from the most recent transaction date when available,
// falling back to the real device date only when there's no transaction history yet.
// This mirrors FinanceContext's currentMonthPrefix logic so every part of the app
// agrees on what "this month" means, instead of some places using the device clock
// and others using transaction data (which caused widgets to go blank when the demo
// data's dates didn't match the real calendar date).
export const getReferenceDate = (transactions: Transaction[]): Date => {
  if (transactions.length === 0) return new Date();
  const mostRecent = transactions.reduce((latest, t) => (t.date > latest ? t.date : latest), transactions[0].date);
  return new Date(mostRecent + 'T00:00:00');
};

// Returns the last N months as {key: 'YYYY-MM', label: 'Jan'} in chronological order,
// ending with the given reference date's month (defaults to real "today" if omitted).
export const getLastNMonths = (n: number, referenceDate: Date = new Date()): { key: string; label: string }[] => {
  const months: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key, label });
  }
  return months;
};

// Sums income and expenses per month for the last N months, based on real transactions.
export const getMonthlyIncomeExpense = (transactions: Transaction[], n: number = 6, referenceDate?: Date) => {
  const refDate = referenceDate || getReferenceDate(transactions);
  const months = getLastNMonths(n, refDate);
  const income = months.map(({ key }) =>
    transactions
      .filter(t => t.type === 'Income' && t.date.startsWith(key) && !isInternalTransfer(t))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenses = months.map(({ key }) =>
    transactions
      .filter(t => t.type === 'Expense' && t.date.startsWith(key) && !isInternalTransfer(t))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  return { labels: months.map(m => m.label), income, expenses };
};

// Cumulative net savings (income - expenses) running total across the last N months.
export const getCumulativeSavings = (transactions: Transaction[], n: number = 6, referenceDate?: Date) => {
  const { labels, income, expenses } = getMonthlyIncomeExpense(transactions, n, referenceDate);
  let running = 0;
  const cumulative = income.map((inc, i) => {
    running += inc - expenses[i];
    return running;
  });
  return { labels, cumulative };
};

// Net cash flow (income - expenses) for the last N weeks, based on real transactions.
export const getWeeklyCashFlow = (transactions: Transaction[], n: number = 4, referenceDate?: Date) => {
  const refDate = referenceDate || getReferenceDate(transactions);
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(refDate);
    end.setDate(refDate.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.push({ start, end, label: `Wk ${n - i}` });
  }
  const netFlow = weeks.map(({ start, end }) => {
    const inRange = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    const income = inRange.filter(t => t.type === 'Income' && !isInternalTransfer(t)).reduce((sum, t) => sum + t.amount, 0);
    const expense = inRange.filter(t => t.type === 'Expense' && !isInternalTransfer(t)).reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  });
  return { labels: weeks.map(w => w.label), netFlow };
};

// Spending grouped by category (expenses only), sorted descending, for a given month
// (defaults to the reference month derived from transaction history, not the device clock).
export const getSpendingByCategory = (transactions: Transaction[], monthKey?: string) => {
  const key = monthKey || getReferenceDate(transactions).toISOString().slice(0, 7);
  const expenses = transactions.filter(t => t.type === 'Expense' && t.date.startsWith(key) && !isInternalTransfer(t));
  const totals: Record<string, number> = {};
  expenses.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(([cat]) => cat),
    values: sorted.map(([, val]) => val),
  };
};

// Computes a budget's real "spent" amount from actual transactions, instead of relying
// on a manually-typed static field that never updates. Matches transactions by category
// (for Category Budgets) within the budget's period (monthly/weekly/annual), anchored to
// the reference date so it stays consistent with the rest of the app's "current month" logic.
// Monthly Budgets with no specific category sum ALL expenses in the period.
export const getBudgetSpentAmount = (budget: Budget, transactions: Transaction[], referenceDate?: Date): number => {
  const refDate = referenceDate || getReferenceDate(transactions);

  let periodStart: Date;
  let periodEnd: Date;

  if (budget.period === 'weekly') {
    // Week = the 7 days ending on the reference date
    periodEnd = new Date(refDate);
    periodStart = new Date(refDate);
    periodStart.setDate(refDate.getDate() - 6);
  } else if (budget.period === 'annual') {
    periodStart = new Date(refDate.getFullYear(), 0, 1);
    periodEnd = new Date(refDate.getFullYear(), 11, 31);
  } else {
    // monthly (default)
    periodStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    periodEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
  }

  return transactions
    .filter(t => {
      if (t.type !== 'Expense') return false;
      if (budget.category && t.category !== budget.category) return false;
      if (!budget.category && isInternalTransfer(t)) return false; // Monthly Budgets sum all real spending, not internal transfers
      const d = new Date(t.date + 'T00:00:00');
      return d >= periodStart && d <= periodEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};
