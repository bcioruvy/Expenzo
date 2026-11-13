import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart2,
  Layers
} from 'lucide-react';
import {
  DateRangePreset,
  DATE_RANGE_PRESET_OPTIONS,
  resolvePresetDateRange,
  normalizeCustomRange,
  startOfMonthISO,
  todayISODate,
  getRangeIncomeExpenseSeries,
  getRangeCumulativeSavings,
  getRangeWeeklyCashFlow,
  getRangeTotals,
  getRangeSpendingByCategory,
  getCategoryFilterNames,
} from '../../utils/chartData';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';
import { EmptyState } from '../shared/EmptyState';

// Friendly, human-readable description of each preset, used in chart subtitles and the
// page's "period" line so they describe the actual selected range instead of a hardcoded
// window (the old "Projected savings build-up over 6 months" subtitle, regardless of what
// was actually selected).
const RANGE_PRESET_DESCRIPTIONS: Record<DateRangePreset, string> = {
  this_month: 'this month',
  last_month: 'last month',
  last_30_days: 'the last 30 days',
  last_3_months: 'the last 3 months',
  last_6_months: 'the last 6 months',
  this_year: 'this year',
  last_12_months: 'the last 12 months',
  all_time: 'all time',
  custom: 'the selected range',
};

export const Analytics: React.FC = () => {
  const { transactions, accounts, categories, settings } = useFinance();

  // Filters State
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('last_6_months');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('All'); // category id, or 'All'
  const [filterAccount, setFilterAccount] = useState('All');

  // Fixed once per mount — presets are anchored to today's real date, not the device
  // clock re-read on every render (which would shift bucket boundaries mid-session as the
  // page sits open across midnight).
  const todayISO = useMemo(() => todayISODate(), []);

  const handlePresetChange = (value: DateRangePreset) => {
    setRangePreset(value);
    // First time Custom Range is chosen, prefill with 1st-of-this-month → today.
    if (value === 'custom' && !customFrom && !customTo) {
      setCustomFrom(startOfMonthISO(todayISO));
      setCustomTo(todayISO);
    }
  };

  // Keeps the two Custom Range inputs always in chronological order — if the user picks a
  // From date after the current To date, the two values swap rather than producing an
  // inverted (and silently empty) range.
  const handleCustomFromChange = (value: string) => {
    if (customTo && value > customTo) {
      setCustomFrom(customTo);
      setCustomTo(value);
    } else {
      setCustomFrom(value);
    }
  };
  const handleCustomToChange = (value: string) => {
    if (customFrom && value < customFrom) {
      setCustomTo(customFrom);
      setCustomFrom(value);
    } else {
      setCustomTo(value);
    }
  };

  const resolvedRange = useMemo(() => {
    if (rangePreset === 'custom') {
      if (customFrom && customTo) return normalizeCustomRange(customFrom, customTo);
      return { start: startOfMonthISO(todayISO), end: todayISO };
    }
    return resolvePresetDateRange(rangePreset, transactions, new Date());
  }, [rangePreset, customFrom, customTo, transactions, todayISO]);

  const rangeDescription = RANGE_PRESET_DESCRIPTIONS[rangePreset];

  // Chart configuration defaults
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#766F66', font: { size: 12 }, boxWidth: 12 } },
      tooltip: {
        backgroundColor: '#2D2A26',
        titleColor: '#F4F0EA',
        bodyColor: '#F4F0EA',
        padding: 12,
        borderColor: '#38342F',
        borderWidth: 1,
        cornerRadius: 12,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#766F66' } },
      y: { grid: { color: '#E3DCCF' }, ticks: { color: '#766F66' } }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
    }
  };

  // Non-archived categories, grouped into Expense/Income for the dropdown — selecting a
  // parent category filters its sub-categories too (handled by getCategoryFilterNames).
  const activeCategories = useMemo(() => categories.filter(c => !c.isArchived), [categories]);
  const subsOf = (parentId: string) =>
    activeCategories.filter(c => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const expenseParentCategories = activeCategories
    .filter(c => c.type === 'Expense' && !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const incomeParentCategories = activeCategories
    .filter(c => c.type === 'Income' && !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Transactions scoped by category + account only — the date range is applied inside the
  // chartData range helpers themselves, so every chart/total below works off this same list.
  const scopedTxs = useMemo(() => {
    let list = transactions;
    if (filterCategory !== 'All') {
      const categoryFilter = getCategoryFilterNames(categories, filterCategory);
      if (categoryFilter) {
        list = list.filter(t => t.type === categoryFilter.type && categoryFilter.names.includes(t.category));
      }
    }
    if (filterAccount !== 'All') {
      list = list.filter(t => t.accountId === filterAccount);
    }
    return list;
  }, [transactions, filterCategory, filterAccount, categories]);

  const totals = useMemo(
    () => getRangeTotals(scopedTxs, resolvedRange.start, resolvedRange.end),
    [scopedTxs, resolvedRange]
  );

  const { labels: expenseLabels, values: expenseValues } = useMemo(
    () => getRangeSpendingByCategory(scopedTxs, resolvedRange.start, resolvedRange.end),
    [scopedTxs, resolvedRange]
  );
  const pieData = {
    labels: expenseLabels,
    datasets: [{
      data: expenseValues,
      backgroundColor: ['#6E8B74', '#C98B6A', '#C7A86B', '#89A48E', '#D59B7B', '#D4B97C', '#A88F6E', '#8FA893'],
      borderWidth: 0
    }]
  };
  const hasSpendingData = expenseLabels.length > 0;

  const { labels: seriesLabels, income: incomeSeries, expenses: expenseSeries } = useMemo(
    () => getRangeIncomeExpenseSeries(scopedTxs, resolvedRange.start, resolvedRange.end),
    [scopedTxs, resolvedRange]
  );
  const hasMonthlyData = incomeSeries.some(v => v > 0) || expenseSeries.some(v => v > 0);
  const barData = {
    labels: seriesLabels,
    datasets: [
      { label: 'Income', data: incomeSeries, backgroundColor: '#6E8B74', borderRadius: 8 },
      { label: 'Expenses', data: expenseSeries, backgroundColor: '#C98B6A', borderRadius: 8 }
    ]
  };

  const { labels: savingsLabels, cumulative } = useMemo(
    () => getRangeCumulativeSavings(scopedTxs, resolvedRange.start, resolvedRange.end),
    [scopedTxs, resolvedRange]
  );
  const hasSavingsData = cumulative.some(v => v !== 0);
  const areaData = {
    labels: savingsLabels,
    datasets: [
      {
        label: 'Cumulative Savings Growth',
        data: cumulative,
        borderColor: '#C7A86B',
        backgroundColor: 'rgba(199, 168, 107, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#C7A86B'
      }
    ]
  };

  const { labels: cashFlowLabels, netFlow } = useMemo(
    () => getRangeWeeklyCashFlow(scopedTxs, resolvedRange.start, resolvedRange.end),
    [scopedTxs, resolvedRange]
  );
  const hasCashFlowData = netFlow.some(v => v !== 0);
  const cashFlowLineData = {
    labels: cashFlowLabels,
    datasets: [
      {
        label: 'Net Cash Flow',
        data: netFlow,
        borderColor: '#6E8B74',
        backgroundColor: 'rgba(110, 139, 116, 0.12)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: '#6E8B74'
      }
    ]
  };

  return (
    <div className="space-y-8">

      {/* Analytics Toolbar & Filters */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white dark:bg-warm-dark-card p-6 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Advanced Financial Analytics</h2>
          <p className="text-xs text-warm-muted dark:text-warm-dark-muted mt-1">
            {formatDate(resolvedRange.start, settings.dateFormat)} – {formatDate(resolvedRange.end, settings.dateFormat)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">

          {/* Date Range Selection */}
          <div className="flex items-center space-x-2 bg-warm-bg dark:bg-warm-dark-bg p-1.5 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
            <Calendar className="w-4 h-4 text-warm-sage ml-2" />
            <select
              value={rangePreset}
              onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
              className="bg-transparent text-warm-text dark:text-warm-dark-text text-xs font-bold focus:outline-none pr-2"
            >
              {DATE_RANGE_PRESET_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 bg-warm-bg dark:bg-warm-dark-bg p-1.5 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
            <Filter className="w-4 h-4 text-warm-gold ml-2" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-warm-text dark:text-warm-dark-text text-xs font-bold focus:outline-none pr-2"
            >
              <option value="All">All Categories</option>
              <optgroup label="Expense">
                {expenseParentCategories.map(p => (
                  <React.Fragment key={p.id}>
                    <option value={p.id}>{p.name}</option>
                    {subsOf(p.id).map(s => (
                      <option key={s.id} value={s.id}>{'  ↳ '}{s.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
              <optgroup label="Income">
                {incomeParentCategories.map(p => (
                  <React.Fragment key={p.id}>
                    <option value={p.id}>{p.name}</option>
                    {subsOf(p.id).map(s => (
                      <option key={s.id} value={s.id}>{'  ↳ '}{s.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Account Filter */}
          <div className="flex items-center space-x-2 bg-warm-bg dark:bg-warm-dark-bg p-1.5 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
            <DollarSign className="w-4 h-4 text-warm-sage dark:text-warm-dark-sage ml-2" />
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="bg-transparent text-warm-text dark:text-warm-dark-text text-xs font-bold focus:outline-none pr-2"
            >
              <option value="All">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* Custom Range inputs — only shown once "Custom Range" is selected */}
      {rangePreset === 'custom' && (
        <div className="bg-white dark:bg-warm-dark-card p-5 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <label className="block text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted mb-2">Custom Range</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div className="w-full bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-warm-sage">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => handleCustomFromChange(e.target.value)}
                className="w-full bg-transparent border-none px-3 py-2 text-warm-text dark:text-warm-dark-text font-bold text-xs focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="w-full bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-warm-sage">
              <input
                type="date"
                value={customTo}
                onChange={(e) => handleCustomToChange(e.target.value)}
                className="w-full bg-transparent border-none px-3 py-2 text-warm-text dark:text-warm-dark-text font-bold text-xs focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Totals for the selected period + filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Income
          </span>
          <p className="text-2xl font-extrabold text-warm-sage dark:text-warm-dark-sage mt-2">{formatCurrency(totals.income, settings.currency)}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" /> Expenses
          </span>
          <p className="text-2xl font-extrabold text-warm-terracotta dark:text-warm-dark-terracotta mt-2">{formatCurrency(totals.expenses, settings.currency)}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Net
          </span>
          <p className={`text-2xl font-extrabold mt-2 ${totals.net >= 0 ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
            {formatCurrency(totals.net, settings.currency)}
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Monthly Comparison Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Income & Expense Comparison</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Income vs. expenses for {rangeDescription}</p>
            </div>
            <BarChart2 className="w-5 h-5 text-warm-sage" />
          </div>
          <div className="flex-1 min-h-[320px] w-full">
            {hasMonthlyData ? (
              <Bar data={barData} options={baseChartOptions} />
            ) : (
              <EmptyState
                icon={BarChart2}
                title="No income or expenses yet"
                message="Add a transaction to see your income and spending compared here."
              />
            )}
          </div>
        </div>

        {/* Savings Growth Area Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Cumulative Savings Analysis</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Savings build-up for {rangeDescription}</p>
            </div>
            <Layers className="w-5 h-5 text-warm-gold" />
          </div>
          <div className="flex-1 min-h-[320px] w-full">
            {hasSavingsData ? (
              <Line data={areaData} options={baseChartOptions} />
            ) : (
              <EmptyState
                icon={Layers}
                title="No savings history yet"
                message="Once you've logged some income and expenses, your savings growth will build up here over time."
              />
            )}
          </div>
        </div>

        {/* Spending Category Analysis Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Spending Breakdown by Category</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Proportional breakdown for {rangeDescription}</p>
            </div>
            <PieIcon className="w-5 h-5 text-warm-gold dark:text-warm-dark-gold" />
          </div>
          <div className="flex-1 min-h-[320px] w-full relative">
            {hasSpendingData ? (
              <Pie data={pieData} options={pieOptions} />
            ) : (
              <EmptyState
                icon={PieIcon}
                title="No spending recorded yet"
                message="Log an expense to see how your spending breaks down by category."
              />
            )}
          </div>
        </div>

        {/* Weekly Cash Flow Line Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Weekly Net Cash Flow</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Net weekly flow for {rangeDescription}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-warm-sage dark:text-warm-dark-sage" />
          </div>
          <div className="flex-1 min-h-[320px] w-full">
            {hasCashFlowData ? (
              <Line data={cashFlowLineData} options={baseChartOptions} />
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No cash flow data yet"
                message="Your weekly income and expense activity will show up here as you add transactions."
              />
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
