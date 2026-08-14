'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WarningBannerProps {
  message: string;
  type?: 'allergy' | 'interaction' | 'warning';
  onDismiss?: () => void;
}

/**
 * WarningBanner with shake animation
 * Slight shake once on appear (not looping/pulsing)
 * 300ms duration - urgency without being obnoxious over a full shift
 */
export const WarningBanner: React.FC<WarningBannerProps> = ({
  message,
  type = 'warning',
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [shaken, setShaken] = useState(false);

  useEffect(() => {
    // Trigger shake on appear
    setVisible(true);
    const shakeTimer = setTimeout(() => setShaken(true), 10);
    const resetTimer = setTimeout(() => setShaken(false), 300); // Reset after shake completes

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(resetTimer);
    };
  }, []);

  const typeStyles = {
    allergy: 'bg-brick text-white',
    interaction: 'bg-brick text-white',
    warning: 'bg-saffron text-white',
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible) return null;

  return (
    <div
      className={`${typeStyles[type]} rounded-pos shadow-lg p-4 mb-4 animate-shake ${
        shaken ? '' : 'animate-shake'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};