import React from 'react';
import { cn } from '../utils/helpers';

export default function Skeleton({ 
  className = '', 
  variant = 'default',
  ...props 
}) {
  const variants = {
    default: 'bg-slate-200 dark:bg-slate-700',
    card: 'bg-slate-100 dark:bg-slate-800 rounded-3xl',
    text: 'bg-slate-200 dark:bg-slate-700 rounded',
    avatar: 'bg-slate-200 dark:bg-slate-700 rounded-full',
    button: 'bg-slate-200 dark:bg-slate-700 rounded-full'
  };

  return (
    <div
      className={cn(
        'animate-pulse',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Predefined skeleton layouts
export function NewsCardSkeleton() {
  return (
    <div className="card-shell p-0 overflow-hidden">
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton variant="avatar" className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    </div>
  );
}
