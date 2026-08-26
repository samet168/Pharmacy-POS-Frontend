'use client';

import React from 'react';

// ─── Base Skeleton Atom ──────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'lg',
}) => {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 ${roundedMap[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
};

// ─── Legacy LoadingSkeleton (compatibility) ──────────────────────────────────

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
  const variantStyles = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// ─── Card Skeleton ───────────────────────────────────────────────────────────

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton width={80} height={12} rounded="full" />
      <Skeleton width={36} height={36} rounded="xl" />
    </div>
    <Skeleton width={120} height={28} rounded="lg" />
    <Skeleton width={160} height={12} rounded="full" />
  </div>
);

// ─── Table Skeleton ──────────────────────────────────────────────────────────

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="space-y-0 animate-pulse">
    {/* Header */}
    <div className="flex gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width={80 + i * 10} height={12} rounded="full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex gap-4 items-center px-5 py-3.5 border-b border-slate-100 dark:border-slate-800"
        style={{ opacity: 1 - i * 0.08 }}
      >
        <Skeleton width={16} height={16} rounded="md" />
        {Array.from({ length: cols - 1 }).map((_, j) => (
          <Skeleton key={j} width={60 + j * 20} height={12} rounded="full" />
        ))}
      </div>
    ))}
  </div>
);

// ─── KPI Card Skeleton ────────────────────────────────────────────────────────

export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <Skeleton width={100} height={10} rounded="full" />
      <Skeleton width={36} height={36} rounded="xl" />
    </div>
    <Skeleton width={80} height={28} rounded="lg" />
    <Skeleton width={120} height={10} rounded="full" className="mt-2" />
  </div>
);

// ─── Full Page Skeleton ───────────────────────────────────────────────────────

interface PageSkeletonProps {
  /** Number of KPI metric cards at top */
  kpiCards?: number;
  /** Show a search/filter bar skeleton */
  showFilterBar?: boolean;
  /** Number of table rows */
  tableRows?: number;
  /** Number of table columns */
  tableCols?: number;
  /** Show toolbar skeleton (bulk actions etc.) */
  showToolbar?: boolean;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  kpiCards = 3,
  showFilterBar = true,
  tableRows = 7,
  tableCols = 6,
  showToolbar = false,
}) => (
  <div className="space-y-5 animate-pulse">
    {/* 1. Page Header skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton width={60} height={10} rounded="full" className="opacity-50" />
        <Skeleton width={240} height={28} rounded="xl" />
        <Skeleton width={320} height={12} rounded="full" />
      </div>
      <div className="flex gap-2">
        <Skeleton width={110} height={36} rounded="2xl" />
        <Skeleton width={130} height={36} rounded="2xl" />
      </div>
    </div>

    {/* 2. KPI Cards skeleton */}
    {kpiCards > 0 && (
      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(kpiCards, 3)} lg:grid-cols-${kpiCards} gap-4`}>
        {Array.from({ length: kpiCards }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )}

    {/* 3. Optional Toolbar skeleton */}
    {showToolbar && (
      <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700" />
    )}

    {/* 4. Search / Filter bar skeleton */}
    {showFilterBar && (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <Skeleton width="100%" height={38} rounded="xl" className="flex-1" />
          <Skeleton width={90} height={38} rounded="xl" />
          <Skeleton width={90} height={38} rounded="xl" />
          <div className="flex gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Skeleton width={30} height={28} rounded="lg" />
            <Skeleton width={30} height={28} rounded="lg" />
          </div>
        </div>
      </div>
    )}

    {/* 5. Table skeleton */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <TableSkeleton rows={tableRows} cols={tableCols} />
    </div>

    {/* 6. Pagination skeleton */}
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
      <Skeleton width={180} height={14} rounded="full" />
      <div className="flex items-center gap-2">
        <Skeleton width={32} height={32} rounded="full" />
        <Skeleton width={80} height={14} rounded="full" />
        <Skeleton width={32} height={32} rounded="full" />
      </div>
    </div>
  </div>
);

// ─── Grid Card Skeleton ───────────────────────────────────────────────────────

export const GridSkeleton: React.FC<{ cards?: number }> = ({ cards = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: cards }).map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 animate-pulse shadow-sm"
        style={{ opacity: 1 - i * 0.06 }}
      >
        <div className="flex items-center justify-between">
          <Skeleton width={16} height={16} rounded="md" />
          <Skeleton width={56} height={20} rounded="full" />
        </div>
        <Skeleton width="90%" height={14} rounded="full" />
        <Skeleton width="60%" height={12} rounded="full" />
        <Skeleton width="75%" height={10} rounded="full" />
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-1">
          <Skeleton width={28} height={28} rounded="lg" />
          <Skeleton width={28} height={28} rounded="lg" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Form Skeleton ────────────────────────────────────────────────────────────

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="space-y-5 animate-pulse">
    {Array.from({ length: Math.ceil(fields / 2) }).map((_, i) => (
      <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map(j => (
          <div key={j} className="space-y-1.5">
            <Skeleton width={80 + j * 20} height={10} rounded="full" />
            <Skeleton width="100%" height={38} rounded="xl" />
          </div>
        ))}
      </div>
    ))}
    <div className="flex justify-end gap-2 pt-2">
      <Skeleton width={80} height={36} rounded="2xl" />
      <Skeleton width={120} height={36} rounded="2xl" />
    </div>
  </div>
);

// ─── Detail/Profile Skeleton ──────────────────────────────────────────────────

export const DetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
    {/* Header Banner */}
    <div className="rounded-3xl bg-gradient-to-r from-slate-200 dark:from-slate-700 to-slate-300 dark:to-slate-600 p-8 flex gap-6">
      <Skeleton width={80} height={80} rounded="2xl" />
      <div className="space-y-3 flex-1">
        <Skeleton width={220} height={24} rounded="xl" />
        <Skeleton width={160} height={14} rounded="full" />
        <Skeleton width={120} height={12} rounded="full" />
      </div>
    </div>
    {/* Content Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton width={80} height={10} rounded="full" />
          <Skeleton width="100%" height={38} rounded="xl" />
        </div>
      ))}
    </div>
  </div>
);