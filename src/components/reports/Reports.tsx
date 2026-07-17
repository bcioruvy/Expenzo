import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  Target, 
  CheckCircle 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { getBudgetSpentAmount, getReferenceDate } from '../../utils/chartData';

export const Reports: React.FC = () => {
  const { transactions, budgets, goals, monthlyIncome, monthlyExpenses, savingsThisMonth, settings } = useFinance();

  const [selectedReport, setSelectedReport] = useState<'monthly' | 'income' | 'expense' | 'budget' | 'savings'>('monthly');
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Transactions actually filtered to the selected report month — previously
  // reportMonth was only used to name the downloaded file, so exporting "May 2026"
  // dumped every transaction regardless of the month picker.
  const monthTransactions = React.useMemo(
    () => transactions.filter(t => t.date.startsWith(reportMonth)),
    [transactions, reportMonth]
  );
  const isInternalTransfer = (t: typeof monthTransactions[number]) => t.category === 'Transfer' && (t.tags || []).includes('internal');
  const monthIncomeTotal = monthTransactions.filter(t => t.type === 'Income' && !isInternalTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const monthExpenseTotal = monthTransactions.filter(t => t.type === 'Expense' && !isInternalTransfer(t)).reduce((s, t) => s + t.amount, 0);
  const monthSavings = monthIncomeTotal - monthExpenseTotal;
  const referenceDate = React.useMemo(() => new Date(reportMonth + '-15T00:00:00'), [reportMonth]);

  // Export handlers
  const handleExportCSV = (reportTitle: string) => {
    let headers: string[] = [];
    let rows: string[] = [];

    if (selectedReport === 'income') {
      headers = ['Type', 'Category', 'Amount', 'Date', 'Account', 'Notes'];
      rows = monthTransactions.filter(t => t.type === 'Income').map(t => 
        `"${t.type}","${t.category}",${t.amount},"${t.date}","${t.accountName}","${t.notes}"`
      );
    } else if (selectedReport === 'expense') {
      headers = ['Type', 'Category', 'Amount', 'Date', 'Account', 'Notes'];
      rows = monthTransactions.filter(t => t.type === 'Expense').map(t => 
        `"${t.type}","${t.category}",${t.amount},"${t.date}","${t.accountName}","${t.notes}"`
      );
    } else if (selectedReport === 'budget') {
      headers = ['Budget Name', 'Type', 'Target Amount', 'Spent Amount', 'Status'];
      rows = budgets.map(b => {
        const spent = getBudgetSpentAmount(b, transactions, referenceDate);
        return `"${b.name}","${b.type}",${b.targetAmount},${spent},"${spent > b.targetAmount ? 'Over Budget' : 'On Track'}"`;
      });
    } else if (selectedReport === 'savings') {
      headers = ['Goal Name', 'Category', 'Target Amount', 'Current Saved', 'Deadline'];
      rows = goals.map(g => 
        `"${g.name}","${g.category}",${g.targetAmount},${g.currentAmount},"${g.deadline}"`
      );
    } else {
      headers = ['Metric', 'Amount'];
      rows = [
        `"Total Monthly Income",${monthIncomeTotal}`,
        `"Total Monthly Expenses",${monthExpenseTotal}`,
        `"Net Savings This Month",${monthSavings}`
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
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-warm-dark-card p-6 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Professional Financial Reports</h2>
          <p className="text-xs text-warm-muted dark:text-warm-dark-muted mt-1">Generate corporate-grade personal financial statements ready for export to PDF, CSV, or Excel.</p>
        </div>

        <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-warm-bg dark:bg-warm-dark-bg p-2 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
            <Calendar className="w-4 h-4 text-warm-sage ml-2" />
            <input 
              type="month" 
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="bg-transparent text-warm-text dark:text-warm-dark-text text-xs font-bold focus:outline-none pr-2 cursor-pointer"
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
                  ? 'bg-warm-sage text-white border-warm-sage shadow-xl shadow-warm/25 dark:shadow-warm/10' 
                  : 'bg-white dark:bg-warm-dark-card border-warm-surface dark:border-warm-dark-surface/60 text-warm-text dark:text-warm-dark-muted hover:border-warm-surface dark:hover:border-warm-dark-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/20 text-white' : 'bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted group-hover:text-warm-sage'} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isActive && <CheckCircle className="w-5 h-5 text-white animate-in fade-in" />}
              </div>
              <h3 className={`font-bold text-sm tracking-tight mt-4 ${isActive ? 'text-white' : 'text-warm-text dark:text-warm-dark-text'}`}>{item.label}</h3>
            </button>
          );
        })}
      </div>

      {/* Selected Report Output View */}
      <div className="p-8 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-2xl shadow-warm dark:shadow-none space-y-8 printable-section">
        
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-warm-surface dark:border-warm-dark-surface/60">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-sage">Expenzo Premium Audit Ledger</span>
            <h2 className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{currentConfig.label}</h2>
            <p className="text-xs text-warm-muted dark:text-warm-dark-muted max-w-lg">{currentConfig.desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExportCSV(currentConfig.label)}
              className="px-4 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-text dark:text-warm-dark-muted font-bold text-xs flex items-center space-x-2 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-warm-sage dark:text-warm-dark-sage" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage hover:from-warm-sage hover:to-warm-dark-sage text-white font-bold text-xs shadow-xl shadow-warm/20 flex items-center space-x-2 transition-all"
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
              <div className="p-6 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface">
                <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted">Total Income</span>
                <p className="text-2xl font-extrabold text-warm-sage dark:text-warm-dark-sage mt-2">{formatCurrency(monthIncomeTotal, settings.currency)}</p>
              </div>
              <div className="p-6 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface">
                <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted">Total Expenses</span>
                <p className="text-2xl font-extrabold text-warm-terracotta dark:text-warm-dark-terracotta mt-2">{formatCurrency(monthExpenseTotal, settings.currency)}</p>
              </div>
              <div className="p-6 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface">
                <span className="text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted">Net Savings Margin</span>
                <p className={`text-2xl font-extrabold mt-2 ${monthSavings >= 0 ? 'text-warm-gold' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                  {formatCurrency(monthSavings, settings.currency)}
                </p>
              </div>
            </div>

            <div className="border border-warm-surface dark:border-warm-dark-surface/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-bg dark:bg-warm-dark-bg/50 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted border-b border-warm-surface dark:border-warm-dark-surface/60">
                    <th className="py-4 px-6">Description / Account</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
                  {monthTransactions.slice(0, 15).map(tx => (
                    <tr key={tx.id} className="hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-warm-text dark:text-warm-dark-text">{tx.category}</p>
                        <p className="text-xs text-warm-muted dark:text-warm-dark-muted">{tx.accountName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block ${tx.type === 'Income' ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{tx.date}</td>
                      <td className={`py-4 px-6 text-right font-extrabold ${tx.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
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
          <div className="border border-warm-surface dark:border-warm-dark-surface/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-bg dark:bg-warm-dark-bg/50 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted border-b border-warm-surface dark:border-warm-dark-surface/60">
                  <th className="py-4 px-6">Category / Source</th>
                  <th className="py-4 px-6">Target Account</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
                {monthTransactions.filter(t => t.type === 'Income').map(tx => (
                  <tr key={tx.id} className="hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-warm-text dark:text-warm-dark-text">{tx.category}</p>
                      <p className="text-xs text-warm-muted dark:text-warm-dark-muted">{tx.notes || 'No notes'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-warm-muted dark:text-warm-dark-muted">{tx.accountName}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{tx.paymentMethod}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{tx.date}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-warm-sage dark:text-warm-dark-sage">+{formatCurrency(tx.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'expense' && (
          <div className="border border-warm-surface dark:border-warm-dark-surface/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-bg dark:bg-warm-dark-bg/50 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted border-b border-warm-surface dark:border-warm-dark-surface/60">
                  <th className="py-4 px-6">Category / Merchant</th>
                  <th className="py-4 px-6">Source Account</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
                {monthTransactions.filter(t => t.type === 'Expense').map(tx => (
                  <tr key={tx.id} className="hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-warm-text dark:text-warm-dark-text">{tx.category}</p>
                      <p className="text-xs text-warm-muted dark:text-warm-dark-muted">{tx.notes || 'No notes'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-warm-muted dark:text-warm-dark-muted">{tx.accountName}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{tx.paymentMethod}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{tx.date}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-warm-terracotta dark:text-warm-dark-terracotta">-{formatCurrency(tx.amount, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'budget' && (
          <div className="border border-warm-surface dark:border-warm-dark-surface/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-bg dark:bg-warm-dark-bg/50 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted border-b border-warm-surface dark:border-warm-dark-surface/60">
                  <th className="py-4 px-6">Budget Name</th>
                  <th className="py-4 px-6">Budget Type</th>
                  <th className="py-4 px-6 text-right">Target Cap</th>
                  <th className="py-4 px-6 text-right">Actual Spent</th>
                  <th className="py-4 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
                {budgets.map(bg => {
                  const liveSpent = getBudgetSpentAmount(bg, transactions, referenceDate);
                  return (
                  <tr key={bg.id} className="hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-warm-text dark:text-warm-dark-text">{bg.name}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{bg.type}</td>
                    <td className="py-4 px-6 text-right font-semibold text-warm-text dark:text-warm-dark-text">{formatCurrency(bg.targetAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right font-semibold text-warm-text dark:text-warm-dark-text">{formatCurrency(liveSpent, settings.currency)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block ${liveSpent > bg.targetAmount ? 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta' : 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage'}`}>
                        {liveSpent > bg.targetAmount ? 'Exceeded' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'savings' && (
          <div className="border border-warm-surface dark:border-warm-dark-surface/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-bg dark:bg-warm-dark-bg/50 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted border-b border-warm-surface dark:border-warm-dark-surface/60">
                  <th className="py-4 px-6">Goal Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Target Amount</th>
                  <th className="py-4 px-6 text-right">Current Saved</th>
                  <th className="py-4 px-6 text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
                {goals.map(gl => (
                  <tr key={gl.id} className="hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-warm-text dark:text-warm-dark-text">{gl.name}</td>
                    <td className="py-4 px-6 text-xs text-warm-muted dark:text-warm-dark-muted">{gl.category}</td>
                    <td className="py-4 px-6 text-right font-semibold text-warm-text dark:text-warm-dark-text">{formatCurrency(gl.targetAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-warm-sage dark:text-warm-dark-sage">{formatCurrency(gl.currentAmount, settings.currency)}</td>
                    <td className="py-4 px-6 text-right text-xs font-medium text-warm-muted dark:text-warm-dark-muted">{gl.deadline}</td>
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
