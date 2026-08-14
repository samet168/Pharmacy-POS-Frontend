'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

interface RequirePermissionProps {
  permission: string;
  permissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  redirectTo = '/403',
  children,
}: RequirePermissionProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  useEffect(() => {
    let hasAccess = false;

    if (permission) {
      hasAccess = hasPermission(permission);
    } else if (permissions) {
      hasAccess = requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }

    if (!hasAccess) {
      router.push(redirectTo);
    }
  }, [permission, permissions, requireAll, redirectTo, hasPermission, hasAnyPermission, hasAllPermissions, router]);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}