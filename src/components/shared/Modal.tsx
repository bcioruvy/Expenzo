import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string; // e.g. 'max-w-lg', defaults to max-w-lg
}

/**
 * Renders its children as a centered, fullscreen fixed-position overlay via a React portal
 * directly to document.body. This is required because the app's main content area
 * (Layout.tsx <main>) is a scrollable container (overflow-y-auto); a `position: fixed`
 * element nested inside it does not reliably stay pinned to the true viewport on all
 * browsers (notably iPadOS Safari), causing modals to appear docked/clipped at the bottom
 * of the scroll container instead of centered over the whole screen. Portaling to
 * document.body sidesteps that entirely.
 */
export const Modal: React.FC<ModalProps> = ({ onClose, children, maxWidthClassName = 'max-w-lg' }) => {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-warm-dark-card rounded-3xl border border-warm-surface dark:border-warm-dark-surface ${maxWidthClassName} w-full max-h-[92vh] overflow-y-auto custom-scrollbar p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
