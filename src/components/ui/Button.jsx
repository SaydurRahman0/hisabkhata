import React from 'react';

/**
 * Reusable, accessible Button component.
 * Adheres to zero-pill discipline (rounded-lg) and single-line control contract.
 */
export function Button({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  title,
  ariaLabel,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-normal transition-colors duration-150 select-none whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[34px] gap-1.5 rounded-md',
    md: 'text-sm px-3.5 py-2 min-h-[40px] gap-2 rounded-lg',
    lg: 'text-base px-5 py-2.5 min-h-[44px] gap-2.5 rounded-lg'
  };

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
    outline: 'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}
