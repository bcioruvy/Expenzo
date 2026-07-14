import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className={`${compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'} rounded-2xl bg-warm-surface dark:bg-warm-dark-surface flex items-center justify-center`}>
        <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-warm-muted dark:text-warm-dark-muted`} />
      </div>
      <h4 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-warm-text dark:text-warm-dark-text mb-1`}>{title}</h4>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-warm-muted dark:text-warm-dark-muted max-w-xs`}>{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-warm-sage hover:bg-warm-dark-sage text-white text-sm font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
