import React from 'react';
import { cn } from '../utils/helpers';

export default function Card({ 
  children, 
  className = '', 
  padding = 'p-6', 
  hover = true,
  ...props 
}) {
  return (
    <div 
      className={cn(
        'glass-card overflow-hidden',
        padding,
        hover && 'hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
