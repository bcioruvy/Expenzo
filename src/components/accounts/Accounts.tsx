import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types';
import { 
  Wallet, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  ArrowRightLeft, 
  Building2, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  TrendingUp, 
  Check, 
  X 
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from '../../utils/currency';

export const Accounts: React.FC = () => {
  const { accounts, addAccount, editAccount, removeAccount, transferFunds, settings } = useFinance();

  // Modal state for Add/Edit Account
  const [showAccModal, setShowAccModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  // Form states
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('Bank Account');
  const [accBalance, setAccBalance] = useState('');
  const [accCurrency, setAccCurrency] = useState(DEFAULT_CURRENCY);
  const [accColor, setAccColor] = useState('#0284c7');

  // Modal state for Transfer Funds
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transFrom, setTransFrom] = useState(accounts[0]?.id || '');
  const [transTo, setTransTo] = useState(accounts[1]?.id || '');
  const [transAmount, setTransAmount] = useState('');
  const [transNotes, setTransNotes] = useState('');

  // Icon selector based on account type
  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Bank Account': return Building2;
      case 'Savings Account': return TrendingUp;
      case 'Credit Card': return CreditCard;
      case 'Wallet': return Smartphone;
      case 'Cash': return DollarSign;
      default: return Wallet;
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setAccName('');
    setAccType('Bank Account');
    setAccBalance('');
    setAccCurrency(DEFAULT_CURRENCY);
    setAccColor('#0284c7');
    setShowAccModal(true);
  };

  const openEditModal = (acc: Account) => {
    setModalMode('edit');
    setEditingAcc(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccBalance(acc.balance.toString());
    setAccCurrency(acc.currency);
    setAccColor(acc.color || '#0284c7');
    setShowAccModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      await addAccount({
        name: accName,
        type: accType,
        balance: parseFloat(accBalance),
        currency: accCurrency,
        color: accColor,
        isDefault: accounts.length === 0
      });
    } else if (editingAcc) {
      await editAccount({
        ...editingAcc,
        name: accName,
        type: accType,
        balance: parseFloat(accBalance),
        currency: accCurrency,
        color: accColor
      });
    }
    setShowAccModal(false);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transFrom === transTo) {
      alert('Source and target accounts must be different.');
      return;
    }
    await transferFunds(transFrom, transTo, parseFloat(transAmount), transNotes);
    setShowTransferModal(false);
    setTransAmount('');
    setTransNotes('');
  };

  return (
    <div className="space-y-8">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Financial Accounts & Cards</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage cash, credit cards, bank accounts, and active savings portfolios.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => { setTransFrom(accounts[0]?.id || ''); setTransTo(accounts[1]?.id || ''); setShowTransferModal(true); }}
            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center space-x-2 transition-colors shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4 text-sky-500" />
            <span>Transfer Funds</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center space-x-2 transition-all group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const Icon = getAccountIcon(acc.type);
          return (
            <div 
              key={acc.id} 
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-sky-500/50 transition-all relative overflow-hidden"
            >
              {/* Decorative Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: acc.color || '#0284c7' }}></div>

              <div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-white group-hover:scale-110 transition-transform shadow-sm">
                      <Icon className="w-6 h-6" style={{ color: acc.color || '#0284c7' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base tracking-tight">{acc.name}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{acc.type}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Balance</span>
                  <h4 className={`text-3xl font-extrabold tracking-tight mt-1 ${acc.balance < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </h4>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300">
                  {acc.currency} Currency
                </span>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditModal(acc)} 
                    title="Edit Account"
                    className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete this account?')) removeAccount(acc.id); }} 
                    title="Delete Account"
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      
      {/* Add / Edit Account Modal */}
      {showAccModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {modalMode === 'add' ? 'Add Financial Account' : 'Edit Account'}
              </h3>
              <button onClick={() => setShowAccModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Account Name</label>
                <input 
                  type="text" required value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Emergency Savings"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-bold" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Account Type</label>
                <select 
                  value={accType} onChange={(e: any) => setAccType(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Account">Bank Account</option>
                  <option value="Savings Account">Savings Account</option>
                  <option value="Wallet">Wallet</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Initial Balance ({getCurrencySymbol(settings.currency)})</label>
                <input 
                  type="number" step="0.01" required value={accBalance} onChange={(e) => setAccBalance(e.target.value)} placeholder="12500.00"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-base" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Currency</label>
                  <input 
                    type="text" required value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Accent Color</label>
                  <input 
                    type="color" value={accColor} onChange={(e) => setAccColor(e.target.value)}
                    className="w-full h-12 p-1 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button type="button" onClick={() => setShowAccModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all">
                  {modalMode === 'add' ? 'Save Account' : 'Update Account'}
                </button>
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
            <form onSubmit={handleExecuteTransfer} className="space-y-4">
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
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
