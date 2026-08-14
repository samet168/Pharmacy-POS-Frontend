'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'lime' | 'mint' | 'pink' | 'lavender';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, actions, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-bento-white dark:bg-bento-card-dark text-bento-primary dark:text-slate-100 border border-bento-gray dark:border-slate-800/80',
    lime: 'bg-bento-lime text-bento-lime-text dark:bg-opacity-20 dark:border dark:border-white/10',
    mint: 'bg-bento-mint text-bento-mint-text dark:bg-opacity-20 dark:border dark:border-white/10',
    pink: 'bg-bento-pink text-bento-pink-text dark:bg-opacity-20 dark:border dark:border-white/10',
    lavender: 'bg-bento-lavender text-bento-lavender-text dark:bg-opacity-20 dark:border dark:border-white/10',
  };

  return (
    <div className={`${variantStyles[variant]} rounded-bento shadow-bento ${className}`}>
      {(title || actions) && (
        <div className="px-8 py-6 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-8">{children}</div>
    </div>
  );
};