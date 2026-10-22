import React from 'react';

/**
 * Reusable Card component for dashboard widgets, summary panels, and lists.
 * Follows single-elevation depth rule with subtle hairline border and zero excessive shadows.
 */
export function Card({
  children,
  className = '',
  padding = 'normal', // 'none' | 'condensed' | 'normal' | 'relaxed'
  header,
  footer,
  ...props
}) {
  const paddingStyles = {
    none: '',
    condensed: 'p-3 sm:p-4',
    normal: 'p-4 sm:p-5',
    relaxed: 'p-6'
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl transition-colors ${className}`}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800/80">
          {header}
        </div>
      )}
      
      <div className={paddingStyles[padding]}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
