'use client';

import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  className = '',
}) => {
  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  const variantStyles = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-bento-white dark:bg-bento-card-dark rounded-bento shadow-bento p-8">
    <div className="flex items-center justify-between mb-4">
      <LoadingSkeleton variant="text" width={100} height={20} />
      <LoadingSkeleton variant="circular" width={20} height={20} />
    </div>
    <LoadingSkeleton variant="text" width={150} height={32} />
    <LoadingSkeleton variant="text" width={200} height={16} className="mt-2" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4">
    <div className="flex gap-4 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingSkeleton key={i} variant="text" width={100} height={20} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border-b border-bento-gray dark:border-slate-700">
        {Array.from({ length: 4 }).map((_, j) => (
          <LoadingSkeleton key={j} variant="text" width={120} height={16} />
        ))}
      </div>
    ))}
  </div>
);