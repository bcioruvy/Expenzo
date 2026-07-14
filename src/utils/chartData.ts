import { Transaction } from '../types';

// Returns the last N months as {key: 'YYYY-MM', label: 'Jan'} in chronological order, ending with the current month.
export const getLastNMonths = (n: number): { key: string; label: string }[] => {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ key, label });
  }
  return months;
};

// Sums income and expenses per month for the last N months, based on real transactions.
export const getMonthlyIncomeExpense = (transactions: Transaction[], n: number = 6) => {
  const months = getLastNMonths(n);
  const income = months.map(({ key }) =>
    transactions
      .filter(t => t.type === 'Income' && t.date.startsWith(key))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenses = months.map(({ key }) =>
    transactions
      .filter(t => t.type === 'Expense' && t.date.startsWith(key))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  return { labels: months.map(m => m.label), income, expenses };
};

// Cumulative net savings (income - expenses) running total across the last N months.
export const getCumulativeSavings = (transactions: Transaction[], n: number = 6) => {
  const { labels, income, expenses } = getMonthlyIncomeExpense(transactions, n);
  let running = 0;
  const cumulative = income.map((inc, i) => {
    running += inc - expenses[i];
    return running;
  });
  return { labels, cumulative };
};

// Net cash flow (income - expenses) for the last N weeks, based on real transactions.
export const getWeeklyCashFlow = (transactions: Transaction[], n: number = 4) => {
  const now = new Date();
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.push({ start, end, label: `Wk ${n - i}` });
  }
  const netFlow = weeks.map(({ start, end }) => {
    const inRange = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    const income = inRange.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = inRange.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  });
  return { labels: weeks.map(w => w.label), netFlow };
};

// Spending grouped by category (expenses only), sorted descending, for the current month by default.
export const getSpendingByCategory = (transactions: Transaction[], monthKey?: string) => {
  const key = monthKey || new Date().toISOString().slice(0, 7);
  const expenses = transactions.filter(t => t.type === 'Expense' && t.date.startsWith(key));
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
