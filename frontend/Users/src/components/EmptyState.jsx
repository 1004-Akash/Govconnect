import React from 'react';
import { cn } from '../utils/helpers';

export default function EmptyState({ 
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  action,
  icon,
  className = ''
}) {
  return (
    <div className={cn(
      'text-center py-12 px-4',
      className
    )}>
      {icon && (
        <div className="mx-auto w-16 h-16 text-slate-300 dark:text-slate-600 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

// Predefined empty states
export function NewsEmptyState({ onRefresh }) {
  return (
    <EmptyState
      title="No news available"
      description="There are no news articles to display at the moment. Check back later or refresh to see if new content is available."
      icon={
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
        </svg>
      }
      action={
        <button
          onClick={onRefresh}
          className="btn-primary"
        >
          Refresh
        </button>
      }
    />
  );
}

export function ChatEmptyState() {
  return (
    <EmptyState
      title="Start a conversation"
      description="Ask me anything about government policies, schemes, or civic issues. I'm here to help!"
      icon={
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.98-3.917A8.841 8.841 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      }
    />
  );
}
