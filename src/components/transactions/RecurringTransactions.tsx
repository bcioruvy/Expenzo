import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { RecurringRule } from '../../types';
import { Modal } from '../shared/Modal';
import { EmptyState } from '../shared/EmptyState';
import { Repeat, Plus, Pause, Play, Trash2, Edit3 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../utils/categories';

const FREQUENCY_LABELS: Record<RecurringRule['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const RecurringTransactions: React.FC = () => {
  const { recurringRules, accounts, addRecurringRule, editRecurringRule, removeRecurringRule, settings } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  const [formType, setFormType] = useState<'Income' | 'Expense'>('Expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food & Dining');
  const [formNotes, setFormNotes] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurringRule['frequency']>('weekly');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formAccountId, setFormAccountId] = useState(accounts[0]?.id || '');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Credit Card');

  const resetForm = () => {
    setFormType('Expense');
    setFormAmount('');
    setFormCategory('Food & Dining');
    setFormNotes('');
    setFormFrequency('weekly');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormAccountId(accounts[0]?.id || '');
    setFormPaymentMethod('Credit Card');
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setEditingRule(null);
    setShowModal(true);
  };

  const openEditModal = (rule: RecurringRule) => {
    setModalMode('edit');
    setEditingRule(rule);
    setFormType(rule.type);
    setFormAmount(String(rule.amount));
    setFormCategory(rule.category);
    setFormNotes(rule.notes);
    setFormFrequency(rule.frequency);
    setFormStartDate(rule.startDate);
    setFormEndDate(rule.endDate || '');
    setFormAccountId(rule.accountId);
    setFormPaymentMethod(rule.paymentMethod);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find(a => a.id === formAccountId);
    if (!account) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (modalMode === 'add') {
      await addRecurringRule({
        type: formType,
        amount,
        category: formCategory,
        notes: formNotes,
        tags: [],
        paymentMethod: formPaymentMethod,
        accountId: formAccountId,
        accountName: account.name,
        frequency: formFrequency,
        startDate: formStartDate,
        nextDueDate: formStartDate,
        endDate: formEndDate || undefined,
        isActive: true,
      });
    } else if (editingRule) {
      await editRecurringRule({
        ...editingRule,
        type: formType,
        amount,
        category: formCategory,
        notes: formNotes,
        paymentMethod: formPaymentMethod,
        accountId: formAccountId,
        accountName: account.name,
        frequency: formFrequency,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
      });
    }
    setShowModal(false);
    resetForm();
  };

  const toggleActive = (rule: RecurringRule) => {
    editRecurringRule({ ...rule, isActive: !rule.isActive });
  };

  const categoryOptions = formType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Repeat className="w-5 h-5 text-warm-sage dark:text-warm-dark-sage" />
          <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">Recurring Transactions</h3>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Rule</span>
        </button>
      </div>

      {recurringRules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions yet"
          message="Set up a rule for anything that repeats — coffee every Monday, a biweekly allowance, a yearly subscription — and it'll be added automatically."
        />
      ) : (
        <div className="space-y-3">
          {recurringRules.map(rule => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                rule.isActive
                  ? 'bg-warm-bg dark:bg-warm-dark-bg border-warm-surface dark:border-warm-dark-surface'
                  : 'bg-warm-surface/40 dark:bg-warm-dark-surface/20 border-warm-surface dark:border-warm-dark-surface opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  rule.type === 'Income' ? 'bg-warm-sage/15 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/15 text-warm-terracotta dark:text-warm-dark-terracotta'
                }`}>
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-warm-text dark:text-warm-dark-text truncate">
                    {rule.category}{rule.notes ? ` · ${rule.notes}` : ''}
                  </p>
                  <p className="text-xs text-warm-muted dark:text-warm-dark-muted">
                    {FREQUENCY_LABELS[rule.frequency]} · Next: {rule.nextDueDate} · {rule.accountName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                <span className={`font-bold text-sm ${rule.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                  {rule.type === 'Income' ? '+' : '-'}{formatCurrency(rule.amount, settings.currency)}
                </span>
                <button onClick={() => toggleActive(rule)} title={rule.isActive ? 'Pause' : 'Resume'} className="p-2 rounded-xl hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted transition-colors">
                  {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => openEditModal(rule)} title="Edit" className="p-2 rounded-xl hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => removeRecurringRule(rule.id)} title="Delete" className="p-2 rounded-xl hover:bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)} maxWidthClassName="max-w-lg">
          <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
            <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">
              {modalMode === 'add' ? 'New Recurring Transaction' : 'Edit Recurring Transaction'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-1 bg-warm-bg dark:bg-warm-dark-bg rounded-2xl">
              <button
                type="button"
                onClick={() => { setFormType('Income'); setFormCategory('Salary'); }}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${formType === 'Income' ? 'bg-warm-sage text-white shadow-md' : 'text-warm-muted dark:text-warm-dark-muted'}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => { setFormType('Expense'); setFormCategory('Food & Dining'); }}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${formType === 'Expense' ? 'bg-warm-terracotta text-white shadow-md' : 'text-warm-muted dark:text-warm-dark-muted'}`}
              >
                Expense
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Amount</label>
                <input
                  type="number" step="0.01" required value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Category</label>
                <select
                  value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Frequency</label>
                <select
                  value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as RecurringRule['frequency'])}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Account</label>
                <select
                  value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Start Date</label>
                <input
                  type="date" required value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                  disabled={modalMode === 'edit'}
                  className="w-full max-w-full min-w-0 box-border p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium disabled:opacity-50 appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">End Date (Optional)</label>
                <input
                  type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)}
                  min={formStartDate}
                  className="w-full max-w-full min-w-0 box-border p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium appearance-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Payment Method</label>
              <select
                value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)}
                className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Wallet">Mobile Wallet</option>
                <option value="Online Service">Online Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Notes (Optional)</label>
              <input
                type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="e.g. Morning coffee"
                className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">
                {modalMode === 'add' ? 'Create Rule' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
