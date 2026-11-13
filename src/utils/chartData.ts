import { format as formatDateFns } from 'date-fns';
import { Transaction, Budget, Category, TransactionType } from '../types';

// Two kinds of transaction are real money movements but NOT real income/spending, and must
// be excluded everywhere "money in/out" gets summed (income/expense totals, budget usage,
// the health score, category totals, cash flow charts) — otherwise they inflate those
// numbers even though nothing was actually earned or spent:
//   1. Internal transfers — money moved between the user's own accounts (Expense + Income
//      pair so each account's balance stays accurate).
//   2. Opening balances — the starting amount recorded when an account is created, logged
//      as a real transaction (so account balances are fully backed by transaction history,
//      e.g. for the Accounts page's "Recalculate Balance" feature) but not money earned
//      during whatever month the account happened to be created in.
export const isExcludedFromStats = (t: Transaction) =>
  (t.category === 'Transfer' && (t.tags || []).includes('internal')) ||
  (t.category === 'Opening Balance' && (t.tags || []).includes('opening-balance'));


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
      .filter(t => t.type === 'Income' && t.date.startsWith(key) && !isExcludedFromStats(t))
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const expenses = months.map(({ key }) =>
    transactions
      .filter(t => t.type === 'Expense' && t.date.startsWith(key) && !isExcludedFromStats(t))
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
    const income = inRange.filter(t => t.type === 'Income' && !isExcludedFromStats(t)).reduce((sum, t) => sum + t.amount, 0);
    const expense = inRange.filter(t => t.type === 'Expense' && !isExcludedFromStats(t)).reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  });
  return { labels: weeks.map(w => w.label), netFlow };
};

// Spending grouped by category (expenses only), sorted descending, for a given month
// (defaults to the reference month derived from transaction history, not the device clock).
export const getSpendingByCategory = (transactions: Transaction[], monthKey?: string) => {
  const key = monthKey || getReferenceDate(transactions).toISOString().slice(0, 7);
  const expenses = transactions.filter(t => t.type === 'Expense' && t.date.startsWith(key) && !isExcludedFromStats(t));
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
// Returns a Monthly Budget's unused allowance from the PREVIOUS month, which carries
// forward as extra budget for the current month when the budget has rollover enabled.
// Only meaningful for period === 'monthly' — weekly/annual budgets don't roll over here.
// Only a POSITIVE leftover carries forward (money saved last month); overspending in a
// prior month does not reduce this month's budget.
export const getBudgetRolloverAmount = (budget: Budget, transactions: Transaction[], referenceDate?: Date): number => {
  if (budget.period !== 'monthly' || !budget.rolloverEnabled) return 0;

  const refDate = referenceDate || getReferenceDate(transactions);
  const prevMonthAnchor = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const prevPeriodStart = new Date(prevMonthAnchor.getFullYear(), prevMonthAnchor.getMonth(), 1);
  const prevPeriodEnd = new Date(prevMonthAnchor.getFullYear(), prevMonthAnchor.getMonth() + 1, 0);

  const prevSpent = transactions
    .filter(t => {
      if (t.type !== 'Expense') return false;
      if (budget.category && t.category !== budget.category) return false;
      if (!budget.category && isExcludedFromStats(t)) return false;
      const d = new Date(t.date + 'T00:00:00');
      return d >= prevPeriodStart && d <= prevPeriodEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, budget.targetAmount - prevSpent);
};

// A budget's effective target for the CURRENT period = its base target amount plus any
// rolled-over unused allowance from last month (0 if rollover isn't enabled/applicable).
// Use this everywhere a budget's "cap" is shown or compared against spending, instead of
// the raw targetAmount field, so rollover is reflected consistently across the app.
export const getEffectiveBudgetTarget = (budget: Budget, transactions: Transaction[], referenceDate?: Date): number => {
  return budget.targetAmount + getBudgetRolloverAmount(budget, transactions, referenceDate);
};

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
      if (!budget.category && isExcludedFromStats(t)) return false; // Monthly Budgets sum all real spending, not internal transfers
      const d = new Date(t.date + 'T00:00:00');
      return d >= periodStart && d <= periodEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

// ==========================================
// ARBITRARY DATE-RANGE HELPERS (Analytics page)
// ==========================================
// Everything below is additive — the Dashboard (and the fixed-window helpers above it still
// uses) is left untouched. These helpers exist so the Analytics page can work off a real,
// user-selected [start, end] range (inclusive) instead of "last N months/weeks".
//
// The one hard rule throughout this section: dates are compared as local "YYYY-MM-DD"
// strings, never via `new Date(t.date)`. A bare "YYYY-MM-DD" is parsed by the Date
// constructor as UTC midnight, which — for a timezone ahead of UTC like Pakistan (UTC+5) —
// sits *after* a same-day boundary built from local components (e.g. via `new Date(y, m, d)`
// or `date + 'T00:00:00'`). That mismatch is exactly why the existing getWeeklyCashFlow
// above silently drops transactions dated on the last day of each week. String comparison
// on zero-padded "YYYY-MM-DD" sorts identically to chronological order, so it sidesteps the
// whole class of bug — every helper below relies on that instead of Date math for filtering.

export type DateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'last_12_months'
  | 'all_time'
  | 'custom';

export const DATE_RANGE_PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

export interface ResolvedDateRange {
  start: string; // "YYYY-MM-DD", inclusive
  end: string; // "YYYY-MM-DD", inclusive
}

// Reads a Date's LOCAL calendar fields (never UTC) into a "YYYY-MM-DD" string.
export const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayISODate = (): string => toISODateLocal(new Date());

// Parses a "YYYY-MM-DD" string into a Date built from local Y/M/D components (midnight
// local time) — the safe counterpart to `new Date(dateStr)`, which parses as UTC.
export const parseISODateLocal = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDaysISO = (dateStr: string, days: number): string => {
  const d = parseISODateLocal(dateStr);
  d.setDate(d.getDate() + days);
  return toISODateLocal(d);
};

export const addMonthsISO = (dateStr: string, months: number): string => {
  const d = parseISODateLocal(dateStr);
  d.setMonth(d.getMonth() + months);
  return toISODateLocal(d);
};

export const startOfMonthISO = (dateStr: string): string => `${dateStr.slice(0, 7)}-01`;

export const endOfMonthISO = (dateStr: string): string => {
  const [y, m] = dateStr.split('-').map(Number);
  return toISODateLocal(new Date(y, m, 0)); // day 0 of next month = last day of this month
};

export const startOfYearISO = (dateStr: string): string => `${dateStr.slice(0, 4)}-01-01`;

// If `from` is after `to`, swaps them so the returned range is always chronological —
// used by the Custom Range inputs so the two date pickers never silently disagree.
export const normalizeCustomRange = (from: string, to: string): ResolvedDateRange =>
  from <= to ? { start: from, end: to } : { start: to, end: from };

// Resolves a preset into a concrete [start, end] range, anchored to `today` (defaults to
// the real device date — these are NOT anchored to the latest transaction like
// getReferenceDate above, per the Analytics spec). 'custom' has no fixed meaning here since
// it depends on user input the caller already holds — callers should use
// normalizeCustomRange directly for that case; passed through here only as a safe fallback.
export const resolvePresetDateRange = (
  preset: DateRangePreset,
  transactions: Transaction[],
  today: Date = new Date()
): ResolvedDateRange => {
  const todayISO = toISODateLocal(today);
  switch (preset) {
    case 'this_month':
      return { start: startOfMonthISO(todayISO), end: todayISO };
    case 'last_month': {
      const firstOfThisMonth = startOfMonthISO(todayISO);
      const lastMonthEnd = addDaysISO(firstOfThisMonth, -1);
      return { start: startOfMonthISO(lastMonthEnd), end: lastMonthEnd };
    }
    case 'last_30_days':
      return { start: addDaysISO(todayISO, -29), end: todayISO };
    case 'last_3_months':
      return { start: addMonthsISO(todayISO, -3), end: todayISO };
    case 'last_6_months':
      return { start: addMonthsISO(todayISO, -6), end: todayISO };
    case 'this_year':
      return { start: startOfYearISO(todayISO), end: todayISO };
    case 'last_12_months':
      return { start: addMonthsISO(todayISO, -12), end: todayISO };
    case 'all_time': {
      if (transactions.length === 0) return { start: todayISO, end: todayISO };
      const earliest = transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date);
      return { start: earliest, end: todayISO };
    }
    case 'custom':
    default:
      return { start: startOfMonthISO(todayISO), end: todayISO };
  }
};

const sumInRange = (transactions: Transaction[], start: string, end: string, type: TransactionType): number =>
  transactions
    .filter(t => t.type === type && t.date >= start && t.date <= end && !isExcludedFromStats(t))
    .reduce((sum, t) => sum + t.amount, 0);

export const getRangeTotals = (
  transactions: Transaction[],
  start: string,
  end: string
): { income: number; expenses: number; net: number } => {
  const income = sumInRange(transactions, start, end, 'Income');
  const expenses = sumInRange(transactions, start, end, 'Expense');
  return { income, expenses, net: income - expenses };
};

// Spending by category within [start, end], expenses only, excluding internal
// transfers/opening balances, sorted largest first — feeds the Analytics pie chart.
export const getRangeSpendingByCategory = (
  transactions: Transaction[],
  start: string,
  end: string
): { labels: string[]; values: number[] } => {
  const totals: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'Expense' && t.date >= start && t.date <= end && !isExcludedFromStats(t))
    .forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return { labels: sorted.map(([cat]) => cat), values: sorted.map(([, val]) => val) };
};

const enumerateDaysISO = (start: string, end: string): string[] => {
  const result: string[] = [];
  let cur = parseISODateLocal(start);
  const endTime = parseISODateLocal(end).getTime();
  while (cur.getTime() <= endTime) {
    result.push(toISODateLocal(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return result;
};

interface MonthBucket { key: string; bucketStart: string; bucketEnd: string; }

// Calendar months overlapping [start, end], with the first and last bucket's
// start/end CLIPPED to the overall range — e.g. a range starting June 15 produces a first
// bucket of June 15–30, not a full June 1–30.
const enumerateMonthBuckets = (start: string, end: string): MonthBucket[] => {
  const buckets: MonthBucket[] = [];
  let monthCursor = startOfMonthISO(start);
  const endMonthStart = startOfMonthISO(end);
  while (monthCursor <= endMonthStart) {
    const naturalEnd = endOfMonthISO(monthCursor);
    const bucketStart = monthCursor > start ? monthCursor : start;
    const bucketEnd = naturalEnd < end ? naturalEnd : end;
    buckets.push({ key: monthCursor.slice(0, 7), bucketStart, bucketEnd });
    monthCursor = addMonthsISO(monthCursor, 1);
  }
  return buckets;
};

const DAILY_BUCKET_MAX_SPAN_DAYS = 62;

const daysBetweenInclusive = (start: string, end: string): number =>
  Math.round((parseISODateLocal(end).getTime() - parseISODateLocal(start).getTime()) / 86400000) + 1;

const rangeSpansMultipleYears = (start: string, end: string): boolean => start.slice(0, 4) !== end.slice(0, 4);

export interface RangeSeries { labels: string[]; income: number[]; expenses: number[]; }

// Income/expense series across [start, end]: bucketed by day for ranges up to 62 days,
// otherwise by calendar month (first/last month clipped to the range). Labels include the
// year whenever the range spans more than one calendar year.
export const getRangeIncomeExpenseSeries = (
  transactions: Transaction[],
  start: string,
  end: string
): RangeSeries => {
  const showYear = rangeSpansMultipleYears(start, end);

  if (daysBetweenInclusive(start, end) <= DAILY_BUCKET_MAX_SPAN_DAYS) {
    const days = enumerateDaysISO(start, end);
    return {
      labels: days.map(d => formatDateFns(parseISODateLocal(d), showYear ? 'MMM d, yyyy' : 'MMM d')),
      income: days.map(d => sumInRange(transactions, d, d, 'Income')),
      expenses: days.map(d => sumInRange(transactions, d, d, 'Expense')),
    };
  }

  const buckets = enumerateMonthBuckets(start, end);
  return {
    labels: buckets.map(b => formatDateFns(parseISODateLocal(b.key + '-01'), showYear ? 'MMM yyyy' : 'MMM')),
    income: buckets.map(b => sumInRange(transactions, b.bucketStart, b.bucketEnd, 'Income')),
    expenses: buckets.map(b => sumInRange(transactions, b.bucketStart, b.bucketEnd, 'Expense')),
  };
};

// Cumulative net savings (income - expenses) across [start, end], starting at 0 on the
// range's first day/month — intentionally NOT a running total carried in from before the
// range (unlike getCumulativeSavings above, which is a fixed trailing window).
export const getRangeCumulativeSavings = (
  transactions: Transaction[],
  start: string,
  end: string
): { labels: string[]; cumulative: number[] } => {
  const { labels, income, expenses } = getRangeIncomeExpenseSeries(transactions, start, end);
  let running = 0;
  const cumulative = income.map((inc, i) => {
    running += inc - expenses[i];
    return running;
  });
  return { labels, cumulative };
};

// Net cash flow in 7-day weeks counted BACK from the range end, with the earliest week
// clipped to the range start (so a 10-day range is one 7-day week plus one 3-day week,
// not a stray empty bucket). Uses the same local-string date comparison as everything else
// in this section, which is the actual fix for the UTC-parsing bug described above.
export const getRangeWeeklyCashFlow = (
  transactions: Transaction[],
  start: string,
  end: string
): { labels: string[]; netFlow: number[] } => {
  const weeks: { start: string; end: string }[] = [];
  let weekEnd = end;
  while (weekEnd >= start) {
    const naturalStart = addDaysISO(weekEnd, -6);
    const weekStart = naturalStart < start ? start : naturalStart;
    weeks.unshift({ start: weekStart, end: weekEnd });
    if (weekStart === start) break;
    weekEnd = addDaysISO(weekStart, -1);
  }
  return {
    labels: weeks.map((_, i) => `Wk ${i + 1}`),
    netFlow: weeks.map(w => sumInRange(transactions, w.start, w.end, 'Income') - sumInRange(transactions, w.start, w.end, 'Expense')),
  };
};

// Resolves a selected category filter (by id, as used in the Analytics category dropdown)
// into the transaction type + set of category NAMES to match. Transactions only store a
// category name + type, not an id, and an Income category and an Expense category are
// allowed to share a name — so matching must always check type alongside name. Selecting a
// parent category rolls up its sub-categories (matching transactions filed under either);
// selecting a sub-category matches only that sub-category.
export const getCategoryFilterNames = (
  categories: Category[],
  categoryId: string
): { type: TransactionType; names: string[] } | null => {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return null;
  if (cat.parentId) return { type: cat.type, names: [cat.name] };
  const subNames = categories.filter(c => c.parentId === cat.id).map(c => c.name);
  return { type: cat.type, names: [cat.name, ...subNames] };
};
