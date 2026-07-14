import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Budget, BudgetType } from '../../types';
import { 
  PieChart as PieIcon, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Gauge 
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

export const Budgets: React.FC = () => {
  const { budgets, addBudget, editBudget, removeBudget, settings } = useFinance();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingBdg, setEditingBdg] = useState<Budget | null>(null);

  // Form states
  const [bName, setBName] = useState('');
  const [bType, setBType] = useState<BudgetType>('Category Budget');
  const [bCategory, setBCategory] = useState('Food & Dining');
  const [bTarget, setBTarget] = useState('');
  const [bSpent, setBSpent] = useState('');
  const [bAlertThreshold, setBAlertThreshold] = useState('85');

  const openAddModal = () => {
    setModalMode('add');
    setBName('');
    setBType('Category Budget');
    setBCategory('Food & Dining');
    setBTarget('');
    setBSpent('0');
    setBAlertThreshold('85');
    setShowModal(true);
  };

  const openEditModal = (b: Budget) => {
    setModalMode('edit');
    setEditingBdg(b);
    setBName(b.name);
    setBType(b.type);
    setBCategory(b.category || 'Food & Dining');
    setBTarget(b.targetAmount.toString());
    setBSpent(b.spentAmount.toString());
    setBAlertThreshold(b.alertThreshold.toString());
    setShowModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      await addBudget({
        name: bName,
        type: bType,
        category: bType === 'Category Budget' ? bCategory : undefined,
        targetAmount: parseFloat(bTarget),
        spentAmount: parseFloat(bSpent) || 0,
        period: 'monthly',
        alertThreshold: parseFloat(bAlertThreshold) || 85
      });
    } else if (editingBdg) {
      await editBudget({
        ...editingBdg,
        name: bName,
        type: bType,
        category: bType === 'Category Budget' ? bCategory : undefined,
        targetAmount: parseFloat(bTarget),
        spentAmount: parseFloat(bSpent) || 0,
        alertThreshold: parseFloat(bAlertThreshold) || 85
      });
    }
    setShowModal(false);
  };

  const categories = ['Food & Dining', 'Groceries', 'Transportation', 'Fuel', 'Utilities', 'Internet', 'Rent', 'Subscriptions', 'Shopping', 'Entertainment', 'Fitness', 'Miscellaneous'];

  return (
    <div className="space-y-8">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-warm-dark-card p-6 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Active Budget Allocation</h2>
          <p className="text-xs text-warm-muted dark:text-warm-dark-muted mt-1">Set strict thresholds and forecast remaining monthly spend to avoid financial creep.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage hover:from-warm-sage hover:to-warm-dark-sage text-white font-bold text-sm shadow-xl shadow-warm/20 flex items-center space-x-2 transition-all group"
        >
          <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Add New Budget</span>
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(bg => {
          const usagePercent = Math.min(100, Math.round((bg.spentAmount / bg.targetAmount) * 100));
          const remaining = bg.targetAmount - bg.spentAmount;
          const isExceeded = usagePercent >= bg.alertThreshold;
          const isFullyExceeded = bg.spentAmount > bg.targetAmount;

          // Budget Forecasting calculation: projects month-end spend based on
          // the actual current day of the month and days in the current month
          const today = new Date();
          const dayOfMonth = today.getDate();
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const forecastTotal = Math.round((bg.spentAmount / dayOfMonth) * daysInMonth);
          const forecastStatus = forecastTotal > bg.targetAmount ? 'Over Target Forecast' : 'Optimal Forecast';

          return (
            <div 
              key={bg.id} 
              className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-sage/50 transition-all relative overflow-hidden"
            >
              {/* Top Row */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-warm-dark-muted">{bg.type}</span>
                  {isFullyExceeded ? (
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta text-xs font-bold border border-warm-terracotta/20 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Over Budget!</span>
                    </div>
                  ) : isExceeded ? (
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-warm-gold/10 text-warm-gold dark:text-warm-dark-gold text-xs font-bold border border-warm-gold/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warning ({usagePercent}%)</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage text-xs font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>On Track</span>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-warm-text dark:text-warm-dark-text text-lg tracking-tight mt-2">{bg.name}</h3>
                {bg.category && <p className="text-xs text-warm-muted dark:text-warm-dark-muted">{bg.category}</p>}

                {/* Progress Bar & Amounts */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-warm-text dark:text-warm-dark-text tracking-tight">{formatCurrency(bg.spentAmount, settings.currency)}</span>
                    <span className="text-xs font-bold text-warm-muted dark:text-warm-dark-muted">of {formatCurrency(bg.targetAmount, settings.currency)} cap</span>
                  </div>

                  <div className="w-full bg-warm-surface dark:bg-warm-dark-surface h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isFullyExceeded ? 'bg-warm-terracotta' : isExceeded ? 'bg-warm-gold' : 'bg-warm-sage'}`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold pt-1">
                    <span className={remaining < 0 ? 'text-warm-terracotta dark:text-warm-dark-terracotta' : 'text-warm-sage dark:text-warm-dark-sage'}>
                      {remaining < 0 ? `-${formatCurrency(Math.abs(remaining), settings.currency)} Exceeded` : `${formatCurrency(remaining, settings.currency)} Remaining`}
                    </span>
                    <span className="text-warm-muted dark:text-warm-dark-muted">{usagePercent}% Used</span>
                  </div>
                </div>

                {/* Forecasting Widget */}
                <div className="mt-6 p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg/60 border border-warm-surface dark:border-warm-dark-surface/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-warm-muted dark:text-warm-dark-muted font-medium">
                    <Gauge className="w-4 h-4 text-warm-sage flex-shrink-0" />
                    <span>Forecast: ~{formatCurrency(forecastTotal, settings.currency)}</span>
                  </div>
                  <span className={`font-bold ${forecastTotal > bg.targetAmount ? 'text-warm-dark-terracotta' : 'text-warm-dark-sage'}`}>
                    {forecastStatus}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-warm-surface dark:border-warm-dark-surface/60 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warm-dark-muted">Alert at {bg.alertThreshold}%</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditModal(bg)} 
                    title="Edit Budget"
                    className="p-2 text-warm-dark-muted hover:text-warm-sage hover:bg-warm-sage/10 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete this budget?')) removeBudget(bg.id); }} 
                    title="Delete Budget"
                    className="p-2 text-warm-dark-muted hover:text-warm-terracotta dark:text-warm-dark-terracotta hover:bg-warm-terracotta/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">
                {modalMode === 'add' ? 'Add Personal Budget' : 'Edit Budget'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Budget Name</label>
                <input 
                  type="text" required value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Dining & Restaurants"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-bold" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Budget Type</label>
                <select 
                  value={bType} onChange={(e: any) => setBType(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  <option value="Monthly Budget">Monthly Budget</option>
                  <option value="Category Budget">Category Budget</option>
                  <option value="Savings Budget">Savings Budget</option>
                </select>
              </div>

              {bType === 'Category Budget' && (
                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Target Category</label>
                  <select 
                    value={bCategory} onChange={(e) => setBCategory(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Monthly Cap ({getCurrencySymbol(settings.currency)})</label>
                  <input 
                    type="number" step="0.01" required value={bTarget} onChange={(e) => setBTarget(e.target.value)} placeholder="500.00"
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-base" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Alert Threshold (%)</label>
                  <input 
                    type="number" required value={bAlertThreshold} onChange={(e) => setBAlertThreshold(e.target.value)} placeholder="85"
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-base" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Current Spent ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" value={bSpent} onChange={(e) => setBSpent(e.target.value)} placeholder="0.00"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-surface dark:border-warm-dark-surface/60">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage hover:from-warm-sage hover:to-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">
                  {modalMode === 'add' ? 'Save Budget' : 'Update Budget'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
