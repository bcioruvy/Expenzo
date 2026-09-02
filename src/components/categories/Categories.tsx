import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types';
import { Modal } from '../shared/Modal';
import { EmptyState } from '../shared/EmptyState';
import { resolveCategoryIcon, AVAILABLE_ICON_NAMES } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/currency';
import { isExcludedFromStats } from '../../utils/chartData';
import { formatDate } from '../../utils/dateFormat';
import { Plus, ChevronDown, ChevronRight, GripVertical, Archive, ArchiveRestore, Edit3, Tags, Check, ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  // understanding a category overall, not a specific month's activity. Internal transfers
  // and opening-balance entries are excluded — same rule used everywhere else totals are
  // computed (Dashboard, Reports, Analytics) — so neither a "Transfer" nor an
  // "Opening Balance" category, if either exists, ever shows inflated totals.

  // Keyed by "type::name" rather than just name — an Income category and an Expense
  // category can validly share the same name (e.g. a family member's name used on both
  // sides, for money sent to them and money received from them), and without the type in
  // the key their totals would silently merge into one number shown on both cards.
  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.filter(t => !isExcludedFromStats(t)).forEach(t => {
      const key = `${t.type}::${t.category}`;
      totals[key] = (totals[key] || 0) + t.amount;
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

  // --- Drag-to-reorder ---
  // Built on the Pointer Events API rather than native HTML5 drag-and-drop, which has
  // unreliable touch support in mobile Safari — this works consistently on iPad.
  //
  // The sibling group is LOCKED during a drag: a row can only be dropped among rows that
  // share the same parentId (subcategories only reorder within their own parent; top-level
  // categories only reorder among other top-level categories), so there is no way to
  // accidentally re-parent a subcategory or nest a top-level category by dragging.
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setRowRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  const [draggedCat, setDraggedCat] = useState<Category | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('below');
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const handleDragPointerDown = (e: React.PointerEvent, cat: Category) => {
    if (cat.isArchived) return;
    e.preventDefault();
    setDraggedCat(cat);
  };

  // Window-level listeners (rather than relying on setPointerCapture) so the drag keeps
  // tracking correctly even as the finger moves across the whole screen — this is the
  // more reliable pattern across Safari/iPadOS versions.
  useEffect(() => {
    if (!draggedCat) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      let closestId: string | null = null;
      let closestPosition: 'above' | 'below' = 'below';
      let closestDist = Infinity;

      rowRefs.current.forEach((el, id) => {
        if (id === draggedCat.id) return;
        const sibling = categories.find(c => c.id === id);
        // Lock to the same sibling group: same parent (undefined === undefined for
        // top-level) and same Income/Expense type.
        if (!sibling || sibling.parentId !== draggedCat.parentId || sibling.type !== draggedCat.type) return;

        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(e.clientY - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
          closestPosition = e.clientY < midY ? 'above' : 'below';
        }
      });

      setDragOverId(closestId);
      setDragOverPosition(closestPosition);
    };

    const handleUp = () => {
      if (dragOverId && dragOverId !== draggedCat.id) {
        const siblings = draggedCat.parentId ? getSubCategories(draggedCat.parentId) : parentCategories;
        const withoutDragged = siblings.filter(c => c.id !== draggedCat.id);
        const targetIdx = withoutDragged.findIndex(c => c.id === dragOverId);
        const insertIdx = dragOverPosition === 'above' ? targetIdx : targetIdx + 1;

        const reordered = [...withoutDragged];
        reordered.splice(insertIdx, 0, draggedCat);

        // Persist sequential sortOrder for the whole sibling group — only the rows whose
        // position actually changed get written, to avoid needless network calls.
        reordered.forEach((c, idx) => {
          if (c.sortOrder !== idx) {
            editCategory({ ...c, sortOrder: idx });
          }
        });
      }
      setDraggedCat(null);
      setDragOverId(null);
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedCat, dragOverId, dragOverPosition]);

  const renderCategoryRow = (cat: Category, isSub: boolean) => {
    const Icon = resolveCategoryIcon(cat.icon);
    const subCats = isSub ? [] : getSubCategories(cat.id);
    const hasSubCats = subCats.length > 0;
    const isExpanded = expandedIds.has(cat.id);
    // A parent category's total is its own direct spend PLUS everything recorded under
    // its subcategories — a transaction's `category` field is set to whichever specific
    // category (parent or sub) was picked, never both, so without this the parent row
    // would only ever show spend from transactions filed directly against it.
    const ownTotal = totalsByCategory[`${cat.type}::${cat.name}`] || 0;
    const total = hasSubCats
      ? ownTotal + subCats.reduce((sum, sub) => sum + (totalsByCategory[`${sub.type}::${sub.name}`] || 0), 0)
      : ownTotal;

    const isDragged = draggedCat?.id === cat.id;
    const isDragOverTarget = dragOverId === cat.id;

    return (
      <div key={cat.id}>
        <div
          ref={setRowRef(cat.id)}
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 rounded-2xl border transition-all ${
            cat.isArchived
              ? 'bg-warm-surface/40 dark:bg-warm-dark-surface/20 border-warm-surface dark:border-warm-dark-surface opacity-60'
              : 'bg-warm-bg dark:bg-warm-dark-bg border-warm-surface dark:border-warm-dark-surface'
          } ${isSub ? 'ml-4 sm:ml-10 mt-2' : ''} ${isDragged ? 'opacity-40 shadow-lg scale-[0.98]' : ''} ${
            isDragOverTarget && !isDragged
              ? dragOverPosition === 'above'
                ? 'border-t-2 border-t-warm-sage'
                : 'border-b-2 border-b-warm-sage'
              : ''
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0 w-full sm:flex-1">
            {!isSub && hasSubCats && (
              <button onClick={() => toggleExpanded(cat.id)} className="text-warm-muted dark:text-warm-dark-muted flex-shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!isSub && !hasSubCats && <div className="w-4 flex-shrink-0" />}
            <button
              onClick={() => setDetailCategory(cat)}
              title="View transactions in this category"
              className="flex items-center space-x-3 min-w-0 flex-1 text-left"
            >
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
            </button>
          </div>
          <div className="flex items-center space-x-1.5 flex-shrink-0 w-full sm:w-auto justify-end sm:ml-3">
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
            {!cat.isArchived && (
              <button
                onPointerDown={(e) => handleDragPointerDown(e, cat)}
                title="Drag to reorder"
                className="p-2 -mr-1 rounded-xl text-warm-muted dark:text-warm-dark-muted touch-none cursor-grab active:cursor-grabbing hover:bg-warm-surface dark:hover:bg-warm-dark-surface transition-colors"
              >
                <GripVertical className="w-4 h-4" />
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

  // Drill-down view for a single category, opened by tapping its name/icon in the list.
  // Shows every transaction filed under it — and, if it's a parent, everything filed
  // under its subcategories too, matching the same rollup used for the card's total —
  // with a running total, replacing the category list in place (no new tab/page, just a
  // swapped view within this same screen, with a Back button to return).
  if (detailCategory) {
    const subCats = detailCategory.parentId ? [] : getSubCategories(detailCategory.id);
    const relevantNames = new Set([detailCategory.name, ...subCats.map(s => s.name)]);
    const detailTransactions = transactions
      .filter(t => t.type === detailCategory.type && relevantNames.has(t.category))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const detailTotal = detailTransactions.reduce((sum, t) => sum + t.amount, 0);
    const DetailIcon = resolveCategoryIcon(detailCategory.icon);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setDetailCategory(null)}
          className="flex items-center gap-2 text-sm font-bold text-warm-muted dark:text-warm-dark-muted hover:text-warm-text dark:hover:text-warm-dark-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>

        <div className="bg-white dark:bg-warm-dark-card p-5 rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              detailCategory.type === 'Income' ? 'bg-warm-sage/15 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/15 text-warm-terracotta dark:text-warm-dark-terracotta'
            }`}>
              <DetailIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-warm-text dark:text-warm-dark-text truncate">{detailCategory.name}</h2>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted truncate">
                {detailTransactions.length} transaction{detailTransactions.length === 1 ? '' : 's'}
                {subCats.length > 0 && ` · includes ${subCats.length} sub-categor${subCats.length === 1 ? 'y' : 'ies'}`}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-extrabold tracking-tight ${detailCategory.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
              {formatCurrency(detailTotal, settings.currency)}
            </p>
            <p className="text-xs text-warm-muted dark:text-warm-dark-muted">total {detailCategory.type === 'Income' ? 'earned' : 'spent'}</p>
          </div>
        </div>

        {detailTransactions.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No transactions yet"
            message={`Transactions filed under "${detailCategory.name}" will show up here.`}
          />
        ) : (
          <div className="bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface/60 shadow-sm divide-y divide-warm-surface dark:divide-warm-dark-surface/60">
            {detailTransactions.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.type === 'Income' ? 'bg-warm-sage/15 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-terracotta/15 text-warm-terracotta dark:text-warm-dark-terracotta'
                  }`}>
                    {t.type === 'Income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-warm-text dark:text-warm-dark-text truncate">{t.notes || t.category}</p>
                    <p className="text-xs text-warm-muted dark:text-warm-dark-muted truncate">
                      {formatDate(t.date, settings.dateFormat)} · {t.accountName}
                      {subCats.length > 0 && t.category !== detailCategory.name && ` · ${t.category}`}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm flex-shrink-0 ${t.type === 'Income' ? 'text-warm-sage dark:text-warm-dark-sage' : 'text-warm-terracotta dark:text-warm-dark-terracotta'}`}>
                  {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
