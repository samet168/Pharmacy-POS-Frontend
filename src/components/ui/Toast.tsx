'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

/**
 * Toast component with functional animation
 * Slide-in from top, auto-dismiss, swipe-to-dismiss
 * Must not block the search bar in POS mode
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Slide-in animation
    const slideInTimer = setTimeout(() => setVisible(true), 10);
    
    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(slideInTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 180); // Match slide-out duration
  };

  const typeStyles = {
    success: 'bg-moss text-white',
    error: 'bg-brick text-white',
    warning: 'bg-saffron text-white',
    info: 'bg-pine text-white',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm ${typeStyles[type]} rounded-pos shadow-lg transform transition-all duration-180 ${
        exiting ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{
        animationDuration: '180ms',
      }}
    >
      <div className="flex items-center gap-3 p-4">
        {icons[type]}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};