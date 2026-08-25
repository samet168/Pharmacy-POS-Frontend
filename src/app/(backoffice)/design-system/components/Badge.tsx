import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const base = 'inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 rounded-full';
  const variants: Record<string, string> = {
    success: 'bg-success text-white',
    warning: 'bg-warning text-white',
    danger: 'bg-danger text-white',
    info: 'bg-info text-white',
    neutral: 'bg-surface text-foreground border border-border',
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  return <span className={cls}>{children}</span>;
};
