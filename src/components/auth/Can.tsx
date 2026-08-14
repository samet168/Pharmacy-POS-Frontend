'use client';

import { usePermission } from '@/hooks/usePermission';
import { ReactNode } from 'react';

interface CanProps {
  permission: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}