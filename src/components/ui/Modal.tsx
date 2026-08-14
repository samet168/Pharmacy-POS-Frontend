'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative bg-bento-white dark:bg-bento-card-dark rounded-bento shadow-bento w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-bento-gray dark:border-slate-800">
          <h2 className="text-xl font-semibold text-bento-primary dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bento-gray dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};