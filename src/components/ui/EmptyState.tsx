'use client';

import React from 'react';
import { Plus, Search, Package, FileText, Users, Building2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  variant?: 'default' | 'search' | 'data' | 'team' | 'building';
}

/**
 * EmptyState component for consistent empty state UI
 * Provides visual feedback when no data is available
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
}) => {
  const defaultIcons = {
    default: <Package className="h-12 w-12" />,
    search: <Search className="h-12 w-12" />,
    data: <FileText className="h-12 w-12" />,
    team: <Users className="h-12 w-12" />,
    building: <Building2 className="h-12 w-12" />,
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-slate-300 dark:text-slate-600">
        {displayIcon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          {action.icon && <span className="h-4 w-4">{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
};