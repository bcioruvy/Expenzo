import { describe, it, expect } from 'vitest';
import {
  resolvePresetDateRange,
  normalizeCustomRange,
  getRangeIncomeExpenseSeries,
  getRangeCumulativeSavings,
  getRangeWeeklyCashFlow,
  getRangeTotals,
  getRangeSpendingByCategory,
  getCategoryFilterNames,
  parseISODateLocal,
} from '../../src/utils/chartData';
import { Transaction, Category } from '../../src/types';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  userId: 'u1',
  type: 'Expense',
  amount: 100,
  category: 'Groceries',
  date: '2026-06-01',
  notes: '',
  tags: [],
  paymentMethod: 'Cash',
  accountId: 'a1',
  accountName: 'Wallet',
  ...overrides,
});

describe('resolvePresetDateRange', () => {
  // Pakistan is UTC+5 — picking a "today" whose UTC date differs from its local date is
  // exactly the scenario that breaks naive `new Date(dateStr)` parsing.
  const today = new Date(2026, 5, 20); // local June 20, 2026

  it('this_month: 1st of current month to today', () => {
    expect(resolvePresetDateRange('this_month', [], today)).toEqual({ start: '2026-06-01', end: '2026-06-20' });
  });

  it('last_month: the full previous calendar month', () => {
    expect(resolvePresetDateRange('last_month', [], today)).toEqual({ start: '2026-05-01', end: '2026-05-31' });
  });

  it('last_30_days: 30 days inclusive, ending today', () => {
    const { start, end } = resolvePresetDateRange('last_30_days', [], today);
    expect(end).toBe('2026-06-20');
    expect(start).toBe('2026-05-22');
  });

  it('this_year: Jan 1 to today', () => {
    expect(resolvePresetDateRange('this_year', [], today)).toEqual({ start: '2026-01-01', end: '2026-06-20' });
  });

  it('all_time: earliest transaction date to today', () => {
    const txs = [tx({ date: '2024-03-15' }), tx({ date: '2025-01-01' })];
    expect(resolvePresetDateRange('all_time', txs, today)).toEqual({ start: '2024-03-15', end: '2026-06-20' });
  });

  it('all_time with no transactions falls back to today/today', () => {
    expect(resolvePresetDateRange('all_time', [], today)).toEqual({ start: '2026-06-20', end: '2026-06-20' });
  });
});

describe('normalizeCustomRange', () => {
  it('leaves an already-chronological range untouched', () => {
    expect(normalizeCustomRange('2026-01-01', '2026-02-01')).toEqual({ start: '2026-01-01', end: '2026-02-01' });
  });

  it('swaps From/To when From is after To', () => {
    expect(normalizeCustomRange('2026-02-01', '2026-01-01')).toEqual({ start: '2026-01-01', end: '2026-02-01' });
  });
});

describe('getRangeWeeklyCashFlow (the UTC-parsing regression)', () => {
  it('does NOT drop a transaction dated on the last day of a week', () => {
    // Single-week range where the only transaction falls exactly on the range end — the
    // bug in the old getWeeklyCashFlow (via `new Date(t.date)`) silently excluded this.
    const txs = [tx({ date: '2026-06-07', type: 'Income', amount: 500 })];
    const { netFlow } = getRangeWeeklyCashFlow(txs, '2026-06-01', '2026-06-07');
    expect(netFlow).toEqual([500]);
  });

  it('counts 7-day weeks back from the range end, clipping the earliest week to the range start', () => {
    // 10-day range: one full week (days 4-10) and one clipped 3-day week (days 1-3).
    const { labels, netFlow } = getRangeWeeklyCashFlow([], '2026-06-01', '2026-06-10');
    expect(labels).toEqual(['Wk 1', 'Wk 2']);
    expect(netFlow).toEqual([0, 0]);
  });

  it('attributes income/expense correctly across clipped week boundaries', () => {
    const txs = [
      tx({ date: '2026-06-01', type: 'Income', amount: 50 }), // in the clipped first week
      tx({ date: '2026-06-10', type: 'Expense', amount: 20 }), // in the full second week
    ];
    const { netFlow } = getRangeWeeklyCashFlow(txs, '2026-06-01', '2026-06-10');
    expect(netFlow).toEqual([50, -20]);
  });
});

describe('getRangeIncomeExpenseSeries bucketing', () => {
  it('buckets by day for ranges up to 62 days', () => {
    const { labels } = getRangeIncomeExpenseSeries([], '2026-06-01', '2026-06-10');
    expect(labels).toHaveLength(10);
    expect(labels[0]).toBe('Jun 1');
  });

  it('buckets by calendar month for ranges longer than 62 days, clipping first/last month', () => {
    const txs = [
      tx({ date: '2026-01-15', type: 'Income', amount: 100 }), // before range start (Jan 20) — excluded
      tx({ date: '2026-01-25', type: 'Income', amount: 200 }), // inside clipped first bucket
      tx({ date: '2026-03-05', type: 'Expense', amount: 30 }), // inside a full middle bucket
      tx({ date: '2026-04-15', type: 'Expense', amount: 999 }), // after range end (Apr 10) — excluded
      tx({ date: '2026-04-05', type: 'Expense', amount: 40 }), // inside clipped last bucket
    ];
    // Jan 20 → Apr 10 is 81 days (> 62), so this buckets by month: Jan/Apr clipped, Feb/Mar full.
    const { labels, income, expenses } = getRangeIncomeExpenseSeries(txs, '2026-01-20', '2026-04-10');
    expect(labels).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
    expect(income[0]).toBe(200); // Jan 15 excluded, Jan 25 included
    expect(expenses[2]).toBe(30);
    expect(expenses[3]).toBe(40); // Apr 15 excluded, Apr 5 included
  });

  it('includes the year in labels when the range spans multiple years', () => {
    const { labels } = getRangeIncomeExpenseSeries([], '2025-11-01', '2026-02-01');
    expect(labels.every(l => /\d{4}/.test(l))).toBe(true);
  });
});

describe('getRangeCumulativeSavings', () => {
  it('starts at 0 on the range first bucket, not a carried-in running balance', () => {
    const txs = [
      tx({ date: '2020-01-01', type: 'Income', amount: 10000 }), // long before the range — must not leak in
      tx({ date: '2026-06-02', type: 'Income', amount: 100 }),
      tx({ date: '2026-06-03', type: 'Expense', amount: 40 }),
    ];
    const { cumulative } = getRangeCumulativeSavings(txs, '2026-06-01', '2026-06-03');
    expect(cumulative).toEqual([0, 100, 60]);
  });
});

describe('getRangeTotals / getRangeSpendingByCategory', () => {
  const txs = [
    tx({ date: '2026-06-05', type: 'Income', amount: 500 }),
    tx({ date: '2026-06-06', type: 'Expense', amount: 120, category: 'Groceries' }),
    tx({ date: '2026-06-07', type: 'Expense', amount: 300, category: 'Rent' }),
    // Internal transfer and opening balance must be excluded from both totals and the pie.
    tx({ date: '2026-06-08', type: 'Expense', amount: 999, category: 'Transfer', tags: ['internal'] }),
    tx({ date: '2026-06-09', type: 'Income', amount: 999, category: 'Opening Balance', tags: ['opening-balance'] }),
    // Outside the range entirely.
    tx({ date: '2026-07-01', type: 'Expense', amount: 1000 }),
  ];

  it('sums income/expenses/net for the range only, excluding transfers/opening balances', () => {
    expect(getRangeTotals(txs, '2026-06-01', '2026-06-30')).toEqual({ income: 500, expenses: 420, net: 80 });
  });

  it('sorts category spending largest first and excludes transfers/opening balances', () => {
    const { labels, values } = getRangeSpendingByCategory(txs, '2026-06-01', '2026-06-30');
    expect(labels).toEqual(['Rent', 'Groceries']);
    expect(values).toEqual([300, 120]);
  });
});

describe('getCategoryFilterNames', () => {
  const categories: Category[] = [
    { id: 'p1', userId: 'u1', name: 'Food', type: 'Expense', icon: 'Utensils', isArchived: false, isDefault: true, sortOrder: 0 },
    { id: 's1', userId: 'u1', name: 'Cafes', type: 'Expense', icon: 'Utensils', isArchived: false, isDefault: false, parentId: 'p1', sortOrder: 0 },
    { id: 'p2', userId: 'u1', name: 'Food', type: 'Income', icon: 'Gift', isArchived: false, isDefault: false, sortOrder: 0 },
  ];

  it('a parent category includes its sub-categories', () => {
    expect(getCategoryFilterNames(categories, 'p1')).toEqual({ type: 'Expense', names: ['Food', 'Cafes'] });
  });

  it('a sub-category matches only itself', () => {
    expect(getCategoryFilterNames(categories, 's1')).toEqual({ type: 'Expense', names: ['Cafes'] });
  });

  it('an Income and an Expense category sharing a name resolve independently', () => {
    expect(getCategoryFilterNames(categories, 'p2')).toEqual({ type: 'Income', names: ['Food'] });
  });

  it('returns null for an unknown id', () => {
    expect(getCategoryFilterNames(categories, 'nope')).toBeNull();
  });
});

describe('parseISODateLocal', () => {
  it('parses as local midnight, not UTC', () => {
    const d = parseISODateLocal('2026-06-20');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(20);
  });
});
