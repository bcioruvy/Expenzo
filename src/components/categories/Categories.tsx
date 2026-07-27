import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import { Modal } from '../shared/Modal';
import { EmptyState } from '../shared/EmptyState';
import { resolveCategoryIcon, AVAILABLE_ICON_NAMES } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/currency';
import { Plus, ChevronDown, ChevronRight, Archive, ArchiveRestore, Edit3, Tags, Check } from 'lucide-react';

export const Categories: React.FC = () => {
  const { categories, transactions, settings, addCategory, editCategory, archiveCategory, restoreCategory } = useFinance();

  const [activeType, setActiveType] = useState<'Expense' | 'Income'>('Expense');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add-parent' | 'add-sub' | 'edit'>('add-parent');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [subParent, setSubParent] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('HelpCircle');

  // All-time spent/earned total per category name, computed directly from transactions —
  // this is intentionally all-time (not month-scoped) since the Categories page is about
  // understanding a category overall, not a specific month's activity.
  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  }, [transactions]);

  const parentCategories = useMemo(() => {
    return categories
      .filter(c => c.type === activeType && !c.parentId && (showArchived || !c.isArchived))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, activeType, showArchived]);

  const getSubCategories = (parentId: string) => {
    return categories
      .filter(c => c.parentId === parentId && (showArchived || !c.isArchived))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setFormName('');
    setFormIcon('HelpCircle');
  };

  const openAddParentModal = () => {
    resetForm();
    setModalMode('add-parent');
    setEditingCategory(null);
    setSubParent(null);
    setShowModal(true);
  };

  const openAddSubModal = (parent: Category) => {
    resetForm();
    setFormIcon(parent.icon); // sub-categories inherit the parent's icon at creation time
    setModalMode('add-sub');
    setSubParent(parent);
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setModalMode('edit');
    setEditingCategory(cat);
    setSubParent(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) return;

    if (modalMode === 'add-parent') {
      const maxSort = Math.max(-1, ...categories.filter(c => c.type === activeType && !c.parentId).map(c => c.sortOrder));
      await addCategory({
        name: trimmedName, type: activeType, icon: formIcon, isArchived: false, isDefault: false, sortOrder: maxSort + 1,
      });
    } else if (modalMode === 'add-sub' && subParent) {
      const maxSort = Math.max(-1, ...categories.filter(c => c.parentId === subParent.id).map(c => c.sortOrder));
      await addCategory({
        name: trimmedName, type: subParent.type, icon: formIcon, isArchived: false, isDefault: false,
        parentId: subParent.id, sortOrder: maxSort + 1,
      });
      setExpandedIds(prev => new Set(prev).add(subParent.id));
    } else if (modalMode === 'edit' && editingCategory) {
      await editCategory({ ...editingCategory, name: trimmedName, icon: formIcon });
    }
    setShowModal(false);
    resetForm();
  };

  const renderCategoryRow = (cat: Category, isSub: boolean) => {
    const Icon = resolveCategoryIcon(cat.icon);
    const subCats = isSub ? [] : getSubCategories(cat.id);
    const hasSubCats = subCats.length > 0;
    const isExpanded = expandedIds.has(cat.id);
    const total = totalsByCategory[cat.name] || 0;

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            cat.isArchived
              ? 'bg-warm-surface/40 dark:bg-warm-dark-surface/20 border-warm-surface dark:border-warm-dark-surface opacity-60'
              : 'bg-warm-bg dark:bg-warm-dark-bg border-warm-surface dark:border-warm-dark-surface'
          } ${isSub ? 'ml-10 mt-2' : ''}`}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {!isSub && hasSubCats && (
              <button onClick={() => toggleExpanded(cat.id)} className="text-warm-muted dark:text-warm-dark-muted flex-shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!isSub && !hasSubCats && <div className="w-4 flex-shrink-0" />}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeType === 'Income' ? 'bg-warm-sage/15 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/15 text-warm-terracotta dark:text-warm-dark-terracotta'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-warm-text dark:text-warm-dark-text truncate flex items-center gap-2">
                {cat.name}
                {cat.isArchived && <span className="text-[10px] uppercase font-bold tracking-wide text-warm-muted dark:text-warm-dark-muted bg-warm-surface dark:bg-warm-dark-surface px-1.5 py-0.5 rounded">Archived</span>}
              </p>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">
                {formatCurrency(total, settings.currency)} total {activeType === 'Income' ? 'earned' : 'spent'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-3">
            {!isSub && !cat.isArchived && (
              <button onClick={() => openAddSubModal(cat)} title="Add sub-category" className="p-2 rounded-xl hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => openEditModal(cat)} title="Edit" className="p-2 rounded-xl hover:bg-warm-surface dark:hover:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
            {cat.isArchived ? (
              <button onClick={() => restoreCategory(cat.id)} title="Restore" className="p-2 rounded-xl hover:bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage transition-colors">
                <ArchiveRestore className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => archiveCategory(cat.id)} title="Archive" className="p-2 rounded-xl hover:bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta transition-colors">
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {!isSub && hasSubCats && isExpanded && (
          <div className="space-y-0">
            {subCats.map(sub => renderCategoryRow(sub, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-warm-text dark:text-warm-dark-text">Categories</h2>
          <p className="text-sm text-warm-muted dark:text-warm-dark-muted mt-1">Customize the categories you actually use, with their own icons.</p>
        </div>
        <button
          onClick={openAddParentModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="grid grid-cols-2 gap-1 p-1 bg-warm-bg dark:bg-warm-dark-bg rounded-2xl w-full sm:w-64">
            <button
              onClick={() => setActiveType('Expense')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${activeType === 'Expense' ? 'bg-warm-terracotta text-white shadow-md' : 'text-warm-muted dark:text-warm-dark-muted'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setActiveType('Income')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${activeType === 'Income' ? 'bg-warm-sage text-white shadow-md' : 'text-warm-muted dark:text-warm-dark-muted'}`}
            >
              Income
            </button>
          </div>
          <button
            onClick={() => setShowArchived(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              showArchived ? 'bg-warm-surface dark:bg-warm-dark-surface text-warm-text dark:text-warm-dark-text' : 'text-warm-muted dark:text-warm-dark-muted hover:bg-warm-surface dark:hover:bg-warm-dark-surface'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
          </button>
        </div>

        {parentCategories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={`No ${activeType.toLowerCase()} categories yet`}
            message="Add your first category to start organizing transactions the way that actually makes sense for your household."
          />
        ) : (
          <div className="space-y-2">
            {parentCategories.map(cat => renderCategoryRow(cat, false))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} maxWidthClassName="max-w-md">
          <div className="flex items-center justify-between border-b border-warm-surface dark:border-warm-dark-surface/60 pb-4">
            <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text">
              {modalMode === 'add-parent' && 'New Category'}
              {modalMode === 'add-sub' && `New Sub-Category — ${subParent?.name}`}
              {modalMode === 'edit' && 'Edit Category'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-warm-dark-muted hover:text-warm-muted dark:hover:text-warm-dark-text font-bold text-xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-1">Name</label>
              <input
                type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder={modalMode === 'add-sub' ? 'e.g. Cafes' : 'e.g. Pet Care'}
                className="w-full p-3 rounded-2xl bg-warm-bg dark:bg-warm-dark-bg border border-warm-surface dark:border-warm-dark-surface text-warm-text dark:text-warm-dark-text focus:ring-2 focus:ring-warm-sage outline-none font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-warm-muted dark:text-warm-dark-muted uppercase mb-2">
                Icon {modalMode === 'add-sub' && <span className="normal-case font-medium text-warm-muted dark:text-warm-dark-muted">(defaults to parent's icon — change if you like)</span>}
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {AVAILABLE_ICON_NAMES.map(iconName => {
                  const IconComp = resolveCategoryIcon(iconName);
                  const isSelected = formIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-warm-sage text-white shadow-md scale-105'
                          : 'bg-warm-bg dark:bg-warm-dark-bg text-warm-muted dark:text-warm-dark-muted hover:bg-warm-surface dark:hover:bg-warm-dark-surface'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      {isSelected && <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface text-warm-muted dark:text-warm-dark-muted font-bold text-sm transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-warm-sage to-warm-dark-sage text-white font-bold text-sm shadow-lg shadow-warm/20 transition-all">
                {modalMode === 'edit' ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};