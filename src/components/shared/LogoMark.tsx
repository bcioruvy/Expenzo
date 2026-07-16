import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
  variant?: 'filled' | 'outline';
}

/**
 * The Expenzo signature mark — "The Doorway Balance": a house-shaped doorway
 * with a tipping fulcrum/scale inside it, representing household income
 * weighed against expense. Used as the logo, favicon, PWA icon, and reused
 * as a live animated widget on the Dashboard (see BalanceBeamWidget).
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ size = 40, className = '', variant = 'filled' }) => {
  if (variant === 'filled') {
    return (
      <div
        className={`rounded-xl bg-gradient-to-tr from-warm-sage to-warm-dark-sage flex items-center justify-center shadow-md shadow-warm/20 flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100" fill="none">
          <path d="M50 20 L80 42 V80 H20 V42 Z" stroke="#FFFDFC" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" fill="none" />
          <line x1="50" y1="58" x2="50" y2="47" stroke="#FFFDFC" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="28" y1="58" x2="72" y2="58" stroke="#F4E9DD" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="28" cy="58" r="6" fill="#C7A86B" />
          <circle cx="72" cy="58" r="6" fill="#C7A86B" />
        </svg>
      </div>
    );
  }

  // Outline variant — for use on light/dark surfaces without a solid badge background
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M50 10 L88 40 V88 H12 V40 Z" stroke="#6E8B74" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <line x1="50" y1="58" x2="50" y2="46" stroke="#6E8B74" strokeWidth="5" strokeLinecap="round" />
      <line x1="24" y1="58" x2="76" y2="58" stroke="#C98B6A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="24" cy="58" r="6" fill="#C7A86B" />
      <circle cx="76" cy="58" r="6" fill="#C7A86B" />
    </svg>
  );
};
