'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md' }) => {
  const variantStyles = {
    success: 'bg-bento-lime text-bento-lime-text',
    warning: 'bg-bento-mint text-bento-mint-text',
    danger: 'bg-bento-pink text-bento-pink-text',
    info: 'bg-bento-lavender text-bento-lavender-text',
    neutral: 'bg-bento-gray text-bento-primary',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-pill font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};