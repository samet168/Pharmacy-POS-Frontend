'use client';

import React from 'react';

interface PerforatedDividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  animated?: boolean;
}

/**
 * PerforatedDivider - Signature component for Pharmacy POS
 * 
 * Blister-pack perforation motif - row of small dots with 4px spacing.
 * Used in 3 specific places only:
 * 1. Between cart line items on receipt print
 * 2. As a loading-skeleton pattern (dots pulse)
 * 3. As visual divider between "current stock" and "incoming batch" on Inventory screen
 * 
 * DO NOT use this everywhere - this is a signature element, used sparingly.
 */
export const PerforatedDivider: React.FC<PerforatedDividerProps> = ({
  orientation = 'horizontal',
  className = '',
  animated = false,
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  // Create 12 dots for the divider
  const dots = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div 
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1 items-center justify-center ${className}`}
      style={{
        gap: '4px',
      }}
    >
      {dots.map((i) => (
        <div
          key={i}
          className={`rounded-full bg-pine ${animated ? 'animate-pulse' : ''}`}
          style={{
            width: '4px',
            height: '4px',
            ...(animated && {
              animationDelay: `${i * 100}ms`,
              animationDuration: '1.5s',
            }),
          }}
        />
      ))}
    </div>
  );
};