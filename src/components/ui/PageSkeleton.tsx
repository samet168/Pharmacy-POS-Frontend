'use client';

import React from 'react';

// ─── Shimmer Pulse Base ─────────────────────────────────────────────────────
const Shimmer: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => (
  <div
    className={`animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800 ${className}`}
    style={style}
  />
);

// ─── KPI Cards Row Skeleton ─────────────────────────────────────────────────
export const KpiCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-9 w-9 rounded-xl" />
        </div>
        <Shimmer className="h-8 w-20" />
        <Shimmer className="h-3 w-36" />
      </div>
    ))}
  </div>
);

// ─── Search & Filter Bar Skeleton ───────────────────────────────────────────
export const SearchBarSkeleton: React.FC = () => (
  <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <Shimmer className="h-10 w-full sm:w-80" />
      <div className="flex items-center gap-2">
        <Shimmer className="h-9 w-24 rounded-xl" />
        <Shimmer className="h-9 w-24 rounded-xl" />
        <Shimmer className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  </div>
);

// ─── Table Skeleton (List View) ─────────────────────────────────────────────
export const TableSkeletonRows: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 8,
  cols = 6,
}) => (
  <div className="overflow-hidden bg-surface border border-border rounded-2xl shadow-sm">
    {/* Table Header */}
    <div className="bg-background/80 border-b border-border px-4 py-3.5 flex gap-6">
      <Shimmer className="h-4 w-4 rounded" />
      <Shimmer className="h-4 w-4 rounded" />
      {Array.from({ length: cols }).map((_, i) => (
        <Shimmer key={i} className="h-3.5 flex-1" />
      ))}
    </div>
    {/* Table Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="px-4 py-3.5 border-b border-border flex gap-6 items-center"
      >
        <Shimmer className="h-4 w-4 rounded" />
        <Shimmer className="h-4 w-4 rounded" />
        {Array.from({ length: cols }).map((_, j) => (
          <Shimmer
            key={j}
            className="h-3 flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// ─── Grid Cards Skeleton ────────────────────────────────────────────────────
export const GridCardsSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-4 rounded" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
        <Shimmer className="h-28 w-full rounded-xl" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="pt-2 border-t border-border flex justify-end gap-2">
          <Shimmer className="h-7 w-7 rounded-lg" />
          <Shimmer className="h-7 w-7 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Pagination Skeleton ────────────────────────────────────────────────────
export const PaginationSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl">
    <Shimmer className="h-4 w-40" />
    <div className="flex items-center gap-2">
      <Shimmer className="h-8 w-8 rounded-full" />
      <Shimmer className="h-4 w-24" />
      <Shimmer className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

// ─── Page Header Skeleton ───────────────────────────────────────────────────
export const PageHeaderSkeleton: React.FC = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="space-y-2">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="h-8 w-64" />
      <Shimmer className="h-3.5 w-80" />
    </div>
    <div className="flex items-center gap-3">
      <Shimmer className="h-9 w-28 rounded-xl" />
      <Shimmer className="h-9 w-36 rounded-full" />
    </div>
  </div>
);

// ─── Full Page Skeleton (Complete Standard Layout) ─────────────────────────
export const FullPageSkeleton: React.FC<{
  kpiCount?: number;
  tableRows?: number;
  tableCols?: number;
}> = ({ kpiCount = 3, tableRows = 8, tableCols = 6 }) => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <KpiCardsSkeleton count={kpiCount} />
    <SearchBarSkeleton />
    <TableSkeletonRows rows={tableRows} cols={tableCols} />
    <PaginationSkeleton />
  </div>
);

// ─── Inline Loading Shimmer (for table body placeholder) ──────────────────
export const InlineLoadingSkeleton: React.FC<{ label?: string }> = ({
  label = 'Loading data...',
}) => (
  <div className="p-12 text-center bg-surface border border-border rounded-2xl space-y-4">
    <div className="space-y-3 max-w-md mx-auto">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer
          key={i}
          className="h-4 rounded-xl"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
    <p className="text-sm text-muted font-medium">{label}</p>
  </div>
);

export default FullPageSkeleton;
