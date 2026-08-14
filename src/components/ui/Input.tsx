'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  helperText?: string;
  shape?: 'default' | 'pill';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  showPasswordToggle = false,
  helperText,
  shape = 'default',
  className = '',
  type: inputType = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const type = showPasswordToggle && inputType === 'password' ? (showPassword ? 'text' : 'password') : inputType;

  const shapeStyles = {
    default: 'rounded-lg',
    pill: 'rounded-pill',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary focus:border-transparent transition-colors ${
            icon ? 'pl-12' : ''
          } ${showPasswordToggle ? 'pr-12' : ''} ${error ? 'border-bento-pink-text focus:ring-bento-pink' : ''} ${shapeStyles[shape]} ${className}`}
          type={type}
          {...props}
        />
        {showPasswordToggle && inputType === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-bento-primary dark:hover:text-slate-100 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-bento-pink-text">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
};