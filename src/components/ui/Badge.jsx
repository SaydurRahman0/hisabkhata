import React from 'react';

/**
 * Restrained status indicator / micro tag.
 * Strict Anti-Slop adherence:
 * - Avoids bulbous pill capsules (uses clean rounded-md or subtle text indicator)
 * - Always includes explicit readable text label (no hue-only signaling)
 */
export function Badge({
  children,
  variant = 'neutral', // 'neutral' | 'success' | 'warning' | 'info' | 'danger'
  size = 'sm', // 'sm' | 'md'
  className = '',
  icon: Icon
}) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium'
  };

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    info: 'bg-indigo-50 text-indigo-800 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium tracking-normal whitespace-nowrap select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
