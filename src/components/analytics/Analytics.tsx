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

  // Monthly Comparison Bar Chart Data
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [4200, 4500, 4800, 4800, 5100, 5650],
        backgroundColor: '#10b981',
        borderRadius: 8
      },
      {
        label: 'Expenses',
        data: [2800, 3100, 2750, 3200, 2900, 2489],
        backgroundColor: '#ef4444',
        borderRadius: 8
      }
    ]
  };

  // Savings Analysis Area Chart Data (Area chart is Line with fill: true)
  const areaData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Cumulative Savings Growth',
        data: [1400, 2800, 4850, 6450, 8650, 11811],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#a855f7'
      }
    ]
  };

  // Cash Flow Line Chart Data
  const cashFlowLineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Net Cash Flow',
        data: [3200, 2750, 2070, 3161],
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
            <Bar data={barData} options={baseChartOptions} />
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
            <Line data={areaData} options={baseChartOptions} />
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
            <Pie data={pieData} options={pieOptions} />
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
            <Line data={cashFlowLineData} options={baseChartOptions} />
          </div>
        </div>

      </div>

    </div>
  );
};
