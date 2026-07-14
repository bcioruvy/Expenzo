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
      <div className="p-8 rounded-3xl bg-gradient-to-r from-warm-dark-bg via-warm-dark-card to-warm-dark-bg text-white border border-warm-dark-surface/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-warm-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-warm-sage/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-warm-gold/20 border border-warm-gold/30 text-warm-dark-gold text-xs font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Wealth Optimizer</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Intelligent Financial Insights</h2>
            <p className="text-warm-dark-muted text-sm leading-relaxed">
              Our automated personal wealth engine tracks recurring subscriptions, forecasts bill reminders, and monitors spending anomalies to maximize your net monthly savings.
            </p>
          </div>
          
          <div className="flex flex-col items-center p-6 bg-warm-dark-card/80 backdrop-blur-xl rounded-3xl border border-warm-dark-surface/60 shadow-xl flex-shrink-0 w-64">
            <span className="text-xs font-bold uppercase tracking-wider text-warm-dark-muted mb-2">Health Standing</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-extrabold text-white">{financialHealthScore}</span>
              <span className="text-warm-dark-muted font-medium text-sm">/ 100</span>
            </div>
            <div className="mt-4 w-full flex items-center justify-center space-x-1 text-xs text-warm-dark-sage font-bold bg-warm-sage/10 py-1.5 px-3 rounded-xl border border-warm-sage/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Excellent Standing</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Spending Insights & Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Automated Spending Insights</h3>
          <span className="text-xs font-bold text-warm-muted dark:text-warm-dark-muted">Refreshed Today</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {smartInsights.map(insight => {
            const isAlert = insight.type === 'alert';
            const isRec = insight.type === 'recommendation';
            const isInfo = insight.type === 'info';
            
            return (
              <div 
                key={insight.id} 
                className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col justify-between group hover:border-warm-sage/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${
                        isAlert ? 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta border border-warm-terracotta/20' :
                        isRec ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage border border-warm-sage/20' :
                        isInfo ? 'bg-warm-gold/10 text-warm-gold border border-warm-gold/20' :
                        'bg-warm-sage/10 text-warm-sage border border-warm-sage/20'
                      }`}>
                        {isAlert ? <AlertTriangle className="w-6 h-6" /> : isRec ? <TrendingUp className="w-6 h-6" /> : isInfo ? <RefreshCw className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-warm-text dark:text-warm-dark-text text-base tracking-tight">{insight.title}</h4>
                        <span className="text-xs text-warm-muted dark:text-warm-dark-muted font-medium capitalize">{insight.type}</span>
                      </div>
                    </div>
                    {insight.metric && (
                      <span className={`text-base font-extrabold px-3 py-1.5 rounded-2xl ${
                        isAlert ? 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta' : 'bg-warm-surface dark:bg-warm-dark-surface text-warm-text dark:text-warm-dark-text'
                      }`}>
                        {insight.metric}
                      </span>
                    )}
                  </div>

                  <p className="text-warm-muted dark:text-warm-dark-muted text-sm mt-4 leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {insight.actionText && (
                  <div className="mt-6 pt-4 border-t border-warm-surface dark:border-warm-dark-surface/60 flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab(isRec ? 'goals' : isAlert ? 'transactions' : 'budgets')}
                      className="text-xs font-bold text-warm-sage hover:text-warm-sage dark:hover:text-warm-dark-sage flex items-center space-x-1.5 transition-colors"
                    >
                      <span>{insight.actionText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-warm-dark-muted uppercase font-bold tracking-wider">Auto-Scan</span>
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
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Active Subscriptions & Recurring Bills</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Continuous background cash outflows</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-warm-sage/10 text-warm-sage">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
          </div>

          <div className="divide-y divide-warm-surface dark:divide-warm-dark-surface/50 flex-1 overflow-y-auto max-h-96 custom-scrollbar pr-2">
            {recurringTxs.map(tx => (
              <div key={tx.id} className="py-4 flex items-center justify-between group hover:bg-warm-bg dark:hover:bg-warm-dark-surface/30 rounded-2xl px-3 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-warm-surface dark:bg-warm-dark-surface flex items-center justify-center font-bold text-warm-text dark:text-warm-dark-muted flex-shrink-0 shadow-sm">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-warm-text dark:text-warm-dark-text tracking-tight">{tx.category}</p>
                    <p className="text-xs text-warm-muted dark:text-warm-dark-muted truncate max-w-[180px] sm:max-w-xs">{tx.notes || 'Monthly recurring charge'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-warm-terracotta dark:text-warm-dark-terracotta">-{formatCurrency(tx.amount, settings.currency)}</p>
                  <p className="text-[10px] text-warm-muted dark:text-warm-dark-muted font-medium mt-0.5">Auto-pay Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Reminders Module */}
        <div className="p-6 rounded-3xl bg-white dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Scheduled Bill Reminders</h3>
              <p className="text-xs text-warm-muted dark:text-warm-dark-muted">Upcoming calendar financial milestones</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-warm-gold/10 text-warm-gold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-96 custom-scrollbar pr-2">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="p-4 rounded-2xl bg-warm-bg dark:bg-warm-dark-surface/40 border border-warm-surface dark:border-warm-dark-surface/60 flex items-center justify-between group hover:border-warm-sage/40 transition-all">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-3 rounded-2xl flex-shrink-0 shadow-sm ${bill.isPaid ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage' : 'bg-warm-gold/10 text-warm-gold dark:text-warm-dark-gold'}`}>
                    {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-warm-text dark:text-warm-dark-text text-sm tracking-tight">{bill.title}</p>
                    <p className="text-xs text-warm-muted dark:text-warm-dark-muted font-medium mt-0.5">Due on {bill.dueDate}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-warm-text dark:text-warm-dark-text">{formatCurrency(bill.amount, settings.currency)}</p>
                  <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold inline-block mt-1 ${
                    bill.isPaid ? 'bg-warm-sage/10 text-warm-sage dark:text-warm-dark-sage border border-warm-sage/20' : 'bg-warm-terracotta/10 text-warm-terracotta dark:text-warm-dark-terracotta border border-warm-terracotta/20'
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
