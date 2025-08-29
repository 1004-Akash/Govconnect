import React from 'react';
import { cn } from '../utils/helpers';

export default function Chip({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-emerald-500/80 text-white border-emerald-600',
    secondary: 'bg-amber-400/80 text-white border-amber-500',
    outline: 'bg-transparent border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300',
    glass: 'bg-white/20 text-white border-white/30 backdrop-blur'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
