import { useAuthStore } from '@/lib/stores/authStore';

export const usePermission = (permission: string): boolean => {
  const permissions = useAuthStore((state) => state.permissions);
  return permissions.includes(permission);
};