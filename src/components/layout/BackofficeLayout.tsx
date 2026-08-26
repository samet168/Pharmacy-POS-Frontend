'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { rolesApi } from '@/lib/api/roles';
import { useTranslation } from '@/hooks/useTranslation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  Warehouse,
  Users,
  Building2,
  Settings,
  ShoppingCart,
  FileText,
  BarChart3,
  AlertTriangle,
  Building,
  ChevronDown,
  ChevronRight,
  LogOut,
  DollarSign,
  CreditCard,
  Phone,
  User,
  ShieldCheck,
  Clock,
  Bell,
  Crown,
  RotateCcw,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import Navbar from './Navbar';

interface SubNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: 'lowStock' | 'expiring' | 'notifications';
  superAdminOnly?: boolean;
}

interface NavGroupItem {
  id: string;
  title: string;
  icon: LucideIcon;
  permission?: string;
  path?: string; // If single direct link
  items?: SubNavItem[]; // If collapsible dropdown
  superAdminOnly?: boolean;
  badge?: 'lowStock' | 'expiring' | 'notifications';
}

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, currentUser, initialize, permissions } = useAuthStore();
  const { t, language } = useTranslation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    sales: true,
    inventory: true,
  });

  const [badgeCounts, setBadgeCounts] = useState({
    lowStock: 0,
    expiring: 0,
    notifications: 0,
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarOpen(event.detail.open);
    };
    window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Fetch real-time assigned permissions for the current user's role
  useEffect(() => {
    const syncRolePermissions = async () => {
      const roleId = currentUser?.roleId || user?.roleId;
      if (roleId) {
        try {
          const res = await rolesApi.getPermissions(roleId);
          const permsList = Array.isArray(res) ? res : (res as any)?.content || [];
          const permCodes = permsList.map((p: any) => p.code || p.name).filter(Boolean);
          if (permCodes.length > 0) {
            useAuthStore.getState().setPermissions(permCodes);
            localStorage.setItem('permissions', JSON.stringify(permCodes));
          }
        } catch (err) {
          console.warn('Could not sync live role permissions:', err);
        }
      }
    };

    if (isAuthenticated) {
      syncRolePermissions();
    }
  }, [isAuthenticated, user?.roleId, currentUser?.roleId]);

  // Fetch badge counts from dashboard
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const overview = await dashboardApi.getOverview();
        setBadgeCounts({
          lowStock: overview.lowStockProducts || 0,
          expiring: 0,
          notifications: 0,
        });
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    if (isAuthenticated) {
      fetchBadgeCounts();
      const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('permissions');
    localStorage.removeItem('organizationId');
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    router.push('/login');
  };

  // Translation key mapping for sidebar items
  const getSidebarLabel = (label: string): string => {
    const labelMap: Record<string, string> = {
      'Dashboard': 'nav.sidebar.dashboard',
      'Orders': 'nav.sidebar.orders',
      'Payments': 'nav.sidebar.payments',
      'Returns': 'nav.sidebar.returns',
      'Products': 'nav.sidebar.products',
      'Purchase Orders': 'nav.sidebar.purchaseOrders',
      'Goods Receipts': 'nav.sidebar.goodsReceipts',
      'Stock': 'nav.sidebar.stock',
      'Low Stock': 'nav.sidebar.lowStock',
      'Expiring Soon': 'nav.sidebar.expiringSoon',
      'Expired': 'nav.sidebar.expired',
      'Categories': 'nav.sidebar.categories',
      'Suppliers': 'nav.sidebar.suppliers',
      'Active Ingredients': 'nav.sidebar.activeIngredients',
      'Customers': 'nav.sidebar.customers',
      'Customer Allergies': 'nav.sidebar.customerAllergies',
      'Doctors': 'nav.sidebar.doctors',
      'Prescriptions': 'nav.sidebar.prescriptions',
      'Organizations': 'nav.sidebar.organizations',
      'Branches': 'nav.sidebar.branches',
      'Branch Settings': 'nav.sidebar.branchSettings',
      'Users': 'nav.sidebar.users',
      'Roles': 'nav.sidebar.roles',
      'My Subscription': 'nav.sidebar.mySubscription',
      'Subscribers Governance': 'nav.sidebar.subscribersGovernance',
      'Subscription Plans': 'nav.sidebar.subscriptionPlans',
      'Devices': 'nav.sidebar.devices',
      'POS Terminals': 'nav.sidebar.posTerminals',
      'Current Shift': 'nav.sidebar.currentShift',
      'Open Shift': 'nav.sidebar.openShift',
      'Shift History': 'nav.sidebar.shiftHistory',
      'Sales Reports': 'nav.sidebar.salesReports',
      'Product Reports': 'nav.sidebar.productReports',
      'Customer Reports': 'nav.sidebar.customerReports',
      'Purchase Reports': 'nav.sidebar.purchaseReports',
      'Inventory Reports': 'nav.sidebar.inventoryReports',
      'Notifications': 'nav.sidebar.notifications',
      'Announcements': 'nav.sidebar.announcements',
      'Audit Logs': 'nav.sidebar.auditLogs',
      'Activity Logs': 'nav.sidebar.activityLogs',
      'Profile': 'nav.sidebar.profile',
      'Change Password': 'nav.sidebar.changePassword',
      'System Preferences': 'nav.sidebar.systemPreferences',
      'Logout': 'nav.sidebar.logout',
    };
    
    return t(labelMap[label] || label);
  };

  // Translation key mapping for group titles
  const getGroupTitle = (title: string): string => {
    const titleMap: Record<string, string> = {
      'Main Menu': 'nav.sidebar.mainMenu',
      'Sales & POS': 'nav.sidebar.salesPOS',
      'Inventory & Catalog': 'nav.sidebar.inventoryCatalog',
      'Customers & Medical': 'nav.sidebar.patientsMedical',
      'Branches & Devices': 'nav.sidebar.storeDevices',
      'Users & Access': 'nav.sidebar.usersSecurity',
      'SaaS & Billing': 'nav.sidebar.saasBilling',
      'Reports & Analytics': 'nav.sidebar.reportsAnalytics',
      'System & Settings': 'nav.sidebar.systemSettings',
    };
    
    return t(titleMap[title] || title);
  };

  // Check if user has permission
  const hasPermission = (permission?: string, path?: string): boolean => {
    const roleName = (currentUser?.roleName || user?.roleName || '').toUpperCase();
    const orgId = user?.organizationId || 1;
    const isSuperAdmin = roleName.includes('SUPERADMIN') || (orgId === 1 && (roleName === 'SUPERADMIN' || roleName === 'ROOT'));

    // Global multi-tenant Organizations & Subscribers Governance are strictly for SUPERADMIN ONLY
    if ((path === '/organization/organizations' || path === '/subscriptions/management') && !isSuperAdmin) {
      return false;
    }

    if (!permission) return true;

    if (
      roleName.includes('SUPERADMIN') ||
      roleName.includes('ADMIN') ||
      roleName.includes('OWNER') ||
      permissions.includes('ROLE_SUPERADMIN') ||
      permissions.includes('ROLE_ADMIN') ||
      permissions.includes('ADMIN') ||
      currentUser?.authorities?.includes('ROLE_SUPERADMIN') ||
      currentUser?.authorities?.includes('ROLE_ADMIN')
    ) {
      return true;
    }

    const grantedList = [
      ...(Array.isArray(permissions) ? permissions : []),
      ...(Array.isArray(currentUser?.authorities) ? currentUser.authorities : []),
    ].map(p => (typeof p === 'string' ? p.toLowerCase().trim() : ''));

    const targetPerm = permission.toLowerCase().trim();

    return grantedList.some(p => {
      if (!p) return false;
      if (p === targetPerm || p === '*' || p === 'all') return true;
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        if (targetPerm.startsWith(prefix)) return true;
      }
      return false;
    });
  };

  // Main Structured Dropdown Navigation Tree
  const navGroups: NavGroupItem[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      permission: 'report.view',
    },
    {
      id: 'sales',
      title: 'Sales & POS',
      icon: ShoppingCart,
      items: [
        { label: 'Orders', path: '/orders', icon: ShoppingCart, permission: 'order.view' },
        { label: 'Payments', path: '/sales/payments', icon: CreditCard, permission: 'payment.view' },
        { label: 'Returns', path: '/sales/returns', icon: RotateCcw, permission: 'order.return' },
        { label: 'Current Shift', path: '/shifts/current', icon: Clock, permission: 'shift.view' },
        { label: 'Open Shift', path: '/shifts/open', icon: Clock, permission: 'shift.open' },
        { label: 'Shift History', path: '/shifts', icon: Clock, permission: 'shift.view' },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory & Catalog',
      icon: Package,
      badge: 'lowStock',
      items: [
        { label: 'Products', path: '/products', icon: Package, permission: 'product.view' },
        { label: 'Stock', path: '/inventory', icon: Warehouse, permission: 'inventory.view' },
        { label: 'Low Stock', path: '/inventory/low-stock', icon: AlertTriangle, permission: 'inventory.view', badge: 'lowStock' },
        { label: 'Expiring Soon', path: '/inventory/expiring', icon: AlertTriangle, permission: 'inventory.view', badge: 'expiring' },
        { label: 'Expired', path: '/inventory/expired', icon: AlertTriangle, permission: 'inventory.view' },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, permission: 'purchase.view' },
        { label: 'Goods Receipts', path: '/goods-receipts', icon: Package, permission: 'goods_receipt.view' },
        { label: 'Categories', path: '/categories', icon: Layers, permission: 'categories.view' },
        { label: 'Suppliers', path: '/catalog/suppliers', icon: Truck, permission: 'suppliers.view' },
        { label: 'Active Ingredients', path: '/active-ingredients', icon: Layers, permission: 'product.view' },
      ],
    },
    {
      id: 'customers',
      title: 'Customers & Medical',
      icon: Users,
      items: [
        { label: 'Customers', path: '/customers', icon: Users, permission: 'customer.view' },
        { label: 'Customer Allergies', path: '/customer-allergies', icon: AlertTriangle, permission: 'customer.view' },
        { label: 'Doctors', path: '/doctors', icon: User, permission: 'doctor.view' },
        { label: 'Prescriptions', path: '/prescriptions', icon: FileText, permission: 'prescription.view' },
      ],
    },
    {
      id: 'organization',
      title: 'Branches & Devices',
      icon: Building,
      items: [
        { label: 'Branches', path: '/branches', icon: Building, permission: 'branch.view' },
        { label: 'Branch Settings', path: '/branch-settings', icon: Settings, permission: 'branch.settings.update' },
        { label: 'Devices', path: '/devices', icon: Phone, permission: 'device.view' },
        { label: 'POS Terminals', path: '/devices/terminals', icon: Phone, permission: 'device.view' },
        { label: 'Organizations', path: '/organization/organizations', icon: Building2, permission: 'organization.view', superAdminOnly: true },
      ],
    },
    {
      id: 'users',
      title: 'Users & Access',
      icon: ShieldCheck,
      items: [
        { label: 'Users', path: '/users', icon: Users, permission: 'user.view' },
        { label: 'Roles', path: '/roles-permissions', icon: ShieldCheck, permission: 'role.view' },
        { label: 'Audit Logs', path: '/audit-logs', icon: FileText, permission: 'audit.view' },
        { label: 'Activity Logs', path: '/audit-logs/activity', icon: FileText, permission: 'audit.view' },
      ],
    },
    {
      id: 'subscription',
      title: 'SaaS & Billing',
      icon: Crown,
      items: [
        { label: 'My Subscription', path: '/subscriptions', icon: DollarSign, permission: 'subscription.view' },
        { label: 'Subscribers Governance', path: '/subscriptions/management', icon: Crown, permission: 'subscription.create', superAdminOnly: true },
      ],
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      items: [
        { label: 'Sales Reports', path: '/reports/sales', icon: BarChart3, permission: 'report.view' },
        { label: 'Product Reports', path: '/reports/products', icon: Package, permission: 'report.view' },
        { label: 'Customer Reports', path: '/reports/customers', icon: Users, permission: 'report.view' },
        { label: 'Purchase Reports', path: '/reports/purchases', icon: ShoppingCart, permission: 'report.view' },
        { label: 'Inventory Reports', path: '/reports/inventory', icon: Warehouse, permission: 'report.view' },
      ],
    },
    {
      id: 'settings',
      title: 'System & Settings',
      icon: Settings,
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell, permission: 'notification.view', badge: 'notifications' },
        { label: 'Announcements', path: '/notifications/announcements', icon: Bell, permission: 'notification.view' },
        { label: 'Profile', path: '/settings/profile', icon: User },
        { label: 'Change Password', path: '/settings/change-password', icon: ShieldCheck },
        { label: 'System Preferences', path: '/system-settings', icon: Settings, permission: 'organization.view' },
      ],
    },
  ], []);

  // Filter navigation items based on user permissions
  const filteredNavGroups = useMemo(() => {
    return navGroups.map(group => {
      if (group.path) {
        return hasPermission(group.permission, group.path) ? group : null;
      }
      const allowedItems = (group.items || []).filter(item => hasPermission(item.permission, item.path));
      if (allowedItems.length === 0) return null;
      return {
        ...group,
        items: allowedItems,
      };
    }).filter(Boolean) as NavGroupItem[];
  }, [navGroups, permissions, currentUser, user]);

  // Auto-expand group that contains current active path
  useEffect(() => {
    filteredNavGroups.forEach(group => {
      if (group.items?.some(item => pathname.startsWith(item.path))) {
        setOpenDropdowns(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, filteredNavGroups]);

  const toggleDropdown = (groupId: string) => {
    if (collapsed) {
      setCollapsed(false);
    }
    setOpenDropdowns(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isActive = (path: string) => pathname === path;
  const isGroupActive = (group: NavGroupItem) => {
    if (group.path) return pathname === group.path;
    return group.items?.some(item => pathname === item.path || pathname.startsWith(item.path + '/'));
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex h-screen overflow-hidden">
        
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Modern Sidebar with Collapsible Accordion Dropdowns */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${collapsed ? 'w-20' : 'w-72'} 
          bg-white dark:bg-slate-900 
          border-r border-slate-200/80 dark:border-slate-800/90
          h-screen flex flex-col
          shadow-xl lg:shadow-none
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          
          {/* Logo & Collapse Header */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 bg-gradient-to-tr from-primary to-emerald-500 rounded-2xl shadow-md shadow-primary/20 shrink-0">
                <span className="text-white text-lg">💊</span>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate flex items-center gap-1.5">
                    <span>Pharmacy POS</span>
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate uppercase tracking-wider">
                    {currentUser?.roleName || user?.roleName || 'Cloud Edition'}
                  </p>
                </div>
              )}
            </div>

            {/* Collapse toggle button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden lg:flex items-center justify-center shrink-0"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`} />
            </button>
          </div>
          
          {/* Navigation Dropdowns List (Scrollable) */}
          <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {filteredNavGroups.map((group) => {
              const GroupIcon = group.icon;
              const hasSubItems = !!group.items && group.items.length > 0;
              const isOpen = !!openDropdowns[group.id];
              const groupActive = isGroupActive(group);

              // Single Direct Link (e.g. Dashboard)
              if (!hasSubItems && group.path) {
                const active = isActive(group.path);
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      router.push(group.path!);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
                      active
                        ? 'bg-primary text-white shadow-md shadow-primary/25 font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-primary dark:hover:text-white'
                    }`}
                    title={collapsed ? getSidebarLabel(group.title) : undefined}
                  >
                    <GroupIcon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    {!collapsed && (
                      <span className={`truncate ${language === 'kh' ? 'font-khmer' : ''}`}>
                        {getSidebarLabel(group.title)}
                      </span>
                    )}
                  </button>
                );
              }

              // Collapsible Dropdown Group
              const groupBadgeCount = group.badge === 'lowStock' ? badgeCounts.lowStock : 0;

              return (
                <div key={group.id} className="space-y-1">
                  {/* Dropdown Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleDropdown(group.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      groupActive && !isOpen
                        ? 'bg-primary/10 text-primary dark:text-primary-light border border-primary/20 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                    title={collapsed ? getGroupTitle(group.title) : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <GroupIcon className={`h-4 w-4 shrink-0 ${groupActive ? 'text-primary' : 'text-slate-400'}`} />
                      {!collapsed && (
                        <span className={`truncate text-left ${language === 'kh' ? 'font-khmer' : ''}`}>
                          {getGroupTitle(group.title)}
                        </span>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {groupBadgeCount > 0 && !isOpen && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            {groupBadgeCount}
                          </span>
                        )}
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-primary' : 'rotate-0'
                          }`}
                        />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Sub-menu Items */}
                  {isOpen && !collapsed && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {group.items?.map((item) => {
                        const SubIcon = item.icon;
                        const active = isActive(item.path);
                        const itemBadge = item.badge ? badgeCounts[item.badge] || 0 : 0;

                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              router.push(item.path);
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all relative ${
                              active
                                ? 'bg-primary text-white font-black shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <SubIcon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                              <span className={`truncate text-left ${language === 'kh' ? 'font-khmer' : ''}`}>
                                {getSidebarLabel(item.label)}
                              </span>
                            </div>

                            {itemBadge > 0 && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                active ? 'bg-white text-primary' : 'bg-rose-500 text-white'
                              }`}>
                                {itemBadge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer User Info & Logout */}
          <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className={language === 'kh' ? 'font-khmer' : ''}>
                  {getSidebarLabel('Logout')}
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content View with Independent Scroll */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Fixed Top Navbar */}
          <Navbar />
          
          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950 pt-20 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}