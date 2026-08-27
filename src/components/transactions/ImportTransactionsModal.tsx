import React, { useMemo, useState } from 'react';
import { Modal } from '../shared/Modal';
import { Account, Transaction } from '../../types';
import { parseImportBlock, ParsedImportRow } from '../../utils/importParser';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';
import { useFinance } from '../../context/FinanceContext';
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ImportTransactionsModalProps {
  accounts: Account[];
  expenseCategories: string[];
  onClose: () => void;
  onImport: (rows: Array<Omit<Transaction, 'id' | 'userId'>>) => Promise<number>;
}

type SheetTab = 'Groceries' | 'Bills' | 'Fast Food' | 'Other';
const SHEET_TABS: SheetTab[] = ['Groceries', 'Bills', 'Fast Food', 'Other'];

// Best-effort default mapping from your sheet's 4 blocks to Expenzo's built-in expense
// categories, so the imported data lines up with Budgets/Analytics out of the box.
// Adjustable per-tab in the UI below if any of these don't match how you categorize things.
const DEFAULT_CATEGORY_MAP: Record<SheetTab, string> = {
  'Groceries': 'Groceries',
  'Bills': 'Utilities',
  'Fast Food': 'Food & Dining',
  'Other': 'Miscellaneous',
};

export const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({
  accounts, expenseCategories, onClose, onImport
}) => {
  const { settings } = useFinance();
  const [activeTab, setActiveTab] = useState<SheetTab>('Groceries');
  const [textByTab, setTextByTab] = useState<Record<SheetTab, string>>({
    'Groceries': '', 'Bills': '', 'Fast Food': '', 'Other': '',
  });
  const [categoryByTab, setCategoryByTab] = useState<Record<SheetTab, string>>(DEFAULT_CATEGORY_MAP);

  const meezanAccount = accounts.find(a => a.name.toLowerCase().includes('meezan'));
  const [accountId, setAccountId] = useState<string>(meezanAccount?.id || accounts[0]?.id || '');

  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  // Parse every tab's pasted text whenever it changes
  const parsedByTab = useMemo(() => {
    const result: Record<SheetTab, { rows: ParsedImportRow[]; errors: string[] }> = {} as any;
    SHEET_TABS.forEach(tab => {
      result[tab] = parseImportBlock(textByTab[tab]);
    });
    return result;
  }, [textByTab]);

  const totalValidRows = SHEET_TABS.reduce((sum, tab) => sum + parsedByTab[tab].rows.length, 0);
  const totalErrors = SHEET_TABS.reduce((sum, tab) => sum + parsedByTab[tab].errors.length, 0);
  const totalAmount = SHEET_TABS.reduce(
    (sum, tab) => sum + parsedByTab[tab].rows.reduce((s, r) => s + r.amount, 0), 0
  );

  const selectedAccount = accounts.find(a => a.id === accountId);
  const current = parsedByTab[activeTab];

  const handleImport = async () => {
    if (!selectedAccount || totalValidRows === 0) return;
    setImporting(true);
    setResultError(null);
    setResultMessage(null);
    try {
      const allRows: Array<Omit<Transaction, 'id' | 'userId'>> = [];
      SHEET_TABS.forEach(tab => {
        parsedByTab[tab].rows.forEach(row => {
          allRows.push({
            type: 'Expense',
            amount: row.amount,
            category: categoryByTab[tab],
            date: row.date,
            notes: row.name,
            tags: [],
            paymentMethod: 'Bank Transfer',
            accountId: selectedAccount.id,
            accountName: selectedAccount.name,
          });
        });
      });
      const count = await onImport(allRows);
      setResultMessage(`Imported ${count} transaction${count === 1 ? '' : 's'} into ${selectedAccount.name}.`);
      setTextByTab({ 'Groceries': '', 'Bills': '', 'Fast Food': '', 'Other': '' });
    } catch (err: any) {
      setResultError(err?.message || 'Something went wrong during import. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-2xl bg-warm-sage/10">
          <Upload className="w-5 h-5 text-warm-sage dark:text-warm-dark-sage" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text">Import from Google Sheet</h2>
          <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Paste each category's Name / Date / Amount columns below</p>
        </div>
      </div>

      {resultMessage && (
        <div className="p-4 rounded-2xl bg-warm-sage/10 border border-warm-sage/30 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-warm-sage dark:text-warm-dark-sage flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-warm-text dark:text-warm-dark-text">{resultMessage}</p>
        </div>
      )}
      {resultError && (
        <div className="p-4 rounded-2xl bg-warm-terracotta/10 border border-warm-terracotta/30 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-warm-terracotta dark:text-warm-dark-terracotta flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-warm-terracotta dark:text-warm-dark-terracotta">{resultError}</p>
        </div>
      )}

      {/* Destination account */}
      <div>
        <label className="text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase tracking-wide">Import into account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="mt-1.5 w-full px-4 py-3 bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-2xl text-warm-text dark:text-warm-dark-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-warm-sage"
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {SHEET_TABS.map(tab => {
          const parsed = parsedByTab[tab];
          const hasContent = textByTab[tab].trim().length > 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-warm-sage text-white'
                  : 'bg-warm-bg dark:bg-warm-dark-bg text-warm-text dark:text-warm-dark-muted'
              }`}
            >
              {tab}{hasContent ? ` (${parsed.rows.length})` : ''}
            </button>
          );
        })}
      </div>

      {/* Active tab: category mapping + paste area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase tracking-wide">
            Maps to Expenzo category
          </label>
          <select
            value={categoryByTab[activeTab]}
            onChange={(e) => setCategoryByTab(prev => ({ ...prev, [activeTab]: e.target.value }))}
            className="px-3 py-2 bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-xl text-warm-text dark:text-warm-dark-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-warm-sage"
          >
            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <textarea
          value={textByTab[activeTab]}
          onChange={(e) => setTextByTab(prev => ({ ...prev, [activeTab]: e.target.value }))}
          placeholder={`Paste the Name, Date, Amount columns for "${activeTab}" here — copy directly from Google Sheets`}
          rows={8}
          className="w-full px-4 py-3 bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface rounded-2xl text-warm-text dark:text-warm-dark-text placeholder-slate-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-warm-sage"
        />

        {current.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-warm-terracotta/10 border border-warm-terracotta/30">
            <p className="text-xs font-bold text-warm-terracotta dark:text-warm-dark-terracotta mb-1">
              {current.errors.length} line{current.errors.length === 1 ? '' : 's'} couldn't be read in this tab:
            </p>
            <ul className="text-xs text-warm-muted dark:text-warm-dark-muted space-y-0.5 max-h-24 overflow-y-auto">
              {current.errors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {current.rows.length > 0 && (
          <div className="p-3 rounded-xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface">
            <p className="text-xs font-bold text-warm-muted dark:text-warm-dark-muted mb-1.5">Preview (first 3 rows)</p>
            <div className="space-y-1">
              {current.rows.slice(0, 3).map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-warm-text dark:text-warm-dark-text">
                  <span className="truncate flex-1">{row.name}</span>
                  <span className="text-warm-muted dark:text-warm-dark-muted mx-2">{formatDate(row.date, settings.dateFormat)}</span>
                  <span className="font-bold">{formatCurrency(row.amount, selectedAccount?.currency || 'PKR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overall summary + submit */}
      <div className="pt-2 border-t border-warm-surface dark:border-warm-dark-surface/60 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-warm-muted dark:text-warm-dark-muted">
            Total across all tabs: <span className="font-bold text-warm-text dark:text-warm-dark-text">{totalValidRows} transactions</span>
            {totalErrors > 0 && <span className="text-warm-terracotta dark:text-warm-dark-terracotta"> · {totalErrors} skipped</span>}
          </span>
          <span className="font-bold text-warm-text dark:text-warm-dark-text">
            {formatCurrency(totalAmount, selectedAccount?.currency || 'PKR')}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-text dark:text-warm-dark-muted font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || totalValidRows === 0 || !selectedAccount}
            className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage text-white font-bold text-sm shadow-xl shadow-warm/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import {totalValidRows > 0 ? totalValidRows : ''} Transaction{totalValidRows === 1 ? '' : 's'}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
