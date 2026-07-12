import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Target, 
  CheckCircle 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export const Reports: React.FC = () => {
  const { transactions, budgets, goals, monthlyIncome, monthlyExpenses, savingsThisMonth, settings } = useFinance();

  const [selectedReport, setSelectedReport] = useState<'monthly' | 'income' | 'expense' | 'budget' | 'savings'>('monthly');
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Export handlers
  const handleExportCSV = (reportTitle: string) => {
    let headers: string[] = [];
    let rows: string[] = [];

    if (selectedReport === 'income') {
      headers = ['Type', 'Category', 'Amount', 'Date', 'Account', 'Notes'];
      rows = transactions.filter(t => t.type === 'Income').map(t => 
        `"${t.type}","${t.category}",${t.amount},"${t.date}","${t.accountName}","${t.notes}"`
      );
    } else if (selectedReport === 'expense') {
      headers = ['Type', 'Category', 'Amount', 'Date', 'Account', 'Notes'];
      rows = transactions.filter(t => t.type === 'Expense').map(t => 
        `"${t.type}","${t.category}",${t.amount},"${t.date}","${t.accountName}","${t.notes}"`
      );
    } else if (selectedReport === 'budget') {
      headers = ['Budget Name', 'Type', 'Target Amount', 'Spent Amount', 'Status'];
      rows = budgets.map(b => 
        `"${b.name}","${b.type}",${b.targetAmount},${b.spentAmount},"${b.spentAmount > b.targetAmount ? 'Over Budget' : 'On Track'}"`
      );
    } else if (selectedReport === 'savings') {
      headers = ['Goal Name', 'Category', 'Target Amount', 'Current Saved', 'Deadline'];
      rows = goals.map(g => 
        `"${g.name}","${g.category}",${g.targetAmount},${g.currentAmount},"${g.deadline}"`
      );
    } else {
      headers = ['Metric', 'Amount'];
      rows = [
        `"Total Monthly Income",${monthlyIncome}`,
        `"Total Monthly Expenses",${monthlyExpenses}`,
        `"Net Savings This Month",${savingsThisMonth}`
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportTitle.replace(/\s+/g, '_')}_${reportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = (reportTitle: string) => {
    // Simulate Excel download via tab-separated values or similar
    handleExportCSV(reportTitle);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const reportConfigs = [
    { id: 'monthly', label: 'Monthly Summary', icon: FileText, desc: 'Complete financial ledger summary including net cash flow, aggregated income, and expenses.' },
    { id: 'income', label: 'Income Report', icon: TrendingUp, desc: 'Granular breakdown of salary deposits, client freelancing, and passive investment returns.' },
    { id: 'expense', label: 'Expense Report', icon: TrendingDown, desc: 'Detailed tracking of outbound transactions across dining, rent, utility bills, and shopping.' },
    { id: 'budget', label: 'Budget Report', icon: PieIcon, desc: 'Active monitoring of target caps versus actual monthly expenditures with warning metrics.' },
    { id: 'savings', label: 'Savings Report', icon: Target, desc: 'Visual progression of milestone savings targets, emergency funds, and real estate buffers.' },
  ];

  const currentConfig = reportConfigs.find(r => r.id === selectedReport)!;

  return (
    <div className="space-y-8">
      
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Professional Financial Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate corporate-grade personal financial statements ready for export to PDF, CSV, or Excel.</p>
        </div>

        <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-sky-500 ml-2" />
            <input 
              type="month" 
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white text-xs font-bold focus:outline-none pr-2 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {reportConfigs.map(item => {
          const Icon = item.icon;
          const isActive = selectedReport === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedReport(item.id as any)}
              className={`p-5 rounded-3xl border text-left transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xl shadow-sky-500/25 dark:shadow-sky-500/10' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-sky-500'} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && <CheckCircle className="w-5 h-5 text-white animate-in fade-in" />}
              </div>
              <h3 className={`font-bold text-sm tracking-tight mt-4 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{item.label}</h3>
            </button>
          );
        })}
      </div>

      {/* Selected Report Output View */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl shadow-slate-100 dark:shadow-none space-y-8 printable-section">
        
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-700/60">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500">Expenzo Premium Audit Ledger</span>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{currentConfig.label}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">{currentConfig.desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExportCSV(currentConfig.label)}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExportExcel(currentConfig.label)}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-sky-500/20 flex items-center space-x-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Report Preview Tables */}
        {selectedReport === 'monthly' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Income</span>
                <p className="text-2xl font-extrabold text-emerald-500 mt-2">{formatCurrency(monthlyIncome, settings.currency)}</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Expenses</span>
                <p className="text-2xl font-extrabold text-rose-500 mt-2">{formatCurrency(monthlyExpenses, settings.currency)}</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Net Savings Margin</span>
                <p className={`text-2xl font-extrabold mt-2 ${savingsThisMonth >= 0 ? 'text-purple-500' : 'text-rose-500'}`}>
                  {formatCurrency(savingsThisMonth, settings.currency)}
                </p>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                    <th className="py-4 px-6">Description / Account</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {transactions.slice(0, 15).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800 dark:text-white">{tx.category}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{tx.accountName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block ${tx.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{tx.date}</td>
                      <td className={`py-4 px-6 text-right font-extrabold ${tx.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'income' && (
          <div className="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                  <th className="py-4 px-6">Category / Source</th>
                  <th className="py-4 px-6">Target Account</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm font-medium text-slate-700 dark:text-slate-300">
                {transactions.filter(t => t.type === 'Income').map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 dark:text-white">{tx.category}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tx.notes || 'No notes'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400">{tx.accountName}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{tx.paymentMethod}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{tx.date}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-500">+{formatCurrency(tx.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'expense' && (
          <div className="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                  <th className="py-4 px-6">Category / Merchant</th>
                  <th className="py-4 px-6">Source Account</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm font-medium text-slate-700 dark:text-slate-300">
                {transactions.filter(t => t.type === 'Expense').map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 dark:text-white">{tx.category}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tx.notes || 'No notes'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400">{tx.accountName}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{tx.paymentMethod}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{tx.date}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-rose-500">-{formatCurrency(tx.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'budget' && (
          <div className="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                  <th className="py-4 px-6">Budget Name</th>
                  <th className="py-4 px-6">Budget Type</th>
                  <th className="py-4 px-6 text-right">Target Cap</th>
                  <th className="py-4 px-6 text-right">Actual Spent</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm font-medium text-slate-700 dark:text-slate-300">
                {budgets.map(bg => (
                  <tr key={bg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{bg.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{bg.type}</td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(bg.targetAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(bg.spentAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block ${bg.spentAmount > bg.targetAmount ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {bg.spentAmount > bg.targetAmount ? 'Exceeded' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'savings' && (
          <div className="border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                  <th className="py-4 px-6">Goal Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Target Amount</th>
                  <th className="py-4 px-6 text-right">Current Saved</th>
                  <th className="py-4 px-6 text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm font-medium text-slate-700 dark:text-slate-300">
                {goals.map(gl => (
                  <tr key={gl.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{gl.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{gl.category}</td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(gl.targetAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-500">{formatCurrency(gl.currentAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{gl.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
