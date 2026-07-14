import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckSquare, 
  Square,
  Tag,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

export const Transactions: React.FC = () => {
  const { transactions, accounts, addTransaction, editTransaction, removeTransaction, settings } = useFinance();

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk Actions state
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form fields for modal
  const [formType, setFormType] = useState<'Income' | 'Expense'>('Expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Food & Dining');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Credit Card');
  const [formAccountId, setFormAccountId] = useState(accounts[0]?.id || '');

  // Filtered and Sorted Transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.category.toLowerCase().includes(query) ||
        t.notes.toLowerCase().includes(query) ||
        t.accountName.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filterType !== 'All') {
      result = result.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }

    if (filterAccount !== 'All') {
      result = result.filter(t => t.accountId === filterAccount);
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, filterType, filterCategory, filterAccount, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const currentTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Bulk selection toggle
  const toggleSelectAll = () => {
    if (selectedTxIds.length === currentTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(currentTransactions.map(t => t.id));
    }
  };

  const toggleSelectTx = (id: string) => {
    if (selectedTxIds.includes(id)) {
      setSelectedTxIds(selectedTxIds.filter(item => item !== id));
    } else {
      setSelectedTxIds([...selectedTxIds, id]);
    }
  };

  // Bulk Delete Action
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTxIds.length} transactions?`)) return;
    for (const id of selectedTxIds) {
      await removeTransaction(id);
    }
    setSelectedTxIds([]);
  };

  // Export Transactions (CSV Simulation)
  const handleExportCSV = () => {
    const headers = ['Type', 'Category', 'Amount', 'Date', 'Account', 'Payment Method', 'Notes', 'Tags'];
    const rows = filteredTransactions.map(t => 
      `"${t.type}","${t.category}",${t.amount},"${t.date}","${t.accountName}","${t.paymentMethod}","${t.notes.replace(/"/g, '""')}","${t.tags.join(', ')}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Add Modal
  const openAddModal = () => {
    setModalMode('add');
    setFormType('Expense');
    setFormAmount('');
    setFormCategory('Food & Dining');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormTags('dining');
    setFormPaymentMethod('Credit Card');
    setFormAccountId(accounts[0]?.id || '');
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (tx: Transaction) => {
    setModalMode('edit');
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormNotes(tx.notes);
    setFormTags(tx.tags.join(', '));
    setFormPaymentMethod(tx.paymentMethod);
    setFormAccountId(tx.accountId);
    setShowModal(true);
  };

  // Submit Add/Edit Form
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === formAccountId) || accounts[0];
    const tagsArray = formTags.split(',').map(tag => tag.trim()).filter(Boolean);

    if (modalMode === 'add') {
      await addTransaction({
        type: formType,
        amount: parseFloat(formAmount),
        category: formCategory,
        date: formDate,
        notes: formNotes,
        tags: tagsArray,
        paymentMethod: formPaymentMethod,
        accountId: acc.id,
        accountName: acc.name
      });
    } else if (editingTx) {
      await editTransaction({
        ...editingTx,
        type: formType,
        amount: parseFloat(formAmount),
        category: formCategory,
        date: formDate,
        notes: formNotes,
        tags: tagsArray,
        paymentMethod: formPaymentMethod,
        accountId: acc.id,
        accountName: acc.name
      });
    }
    setShowModal(false);
  };

  // Available Categories based on Form Type
  const incomeCategories = ['Salary', 'Bonus', 'Overtime', 'Freelance', 'Investment Returns', 'Rental Income', 'Gift Received', 'Refund', 'Other Income'];
  const expenseCategories = ['Food & Dining', 'Groceries', 'Transportation', 'Fuel', 'Utilities', 'Internet', 'Mobile Package', 'Rent', 'Mortgage', 'Healthcare', 'Insurance', 'Education', 'Clothing', 'Entertainment', 'Subscriptions', 'Travel', 'Family Support', 'Charity', 'Personal Care', 'Shopping', 'Fitness', 'Emergency', 'Miscellaneous'];

  return (
    <div className="space-y-8">
      
      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-warm-dark-card p-6 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none">
        
        {/* Search Bar */}
        <div className="w-full lg:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-warm-dark-muted" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category, notes, tags..."
            className="w-full pl-12 pr-4 py-3 bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-warm-sage text-sm font-medium transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-text dark:text-warm-dark-muted font-bold text-sm flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage hover:from-warm-sage hover:to-warm-dark-sage text-white font-bold text-sm shadow-xl shadow-warm/20 flex items-center space-x-2 transition-all group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Add Transaction</span>
          </button>
        </div>

      </div>

      {/* Filters & Sorting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Filter Type */}
        <div className="bg-white dark:bg-warm-dark-card p-4 rounded-2xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <label className="block text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted mb-1">Transaction Type</label>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-warm-text dark:text-warm-dark-text font-bold text-sm focus:outline-none"
          >
            <option value="All">All Types (Income & Expense)</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>
        </div>

        {/* Filter Category */}
        <div className="bg-white dark:bg-warm-dark-card p-4 rounded-2xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <label className="block text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted mb-1">Filter Category</label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-warm-text dark:text-warm-dark-text font-bold text-sm focus:outline-none"
          >
            <option value="All">All Categories</option>
            <optgroup label="Income Categories">
              {incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Expense Categories">
              {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        </div>

        {/* Filter Account */}
        <div className="bg-white dark:bg-warm-dark-card p-4 rounded-2xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <label className="block text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted mb-1">Filter Account</label>
          <select
            value={filterAccount}
            onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent text-warm-text dark:text-warm-dark-text font-bold text-sm focus:outline-none"
          >
            <option value="All">All Accounts & Wallets</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Sort Order */}
        <div className="bg-white dark:bg-warm-dark-card p-4 rounded-2xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm">
          <label className="block text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted mb-1">Sort Order</label>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full bg-transparent text-warm-text dark:text-warm-dark-text font-bold text-sm focus:outline-none"
          >
            <option value="date_desc">Latest Date First</option>
            <option value="date_asc">Oldest Date First</option>
            <option value="amount_desc">Amount (Highest First)</option>
            <option value="amount_asc">Amount (Lowest First)</option>
          </select>
        </div>

      </div>

      {/* Bulk Actions Banner */}
      {selectedTxIds.length > 0 && (
        <div className="p-4 bg-warm-sage/10 border border-warm-sage/30 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-sm font-bold text-warm-text dark:text-warm-dark-text">
            {selectedTxIds.length} transaction{selectedTxIds.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-warm-terracotta hover:bg-warm-dark-terracotta text-white font-bold text-xs rounded-xl shadow-lg shadow-warm/20 transition-all flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none overflow-hidden">
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-warm-surface dark:border-warm-dark-surface/60 bg-warm-bg/50 dark:bg-warm-dark-bg/40 text-xs font-bold uppercase text-warm-muted dark:text-warm-dark-muted tracking-wider">
                <th className="py-4 pl-6 pr-2 w-12">
                  <button onClick={toggleSelectAll} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text">
                    {selectedTxIds.length === currentTransactions.length && currentTransactions.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-warm-sage" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4">Category / Notes</th>
                <th className="py-4 px-4">Account</th>
                <th className="py-4 px-4">Tags</th>
                <th className="py-4 px-4">Payment Method</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4 text-right">Amount</th>
                <th className="py-4 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 text-sm font-medium text-warm-text dark:text-warm-dark-muted">
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-warm-muted dark:text-warm-dark-muted">
                    <p className="font-bold text-base">No transactions found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or filters above.</p>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((tx) => {
                  const isSelected = selectedTxIds.includes(tx.id);
                  return (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 transition-colors ${isSelected ? 'bg-warm-sage/5 dark:bg-warm-sage/10' : ''}`}
                    >
                      <td className="py-4 pl-6 pr-2">
                        <button onClick={() => toggleSelectTx(tx.id)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-warm-sage" /> : <Square className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm ${
                            tx.type === 'Income' ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage border border-warm-sage/30' : 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta border border-warm-terracotta/30'
                          }`}>
                            {tx.type === 'Income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-warm-text dark:text-warm-dark-text tracking-tight">{tx.category}</p>
                            <p className="text-xs text-warm-muted dark:text-warm-dark-muted max-w-[180px] sm:max-w-xs truncate">{tx.notes || 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-warm-muted dark:text-warm-dark-muted">
                        <span className="px-2.5 py-1 rounded-xl bg-warm-surface dark:bg-warm-dark-surface/80 inline-block border border-warm-surface dark:border-warm-dark-surface">
                          {tx.accountName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tx.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-warm-sage/10 text-warm-sage font-bold border border-warm-sage/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-warm-muted dark:text-warm-dark-muted">
                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-4 h-4 text-warm-dark-muted" />
                          <span>{tx.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-warm-muted dark:text-warm-dark-muted font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-4 h-4 text-warm-dark-muted" />
                          <span>{tx.date}</span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 text-right font-extrabold tracking-tight ${tx.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                        {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currency)}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(tx)}
                            title="Edit Transaction"
                            className="p-2 text-warm-dark-muted hover:text-warm-sage hover:bg-warm-sage/10 rounded-xl transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete this transaction?')) removeTransaction(tx.id); }}
                            title="Delete Transaction"
                            className="p-2 text-warm-dark-muted hover:text-warm-terracotta dark:text-warm-dark-terracotta hover:bg-warm-terracotta/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-warm-surface dark:border-warm-dark-surface/60 flex items-center justify-between bg-warm-bg/50 dark:bg-warm-dark-bg/40 text-xs text-warm-muted dark:text-warm-dark-muted">
          <span>Showing {currentTransactions.length} of {filteredTransactions.length} transactions</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-2 rounded-xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface text-warm-muted dark:text-warm-dark-muted disabled:opacity-50 hover:bg-warm-bg dark:hover:bg-warm-dark-surface transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-warm-text dark:text-warm-dark-text px-2">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-2 rounded-xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface text-warm-muted dark:text-warm-dark-muted disabled:opacity-50 hover:bg-warm-bg dark:hover:bg-warm-dark-surface transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
              <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">
                {modalMode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              
              {/* Transaction Type Selection */}
              <div className="flex bg-warm-surface dark:bg-warm-dark-bg p-1 rounded-2xl border border-warm-surface dark:border-warm-dark-surface">
                <button
                  type="button"
                  onClick={() => { setFormType('Income'); setFormCategory('Salary'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                    formType === 'Income' ? 'bg-warm-sage text-white shadow-lg shadow-warm/20' : 'text-warm-muted hover:text-warm-text dark:hover:text-white'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => { setFormType('Expense'); setFormCategory('Food & Dining'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                    formType === 'Expense' ? 'bg-warm-terracotta text-white shadow-lg shadow-warm/20' : 'text-warm-muted hover:text-warm-text dark:hover:text-white'
                  }`}
                >
                  Expense
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Amount ({getCurrencySymbol(settings.currency)})</label>
                  <input 
                    type="number" step="0.01" required value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00"
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-bold text-base" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Category</label>
                  <select 
                    value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                  >
                    {(formType === 'Income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Target / Source Account</label>
                  <select 
                    value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency)})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Date</label>
                  <input 
                    type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Tags (Comma Separated)</label>
                  <input 
                    type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="monthly, corporate, fixed"
                    className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Notes / Description</label>
                <input 
                  type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Detailed transaction breakdown..."
                  className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none text-sm font-medium" 
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-surface dark:border-warm-dark-surface/60">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors">Cancel</button>
                <button type="submit" className={`px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all ${formType === 'Income' ? 'bg-warm-sage hover:bg-warm-dark-sage shadow-warm/20' : 'bg-warm-terracotta hover:bg-warm-dark-terracotta shadow-warm/20'}`}>
                  {modalMode === 'add' ? 'Save Transaction' : 'Update Transaction'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
