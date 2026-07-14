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
import { getMonthlyIncomeExpense, getCumulativeSavings, getWeeklyCashFlow } from '../../utils/chartData';
import { EmptyState } from '../shared/EmptyState';

export const Analytics: React.FC = () => {
  const { transactions, accounts, budgets } = useFinance();

  // Filters State
  const [dateRange, setDateRange] = useState('6m'); // 1m, 3m, 6m, 1y
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');

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

  // Prepare filtered transactions for analytics
  const filteredTxs = useMemo(() => {
    let list = [...transactions];
    if (filterCategory !== 'All') {
      list = list.filter(t => t.category === filterCategory);
    }
    if (filterAccount !== 'All') {
      list = list.filter(t => t.accountId === filterAccount);
    }
    return list;
  }, [transactions, filterCategory, filterAccount]);

  // Calculations for charts
  const expenseSummaryByCategory: Record<string, number> = {};
  filteredTxs.filter(t => t.type === 'Expense').forEach(t => {
    expenseSummaryByCategory[t.category] = (expenseSummaryByCategory[t.category] || 0) + t.amount;
  });

  const pieData = {
    labels: Object.keys(expenseSummaryByCategory),
    datasets: [{
      data: Object.values(expenseSummaryByCategory),
      backgroundColor: ['#6E8B74', '#C98B6A', '#C7A86B', '#89A48E', '#D59B7B', '#D4B97C', '#A88F6E', '#8FA893'],
      borderWidth: 0
    }]
  };

  // Monthly Comparison Bar Chart Data — computed from real transactions
  const { labels: monthLabels, income: monthlyIncomeSeries, expenses: monthlyExpenseSeries } = getMonthlyIncomeExpense(filteredTxs, 6);
  const hasMonthlyData = monthlyIncomeSeries.some(v => v > 0) || monthlyExpenseSeries.some(v => v > 0);
  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: monthlyIncomeSeries,
        backgroundColor: '#6E8B74',
        borderRadius: 8
      },
      {
        label: 'Expenses',
        data: monthlyExpenseSeries,
        backgroundColor: '#C98B6A',
        borderRadius: 8
      }
    ]
  };

  // Savings Analysis Area Chart Data — cumulative real net savings
  const { labels: savingsLabels, cumulative } = getCumulativeSavings(filteredTxs, 6);
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

  // Cash Flow Line Chart Data — real net flow per week
  const { labels: cashFlowLabels, netFlow } = getWeeklyCashFlow(filteredTxs, 4);
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

  const hasSpendingData = Object.keys(expenseSummaryByCategory).length > 0;

  return (
    <div className="space-y-8">
      
      {/* Analytics Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-warm-dark-card p-6 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Advanced Financial Analytics</h2>
          <p className="text-xs text-warm-muted dark:text-warm-dark-muted mt-1">Extract powerful insights from your cash flow, spending trends, and net savings growth.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Date Range Selection */}
          <div className="flex items-center space-x-2 bg-warm-bg dark:bg-warm-dark-bg p-1.5 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
            <Calendar className="w-4 h-4 text-warm-sage ml-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-warm-text dark:text-warm-dark-text text-xs font-bold focus:outline-none pr-2"
            >
              <option value="1m">Last 30 Days</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
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
              <option value="Food & Dining">Food & Dining</option>
              <option value="Groceries">Groceries</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Subscriptions">Subscriptions</option>
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

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Comparison Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Monthly Income & Expense Comparison</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Cash flow balanced overview</p>
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
                message="Add a transaction to see your monthly income and spending compared here."
              />
            )}
          </div>
        </div>

        {/* Savings Growth Area Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Cumulative Savings Analysis</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Projected savings build-up over 6 months</p>
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
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Proportional visual distribution</p>
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

        {/* Monthly Cash Flow Line Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Weekly Net Cash Flow</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Real-time liquidity and wallet health</p>
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
