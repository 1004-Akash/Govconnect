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
        'card-shell',
        padding,
        hover && 'hover:shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
