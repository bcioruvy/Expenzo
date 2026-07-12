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
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 12,
        boxPadding: 6,
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: '#334155', tickLength: 0 }, ticks: { color: '#64748b', font: { size: 11 } } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
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
      backgroundColor: ['#0284c7', '#a855f7', '#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [4200, 4500, 4800, 4800, 5100, monthlyIncome || 5650],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10b981'
      },
      {
        label: 'Expenses',
        data: [2800, 3100, 2750, 3200, 2900, monthlyExpenses || 2489],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#ef4444'
      }
    ]
  };

  const cashFlowData = {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    datasets: [
      {
        label: 'Net Cash Flow',
        data: [3200, -450, -680, 1100],
        backgroundColor: ['#10b981', '#ef4444', '#ef4444', '#10b981'],
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
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Balance</span>
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatCurrency(currentBalance, settings.currency)}</h3>
            <p className="text-xs text-emerald-500 mt-1 font-medium flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+3.4% from last month</span>
            </p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Income</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatCurrency(monthlyIncome, settings.currency)}</h3>
            <p className="text-xs text-emerald-500 mt-1 font-medium flex items-center space-x-1">
              <span>Primary Salary + Freelance</span>
            </p>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Expenses</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatCurrency(monthlyExpenses, settings.currency)}</h3>
            <p className="text-xs text-rose-500 mt-1 font-medium flex items-center space-x-1">
              <span>{transactions.filter(t => t.type === 'Expense').length} transactions</span>
            </p>
          </div>
        </div>

        {/* Savings This Month */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Savings This Month</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatCurrency(savingsThisMonth, settings.currency)}</h3>
            <p className="text-xs text-purple-400 mt-1 font-medium flex items-center space-x-1">
              <span>{monthlyIncome ? Math.round((savingsThisMonth/monthlyIncome)*100) : 0}% savings rate</span>
            </p>
          </div>
        </div>

        {/* Budget Usage % */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Budget Usage</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <PieIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{budgetUsagePercent}%</h3>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${budgetUsagePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Finance Terminal</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Financial Command Center</h2>
            <p className="text-sm text-slate-400">Execute lightning-fast transactions, internal wallet transfers, or set up dynamic budgets instantly.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => { setTxCategory('Salary'); setShowIncomeModal(true); }}
              className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center space-x-2 transition-all group"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Add Income</span>
            </button>
            <button 
              onClick={() => { setTxCategory('Food & Dining'); setShowExpenseModal(true); }}
              className="px-5 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm shadow-xl shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center space-x-2 transition-all group"
            >
              <MinusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Add Expense</span>
            </button>
            <button 
              onClick={() => setShowTransferModal(true)}
              className="px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 flex items-center space-x-2 transition-all group"
            >
              <ArrowRightLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Transfer Funds</span>
            </button>
            <button 
              onClick={() => setShowBudgetModal(true)}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm shadow-lg flex items-center space-x-2 transition-all group"
            >
              <PieIcon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Create Budget</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income vs Expense Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Income vs Expense Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">6-Month financial cash flow comparison</p>
            </div>
            <button onClick={() => setActiveTab('analytics')} className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors">
              <span>Full Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>

        {/* Spending Breakdown & Financial Health */}
        <div className="space-y-8 flex flex-col">
          
          {/* Spending Breakdown */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Spending Breakdown</h3>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300">Top 5</span>
            </div>
            <div className="flex-1 min-h-[220px] w-full relative">
              <Doughnut data={spendingDoughnutData} options={doughnutOptions} />
            </div>
          </div>

        </div>

      </div>

      {/* Widgets Grid: Recent Transactions, Upcoming Bills, Health Score, Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Transactions Widget */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Recent Transactions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your latest personal income and expense records</p>
            </div>
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1 transition-colors">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1 overflow-y-auto max-h-[360px] custom-scrollbar pr-2">
            {transactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-2xl px-3 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${
                    tx.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                  }`}>
                    {tx.type === 'Income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">{tx.category}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs">{tx.notes || tx.accountName}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-extrabold tracking-tight ${tx.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Widgets: Health Score & Upcoming Bills */}
        <div className="space-y-8 flex flex-col">
          
          {/* Financial Health Score Widget */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-700 text-white shadow-xl shadow-sky-500/20 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Financial Health Score</span>
              <Award className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div className="relative z-10 flex items-baseline space-x-2">
              <h3 className="text-4xl font-extrabold tracking-tight">{financialHealthScore}</h3>
              <span className="text-sm text-sky-200 font-medium">/ 100</span>
            </div>
            <p className="text-xs text-sky-100 mt-2 leading-relaxed relative z-10">
              Excellent standing! Your strong savings buffer and smart budget limits put you in the top 10% of salaried individuals.
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-white font-bold relative z-10">
              <span>Recommendations</span>
              <button onClick={() => setActiveTab('smart')} className="hover:underline flex items-center space-x-1 text-amber-300">
                <span>Unlock Insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Upcoming Bills Widget */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Upcoming Bills</h3>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 font-bold">Requires Action</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-sky-500/40 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">{bill.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Due: {bill.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white">{formatCurrency(bill.amount, settings.currency)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold inline-block mt-1 ${
                      bill.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add Personal Income</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="4800.00"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Income Category</label>
                <select 
                  value={txCategory} onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Target Account</label>
                <select 
                  value={txAccId} onChange={(e) => setTxAccId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Notes / Description</label>
                <input 
                  type="text" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Monthly salary deposit"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all">Add Income</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add Personal Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="85.50"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Expense Category</label>
                <select 
                  value={txCategory} onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Source Account / Card</label>
                <select 
                  value={txAccId} onChange={(e) => setTxAccId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Notes / Description</label>
                <input 
                  type="text" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Dinner with colleagues"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transfer Between Accounts</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">From Account</label>
                <select 
                  value={transFrom} onChange={(e) => setTransFrom(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">To Account</label>
                <select 
                  value={transTo} onChange={(e) => setTransTo(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={transAmount} onChange={(e) => setTransAmount(e.target.value)} placeholder="500.00"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Notes</label>
                <input 
                  type="text" value={transNotes} onChange={(e) => setTransNotes(e.target.value)} placeholder="Monthly savings contribution"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create New Budget</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Budget Name</label>
                <input 
                  type="text" required value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Weekend Dining & Fun"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Target Category</label>
                <select 
                  value={bCategory} onChange={(e) => setBCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Monthly Cap ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={bAmount} onChange={(e) => setBAmount(e.target.value)} placeholder="400.00"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg" 
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
