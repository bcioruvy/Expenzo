import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Award, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface SmartInsightsProps {
  setActiveTab: (tab: string) => void;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({ setActiveTab }) => {
  const { smartInsights, upcomingBills, financialHealthScore, transactions, settings } = useFinance();

  // Filter recurring transactions
  const recurringTxs = transactions.filter(t => t.isRecurring || ['Rent', 'Internet', 'Subscriptions'].includes(t.category));

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Wealth Optimizer</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Intelligent Financial Insights</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our automated personal wealth engine tracks recurring subscriptions, forecasts bill reminders, and monitors spending anomalies to maximize your net monthly savings.
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-xl flex-shrink-0 w-64">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Health Standing</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-extrabold text-white">{financialHealthScore}</span>
              <span className="text-slate-400 font-medium text-sm">/ 100</span>
            </div>
            <div className="mt-4 w-full flex items-center justify-center space-x-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Excellent Standing</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Spending Insights & Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Automated Spending Insights</h3>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Refreshed Today</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {smartInsights.map(insight => {
            const isAlert = insight.type === 'alert';
            const isRec = insight.type === 'recommendation';
            const isInfo = insight.type === 'info';
            
            return (
              <div 
                key={insight.id} 
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col justify-between group hover:border-sky-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${
                        isAlert ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        isRec ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        isInfo ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                        'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                      }`}>
                        {isAlert ? <AlertTriangle className="w-6 h-6" /> : isRec ? <TrendingUp className="w-6 h-6" /> : isInfo ? <RefreshCw className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-base tracking-tight">{insight.title}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{insight.type}</span>
                      </div>
                    </div>
                    {insight.metric && (
                      <span className={`text-base font-extrabold px-3 py-1.5 rounded-2xl ${
                        isAlert ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                      }`}>
                        {insight.metric}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {insight.actionText && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab(isRec ? 'goals' : isAlert ? 'transactions' : 'budgets')}
                      className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1.5 transition-colors"
                    >
                      <span>{insight.actionText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Auto-Scan</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Subscription Audit & Upcoming Bill Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subscription Tracking & Recurring */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Active Subscriptions & Recurring Bills</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Continuous background cash outflows</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1 overflow-y-auto max-h-96 custom-scrollbar pr-2">
            {recurringTxs.map(tx => (
              <div key={tx.id} className="py-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-2xl px-3 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 flex-shrink-0 shadow-sm">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white tracking-tight">{tx.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs">{tx.notes || 'Monthly recurring charge'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-rose-500">-{formatCurrency(tx.amount, settings.currency)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Auto-pay Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Reminders Module */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Scheduled Bill Reminders</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming calendar financial milestones</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-96 custom-scrollbar pr-2">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between group hover:border-sky-500/40 transition-all">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${bill.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{bill.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Due on {bill.dueDate}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white">{formatCurrency(bill.amount, settings.currency)}</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold inline-block mt-1 ${
                    bill.isPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    {bill.isPaid ? 'Settled' : 'Requires Action'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
