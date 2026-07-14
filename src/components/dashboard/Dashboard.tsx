import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet, 
  PlusCircle, 
  MinusCircle, 
  ArrowRightLeft, 
  PieChart as PieIcon, 
  Calendar, 
  Award, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { getMonthlyIncomeExpense, getWeeklyCashFlow } from '../../utils/chartData';
import { EmptyState } from '../shared/EmptyState';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { 
    currentBalance, 
    monthlyIncome, 
    monthlyExpenses, 
    savingsThisMonth, 
    budgetUsagePercent,
    financialHealthScore,
    upcomingBills,
    transactions,
    budgets,
    accounts,
    addTransaction,
    transferFunds,
    addBudget,
    settings
  } = useFinance();

  // Modals state
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Form states for modals
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Salary');
  const [txAccId, setTxAccId] = useState(accounts[0]?.id || '');
  const [txNotes, setTxNotes] = useState('');

  const [transFrom, setTransFrom] = useState(accounts[0]?.id || '');
  const [transTo, setTransTo] = useState(accounts[1]?.id || '');
  const [transAmount, setTransAmount] = useState('');
  const [transNotes, setTransNotes] = useState('');

  const [bName, setBName] = useState('');
  const [bCategory, setBCategory] = useState('Food & Dining');
  const [bAmount, setBAmount] = useState('');

  // Chart options & data
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2D2A26',
        titleColor: '#F4F0EA',
        bodyColor: '#F4F0EA',
        padding: 12,
        boxPadding: 6,
        borderColor: '#38342F',
        borderWidth: 1,
        cornerRadius: 12,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#766F66', font: { size: 11 } } },
      y: { grid: { color: '#E3DCCF', tickLength: 0 }, ticks: { color: '#766F66', font: { size: 11 } } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#766F66', font: { size: 11 }, boxWidth: 12 } },
    },
    cutout: '75%'
  };

  // Prepare spending breakdown by category
  const expensesByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const spendingDoughnutData = {
    labels: Object.keys(expensesByCategory).slice(0, 5),
    datasets: [{
      data: Object.values(expensesByCategory).slice(0, 5),
      backgroundColor: ['#6E8B74', '#C98B6A', '#C7A86B', '#89A48E', '#D59B7B'],
      borderWidth: 0
    }]
  };

  const hasCategoryData = Object.keys(expensesByCategory).length > 0;

  const { labels: trendLabels, income: trendIncome, expenses: trendExpenses } = getMonthlyIncomeExpense(transactions, 6);
  const hasTrendData = trendIncome.some(v => v > 0) || trendExpenses.some(v => v > 0);
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Income',
        data: trendIncome,
        borderColor: '#6E8B74',
        backgroundColor: 'rgba(110, 139, 116, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#6E8B74'
      },
      {
        label: 'Expenses',
        data: trendExpenses,
        borderColor: '#C98B6A',
        backgroundColor: 'rgba(201, 139, 106, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#C98B6A'
      }
    ]
  };

  const { labels: cfLabels, netFlow } = getWeeklyCashFlow(transactions, 4);
  const hasCashFlowData = netFlow.some(v => v !== 0);
  const cashFlowData = {
    labels: cfLabels,
    datasets: [
      {
        label: 'Net Cash Flow',
        data: netFlow,
        backgroundColor: netFlow.map(v => v >= 0 ? '#6E8B74' : '#C98B6A'),
        borderRadius: 12
      }
    ]
  };

  // Handlers for Modals
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === txAccId) || accounts[0];
    await addTransaction({
      type: 'Income',
      amount: parseFloat(txAmount),
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
      notes: txNotes || 'Direct income addition',
      tags: ['manual', 'income'],
      paymentMethod: 'Bank Transfer',
      accountId: acc.id,
      accountName: acc.name
    });
    setShowIncomeModal(false);
    setTxAmount('');
    setTxNotes('');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === txAccId) || accounts[0];
    await addTransaction({
      type: 'Expense',
      amount: parseFloat(txAmount),
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
      notes: txNotes || 'Direct expense addition',
      tags: ['manual', 'expense'],
      paymentMethod: 'Credit Card',
      accountId: acc.id,
      accountName: acc.name
    });
    setShowExpenseModal(false);
    setTxAmount('');
    setTxNotes('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    await transferFunds(transFrom, transTo, parseFloat(transAmount), transNotes);
    setShowTransferModal(false);
    setTransAmount('');
    setTransNotes('');
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBudget({
      name: bName,
      type: 'Category Budget',
      category: bCategory,
      targetAmount: parseFloat(bAmount),
      spentAmount: 0,
      period: 'monthly',
      alertThreshold: 85
    });
    setShowBudgetModal(false);
    setBName('');
    setBAmount('');
  };

  return (
    <div className="space-y-8">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Current Balance */}
        <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-sage/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">Current Balance</span>
            <div className="p-2.5 rounded-2xl bg-warm-sage/15 border border-warm-sage/25 text-warm-sage group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{formatCurrency(currentBalance, settings.currency)}</h3>
            <p className="text-xs text-warm-sage dark:text-warm-dark-sage mt-1 font-medium flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+3.4% from last month</span>
            </p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-sage/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">Monthly Income</span>
            <div className="p-2.5 rounded-2xl bg-warm-sage/15 dark:bg-warm-dark-sage/15 border border-warm-sage/25 dark:border-warm-dark-sage/30 text-warm-sage dark:text-warm-dark-sage group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{formatCurrency(monthlyIncome, settings.currency)}</h3>
            <p className="text-xs text-warm-sage dark:text-warm-dark-sage mt-1 font-medium flex items-center space-x-1">
              <span>Primary Salary + Freelance</span>
            </p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-terracotta/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">Monthly Expenses</span>
            <div className="p-2.5 rounded-2xl bg-warm-terracotta/15 dark:bg-warm-dark-terracotta/15 border border-warm-terracotta/25 dark:border-warm-dark-terracotta/30 text-warm-terracotta dark:text-warm-dark-terracotta group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{formatCurrency(monthlyExpenses, settings.currency)}</h3>
            <p className="text-xs text-warm-terracotta dark:text-warm-dark-terracotta mt-1 font-medium flex items-center space-x-1">
              <span>{transactions.filter(t => t.type === 'Expense').length} transactions</span>
            </p>
          </div>
        </div>

        {/* Savings This Month */}
        <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">Savings This Month</span>
            <div className="p-2.5 rounded-2xl bg-warm-gold/15 border border-warm-gold/25 text-warm-gold group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{formatCurrency(savingsThisMonth, settings.currency)}</h3>
            <p className="text-xs text-warm-dark-gold mt-1 font-medium flex items-center space-x-1">
              <span>{monthlyIncome ? Math.round((savingsThisMonth/monthlyIncome)*100) : 0}% savings rate</span>
            </p>
          </div>
        </div>

        {/* Budget Usage % */}
        <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-gold/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">Budget Usage</span>
            <div className="p-2.5 rounded-2xl bg-warm-gold/15 dark:bg-warm-dark-gold/15 border border-warm-gold/25 dark:border-warm-dark-gold/30 text-warm-gold dark:text-warm-dark-gold group-hover:scale-110 transition-transform">
              <PieIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{budgetUsagePercent}%</h3>
            <div className="w-full bg-warm-surface dark:bg-warm-dark-surface h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${budgetUsagePercent > 90 ? 'bg-warm-terracotta' : budgetUsagePercent > 75 ? 'bg-warm-gold' : 'bg-warm-sage'}`}
                style={{ width: `${budgetUsagePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-warm-surface to-warm-card dark:from-warm-dark-surface dark:to-warm-dark-card border border-warm-surface dark:border-warm-dark-surface shadow-xl shadow-warm dark:shadow-none relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-warm-sage/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-warm-sage/10 border border-warm-sage/30 text-warm-sage dark:text-warm-dark-sage text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Household, at a Glance</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-warm-text dark:text-warm-dark-text">Quick Actions</h2>
            <p className="text-sm text-warm-muted dark:text-warm-dark-muted">Log a transaction, move money between accounts, or set up a new budget in seconds.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => { setTxCategory('Salary'); setShowIncomeModal(true); }}
              className="px-5 py-3.5 rounded-2xl bg-warm-sage hover:bg-warm-dark-sage text-white font-bold text-sm shadow-xl shadow-warm/20 hover:shadow-warm/30 flex items-center space-x-2 transition-all group"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Add Income</span>
            </button>
            <button 
              onClick={() => { setTxCategory('Food & Dining'); setShowExpenseModal(true); }}
              className="px-5 py-3.5 rounded-2xl bg-warm-terracotta hover:bg-warm-dark-terracotta text-white font-bold text-sm shadow-xl shadow-warm/20 hover:shadow-warm/30 flex items-center space-x-2 transition-all group"
            >
              <MinusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Add Expense</span>
            </button>
            <button 
              onClick={() => setShowTransferModal(true)}
              className="px-5 py-3.5 rounded-2xl bg-warm-gold/10 hover:bg-warm-gold/20 border border-warm-gold/40 text-warm-gold dark:text-warm-dark-gold font-bold text-sm shadow-lg flex items-center space-x-2 transition-all group"
            >
              <ArrowRightLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Transfer Funds</span>
            </button>
            <button 
              onClick={() => setShowBudgetModal(true)}
              className="px-5 py-3.5 rounded-2xl bg-warm-card dark:bg-warm-dark-card hover:bg-warm-surface dark:hover:bg-warm-dark-surface border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text font-bold text-sm shadow-lg flex items-center space-x-2 transition-all group"
            >
              <PieIcon className="w-5 h-5 text-warm-gold dark:text-warm-dark-gold group-hover:scale-110 transition-transform" />
              <span>Create Budget</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income vs Expense Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Income vs Expense Trend</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">6-Month financial cash flow comparison</p>
            </div>
            <button onClick={() => setActiveTab('analytics')} className="text-xs font-bold text-warm-sage hover:text-warm-sage dark:hover:text-warm-dark-sage flex items-center space-x-1 transition-colors">
              <span>Full Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            {hasTrendData ? (
              <Line data={trendData} options={chartOptions} />
            ) : (
              <EmptyState
                icon={ArrowRight}
                title="No trend data yet"
                message="Log your income and expenses to see how they compare month to month."
                actionLabel="Add a Transaction"
                onAction={() => setShowIncomeModal(true)}
              />
            )}
          </div>
        </div>

        {/* Spending Breakdown & Financial Health */}
        <div className="space-y-8 flex flex-col">
          
          {/* Spending Breakdown */}
          <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Spending Breakdown</h3>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-warm-surface dark:bg-warm-dark-surface font-semibold text-warm-muted dark:text-warm-dark-muted">Top 5</span>
            </div>
            <div className="flex-1 min-h-[220px] w-full relative">
              {hasCategoryData ? (
                <Doughnut data={spendingDoughnutData} options={doughnutOptions} />
              ) : (
                <EmptyState
                  compact
                  title="No spending yet"
                  message="Add an expense to see your top categories here."
                />
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Widgets Grid: Recent Transactions, Upcoming Bills, Health Score, Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions Widget */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Recent Transactions</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Your latest personal income and expense records</p>
            </div>
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-warm-sage hover:text-warm-sage dark:hover:text-warm-dark-sage flex items-center space-x-1 transition-colors">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 flex-1 overflow-y-auto max-h-[360px] custom-scrollbar pr-2">
            {transactions.length === 0 ? (
              <EmptyState
                icon={ArrowUpRight}
                title="No transactions yet"
                message="Once you add income or expenses, they'll show up here."
                actionLabel="Add a Transaction"
                onAction={() => setShowIncomeModal(true)}
              />
            ) : (
              transactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between group hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 rounded-2xl px-3 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${
                    tx.type === 'Income' ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage border border-warm-sage/30' : 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta border border-warm-terracotta/30'
                  }`}>
                    {tx.type === 'Income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warm-text dark:text-warm-dark-text tracking-tight">{tx.category}</p>
                    <p className="text-[11px] text-warm-muted dark:text-warm-dark-muted truncate max-w-[180px] sm:max-w-xs">{tx.notes || tx.accountName}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-extrabold tracking-tight ${tx.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                    {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                  </p>
                  <p className="text-[10px] text-warm-muted dark:text-warm-dark-muted font-medium">{tx.date}</p>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column Widgets: Health Score & Upcoming Bills */}
        <div className="space-y-8 flex flex-col">
          
          {/* Financial Health Score Widget */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-warm-sage to-warm-dark-sage text-white shadow-xl shadow-warm/20 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-warm-dark-text">Financial Health Score</span>
              <Award className="w-6 h-6 text-warm-dark-gold animate-pulse" />
            </div>
            <div className="relative z-10 flex items-baseline space-x-2">
              <h3 className="text-4xl font-extrabold tracking-tight">{financialHealthScore}</h3>
              <span className="text-sm text-warm-dark-sage font-medium">/ 100</span>
            </div>
            <p className="text-xs text-warm-dark-text mt-2 leading-relaxed relative z-10">
              Excellent standing! Your strong savings buffer and smart budget limits put you in the top 10% of salaried individuals.
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white font-bold relative z-10">
              <span>Recommendations</span>
              <button onClick={() => setActiveTab('smart')} className="hover:underline flex items-center space-x-1 text-warm-dark-gold">
                <span>Unlock Insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Upcoming Bills Widget */}
          <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Upcoming Bills</h3>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-warm-gold/10 text-warm-gold dark:text-warm-dark-gold font-bold">Requires Action</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="p-3.5 rounded-2xl bg-warm-bg dark:bg-warm-dark-surface/30 border border-warm-surface dark:border-warm-dark-surface/50 flex items-center justify-between group hover:border-warm-sage/40 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-warm-text dark:text-warm-dark-text tracking-tight">{bill.title}</p>
                      <p className="text-[10px] text-warm-muted dark:text-warm-dark-muted font-medium">Due: {bill.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-extrabold text-warm-text dark:text-warm-dark-text">{formatCurrency(bill.amount, settings.currency)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold inline-block mt-1 ${
                      bill.isPaid ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta'
                    }`}>
                      {bill.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODALS */}
      
      {/* Add Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-card dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">Add Personal Income</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="4800.00"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Income Category</label>
                <select 
                  value={txCategory} onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  <option value="Salary">Salary</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Investment Returns">Investment Returns</option>
                  <option value="Rental Income">Rental Income</option>
                  <option value="Gift Received">Gift Received</option>
                  <option value="Refund">Refund</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Target Account</label>
                <select 
                  value={txAccId} onChange={(e) => setTxAccId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Notes / Description</label>
                <input 
                  type="text" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Monthly salary deposit"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-warm-sage hover:bg-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">Add Income</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-card dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">Add Personal Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="85.50"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Expense Category</label>
                <select 
                  value={txCategory} onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Internet">Internet</option>
                  <option value="Rent">Rent</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Source Account / Card</label>
                <select 
                  value={txAccId} onChange={(e) => setTxAccId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Notes / Description</label>
                <input 
                  type="text" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Dinner with colleagues"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-warm-terracotta hover:bg-warm-dark-terracotta text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-card dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">Transfer Between Accounts</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">From Account</label>
                <select 
                  value={transFrom} onChange={(e) => setTransFrom(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">To Account</label>
                <select 
                  value={transTo} onChange={(e) => setTransTo(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={transAmount} onChange={(e) => setTransAmount(e.target.value)} placeholder="500.00"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Notes</label>
                <input 
                  type="text" value={transNotes} onChange={(e) => setTransNotes(e.target.value)} placeholder="Monthly savings contribution"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-warm-sage hover:bg-warm-sage text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-card dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">Create New Budget</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Budget Name</label>
                <input 
                  type="text" required value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Weekend Dining & Fun"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Target Category</label>
                <select 
                  value={bCategory} onChange={(e) => setBCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Monthly Cap ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={bAmount} onChange={(e) => setBAmount(e.target.value)} placeholder="400.00"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-lg" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-warm-gold hover:bg-warm-gold text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
