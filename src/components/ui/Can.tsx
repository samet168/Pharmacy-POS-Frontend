'use client';

import { usePermission } from '@/lib/hooks/usePermission';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};