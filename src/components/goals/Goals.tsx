import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { 
  Target, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Calendar, 
  Award, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

export const Goals: React.FC = () => {
  const { goals, addGoal, editGoal, removeGoal, settings } = useFinance();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [gName, setGName] = useState('');
  const [gTarget, setGTarget] = useState('');
  const [gCurrent, setGCurrent] = useState('');
  const [gDeadline, setGDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [gCategory, setGCategory] = useState('Savings');
  const [gNotes, setGNotes] = useState('');
  const [gColor, setGColor] = useState('#10b981');

  const openAddModal = () => {
    setModalMode('add');
    setGName('');
    setGTarget('');
    setGCurrent('0');
    setGDeadline(new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setGCategory('Savings');
    setGNotes('');
    setGColor('#10b981');
    setShowModal(true);
  };

  const openEditModal = (g: Goal) => {
    setModalMode('edit');
    setEditingGoal(g);
    setGName(g.name);
    setGTarget(g.targetAmount.toString());
    setGCurrent(g.currentAmount.toString());
    setGDeadline(g.deadline);
    setGCategory(g.category);
    setGNotes(g.notes || '');
    setGColor(g.color || '#10b981');
    setShowModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      await addGoal({
        name: gName,
        targetAmount: parseFloat(gTarget),
        currentAmount: parseFloat(gCurrent) || 0,
        deadline: gDeadline,
        category: gCategory,
        notes: gNotes,
        color: gColor
      });
    } else if (editingGoal) {
      await editGoal({
        ...editingGoal,
        name: gName,
        targetAmount: parseFloat(gTarget),
        currentAmount: parseFloat(gCurrent) || 0,
        deadline: gDeadline,
        category: gCategory,
        notes: gNotes,
        color: gColor
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Milestone Savings Goals</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Allocate monthly surplus towards big-ticket acquisitions, travel, and emergency financial safety buffers.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center space-x-2 transition-all group"
        >
          <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(gl => {
          const progressPercent = Math.min(100, Math.round((gl.currentAmount / gl.targetAmount) * 100));
          const remainingAmount = gl.targetAmount - gl.currentAmount;

          // Estimated Completion Date calculation
          // Estimate based on a standard savings rate of $400/month if no historical
          const monthsRemaining = remainingAmount > 0 ? Math.ceil(remainingAmount / 450) : 0;
          const estimatedDate = new Date();
          estimatedDate.setMonth(estimatedDate.getMonth() + monthsRemaining);
          const estDateString = estimatedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          return (
            <div 
              key={gl.id} 
              className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-sky-500/50 transition-all relative overflow-hidden"
            >
              {/* Accent header bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: gl.color || '#10b981' }}></div>

              <div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-white group-hover:scale-110 transition-transform shadow-sm">
                      <Target className="w-6 h-6" style={{ color: gl.color || '#10b981' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base tracking-tight">{gl.name}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{gl.category}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-1">{gl.notes || 'No custom notes assigned.'}</p>

                {/* Amount Progress */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{formatCurrency(gl.currentAmount, settings.currency)}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Target: {formatCurrency(gl.targetAmount, settings.currency)}</span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, backgroundColor: gl.color || '#10b981' }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold pt-1">
                    <span className="text-slate-500 dark:text-slate-400">{progressPercent}% Achieved</span>
                    <span className="text-emerald-500 font-bold">{formatCurrency(remainingAmount, settings.currency)} Left</span>
                  </div>
                </div>

                {/* Deadline & Estimations */}
                <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      <span>Target Deadline:</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{gl.deadline}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span>Est. Completion:</span>
                    </div>
                    <span className="font-bold text-emerald-500">{estDateString}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Contribution</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditModal(gl)} 
                    title="Edit Goal"
                    className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete this savings goal?')) removeGoal(gl.id); }} 
                    title="Delete Goal"
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

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {modalMode === 'add' ? 'Create Savings Goal' : 'Edit Savings Goal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Goal Name</label>
                <input 
                  type="text" required value={gName} onChange={(e) => setGName(e.target.value)} placeholder="New iPhone Pro / Emergency Fund"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-bold" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Category</label>
                <select 
                  value={gCategory} onChange={(e) => setGCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-medium text-sm"
                >
                  <option value="Savings">Savings</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Tech">Tech</option>
                  <option value="Travel">Travel</option>
                  <option value="Education">Education</option>
                  <option value="Investments">Investments</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Target Amount ({getCurrencySymbol(settings.currency)})</label>
                  <input 
                    type="number" step="0.01" required value={gTarget} onChange={(e) => setGTarget(e.target.value)} placeholder="5000.00"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-base" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Current Saved ({getCurrencySymbol(settings.currency)})</label>
                  <input 
                    type="number" step="0.01" required value={gCurrent} onChange={(e) => setGCurrent(e.target.value)} placeholder="1200.00"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-base" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Deadline Date</label>
                  <input 
                    type="date" required value={gDeadline} onChange={(e) => setGDeadline(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Accent Color</label>
                  <input 
                    type="color" value={gColor} onChange={(e) => setGColor(e.target.value)}
                    className="w-full h-12 p-1 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Notes / Action Plan</label>
                <input 
                  type="text" value={gNotes} onChange={(e) => setGNotes(e.target.value)} placeholder="Auto-transfer $150 every paycheck"
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" 
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 transition-all">
                  {modalMode === 'add' ? 'Save Goal' : 'Update Goal'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
