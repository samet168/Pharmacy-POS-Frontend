'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-bento-primary text-white hover:bg-opacity-90 focus:ring-bento-primary',
    secondary: 'bg-bento-gray dark:bg-slate-700 text-bento-primary dark:text-slate-100 hover:bg-bento-gray-dark dark:hover:bg-slate-600 focus:ring-bento-gray',
    danger: 'bg-bento-pink-text text-white hover:bg-opacity-90 focus:ring-bento-pink',
    ghost: 'bg-transparent text-bento-primary dark:text-slate-100 hover:bg-bento-gray dark:hover:bg-slate-800 focus:ring-bento-gray',
    outline: 'border-2 border-bento-primary text-bento-primary dark:text-slate-100 hover:bg-bento-primary/10 dark:hover:bg-slate-800 focus:ring-bento-primary',
  };
  
  const shapeStyles = {
    default: 'rounded-lg',
    pill: 'rounded-pill',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-9',
    md: 'px-6 py-3 text-base min-h-11',
    lg: 'px-8 py-4 text-lg min-h-12',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${shapeStyles[shape]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};