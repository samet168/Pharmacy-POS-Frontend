import { useAuthStore } from '@/lib/stores/authStore';

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions);

  const hasPermission = (permissionCode: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissionCodes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissionCodes.every(code => permissions.includes(code));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}