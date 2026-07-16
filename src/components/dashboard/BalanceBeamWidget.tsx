import React from 'react';
import { formatCurrency } from '../../utils/currency';

interface BalanceBeamWidgetProps {
  income: number;
  expenses: number;
  currency: string;
}

/**
 * Live reuse of the Doorway Balance mark — the same house-shaped doorway
 * and tipping fulcrum from the logo, but here it's a functional widget:
 * the beam actually tips toward whichever side (income or expense) is
 * currently heavier, based on real transaction data.
 */
export const BalanceBeamWidget: React.FC<BalanceBeamWidgetProps> = ({ income, expenses, currency }) => {
  const hasData = income > 0 || expenses > 0;

  // Tip angle: capped at +/- 12 degrees so it reads as a gentle lean, not a
  // dramatic swing, even when income and expenses are wildly different.
  const total = income + expenses;
  const diff = total > 0 ? (income - expenses) / total : 0; // -1..1
  const tiltDeg = Math.max(-12, Math.min(12, diff * 14));

  // Pivot point of the beam in the 200x140 viewBox — the top of the fulcrum post.
  const pivotX = 100;
  const pivotY = 70;

  return (
    <div className="p-6 rounded-3xl bg-warm-card dark:bg-warm-dark-card border border-warm-surface dark:border-warm-dark-surface/60 shadow-xl shadow-warm dark:shadow-none flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-warm-text dark:text-warm-dark-text tracking-tight">Household Balance</h3>
      </div>
      <p className="text-xs text-warm-muted dark:text-warm-dark-muted mb-4 self-start">Income vs. expense this month</p>

      <svg width="200" height="140" viewBox="0 0 200 140" fill="none" className="mx-auto">
        {/* Doorway outline */}
        <path
          d="M100 20 L160 55 V115 H40 V55 Z"
          stroke="currentColor"
          className="text-warm-surface dark:text-warm-dark-surface"
          strokeWidth="4"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Fulcrum post */}
        <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY - 20} stroke="#6E8B74" strokeWidth="4" strokeLinecap="round" />

        {/* Tipping beam, rotated around the pivot based on real income vs expense */}
        <g
          style={{
            transform: `rotate(${hasData ? tiltDeg : 0}deg)`,
            transformOrigin: `${pivotX}px ${pivotY}px`,
            transition: 'transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <line x1={pivotX - 40} y1={pivotY} x2={pivotX + 40} y2={pivotY} stroke="#C98B6A" strokeWidth="5" strokeLinecap="round" />
          <circle cx={pivotX - 40} cy={pivotY} r="16" fill="#6E8B74" opacity="0.15" />
          <circle cx={pivotX - 40} cy={pivotY} r="7" fill="#6E8B74" />
          <circle cx={pivotX + 40} cy={pivotY} r="16" fill="#C98B6A" opacity="0.15" />
          <circle cx={pivotX + 40} cy={pivotY} r="7" fill="#C98B6A" />
        </g>
      </svg>

      {hasData ? (
        <div className="flex items-center justify-between w-full mt-2 px-2">
          <span className="text-xs font-bold text-warm-sage dark:text-warm-dark-sage">Income {formatCurrency(income, currency)}</span>
          <span className="text-xs font-bold text-warm-terracotta dark:text-warm-dark-terracotta">Expense {formatCurrency(expenses, currency)}</span>
        </div>
      ) : (
        <p className="text-xs text-warm-muted dark:text-warm-dark-muted mt-2">Add income or an expense to see your balance tip</p>
      )}
    </div>
  );
};
