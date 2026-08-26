import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Enhanced permission utilities for role-based access control
 * Centralized permission checking with ADMIN bypass support
 */

export const usePermission = (permission: string): boolean => {
  const { permissions, currentUser } = useAuthStore();
  
  // ADMIN role bypasses all permission checks
  if (currentUser?.roleName === 'ADMIN') {
    return true;
  }
  
  return (permissions || []).includes(permission);
};

export const useAnyPermission = (requiredPermissions: string[]): boolean => {
  const { permissions, currentUser } = useAuthStore();
  
  // ADMIN role bypasses all permission checks
  if (currentUser?.roleName === 'ADMIN') {
    return true;
  }
  
  return requiredPermissions.some(perm => (permissions || []).includes(perm));
};

export const useAllPermissions = (requiredPermissions: string[]): boolean => {
  const { permissions, currentUser } = useAuthStore();
  
  // ADMIN role bypasses all permission checks
  if (currentUser?.roleName === 'ADMIN') {
    return true;
  }
  
  return requiredPermissions.every(perm => (permissions || []).includes(perm));
};

export const useIsAdmin = (): boolean => {
  const { currentUser } = useAuthStore();
  return currentUser?.roleName === 'ADMIN';
};

export const useCanAccess = (route: string): boolean => {
  const { permissions, currentUser } = useAuthStore();
  
  // ADMIN can access everything
  if (currentUser?.roleName === 'ADMIN') {
    return true;
  }
  
  // Route-to-permission mapping
  const routePermissions: Record<string, string[]> = {
    '/dashboard': ['DASHBOARD_VIEW'],
    '/products': ['PRODUCT_VIEW'],
    '/categories': ['CATEGORY_VIEW'],
    '/catalog/suppliers': ['SUPPLIER_VIEW'],
    '/inventory': ['INVENTORY_VIEW'],
    '/inventory/transfers': ['INVENTORY_TRANSFER'],
    '/goods-receipts': ['GOODS_RECEIPT_VIEW'],
    '/orders': ['ORDER_VIEW'],
    '/purchase-orders': ['PURCHASE_ORDER_VIEW'],
    '/payments': ['PAYMENT_VIEW'],
    '/customers': ['CUSTOMER_VIEW'],
    '/doctors': ['DOCTOR_VIEW'],
    '/prescriptions': ['PRESCRIPTION_VIEW'],
    '/branches': ['BRANCH_VIEW'],
    '/branch-settings': ['BRANCH_UPDATE'],
    '/users': ['USER_VIEW'],
    '/roles': ['ROLE_VIEW'],
    '/permissions': ['PERMISSION_VIEW'],
    '/shifts': ['SHIFT_VIEW'],
    '/reports': ['REPORT_VIEW'],
    '/system-settings': ['SYSTEM_SETTINGS_VIEW'],
  };
  
  const requiredPermissions = routePermissions[route] || [];
  if (requiredPermissions.length === 0) return true;
  return requiredPermissions.some(perm => (permissions || []).includes(perm));
};