'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
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
  ChevronRight,
  LogOut,
  X,
  DollarSign,
  CreditCard,
  Phone,
  MoreHorizontal,
  User,
  ShieldCheck,
  Clock,
  Bell,
  LucideIcon
} from 'lucide-react';
import Navbar from './Navbar';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  badge?: 'lowStock' | 'expiring' | 'notifications';
}

interface NavGroup {
  title: string;
  items: NavItem[];
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  // Fetch badge counts from dashboard
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const overview = await dashboardApi.getOverview();
        setBadgeCounts({
          lowStock: overview.lowStockProducts || 0,
          expiring: 0, // Backend doesn't provide this yet
          notifications: 0, // Backend doesn't provide this yet
        });
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    if (isAuthenticated) {
      fetchBadgeCounts();
      // Refresh badge counts every 5 minutes
      const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    // Clear localStorage + session cookie, update store
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('permissions');
    localStorage.removeItem('organizationId');
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    router.push('/login');
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  if (!isAuthenticated) {
    return null;
  }

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

  // Translation key mapping for section titles
  const getSectionTitle = (title: string): string => {
    const titleMap: Record<string, string> = {
      'MAIN MENU': 'nav.sidebar.mainMenu',
      'SALES': 'nav.sidebar.sales',
      'INVENTORY': 'nav.sidebar.inventory',
      'CUSTOMERS': 'nav.sidebar.customers',
      'ORGANIZATION': 'nav.sidebar.organization',
      'USER MANAGEMENT': 'nav.sidebar.userManagement',
      'SUBSCRIPTION': 'nav.sidebar.subscription',
      'DEVICES': 'nav.sidebar.devices',
      'SHIFTS': 'nav.sidebar.shifts',
      'REPORTS': 'nav.sidebar.reports',
      'NOTIFICATIONS': 'nav.sidebar.notifications',
      'AUDIT': 'nav.sidebar.audit',
      'SETTINGS': 'nav.sidebar.settings',
    };
    
    return t(titleMap[title] || title);
  };

  const navGroups: NavGroup[] = [
    {
      title: 'MAIN MENU',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'report.view' },
      ]
    },
    {
      title: 'SALES',
      items: [
        { label: 'Orders', path: '/orders', icon: ShoppingCart, permission: 'order.view' },
        { label: 'Payments', path: '/sales/payments', icon: CreditCard, permission: 'payment.view' },
        { label: 'Returns', path: '/sales/returns', icon: MoreHorizontal, permission: 'order.return' },
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Products', path: '/products', icon: Package, permission: 'product.view' },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, permission: 'purchase.view' },
        { label: 'Goods Receipts', path: '/goods-receipts', icon: Package, permission: 'goods_receipt.view' },
        { label: 'Stock', path: '/inventory', icon: Warehouse, permission: 'inventory.view' },
        { label: 'Low Stock', path: '/inventory/low-stock', icon: AlertTriangle, permission: 'inventory.view', badge: 'lowStock' },
        { label: 'Expiring Soon', path: '/inventory/expiring', icon: AlertTriangle, permission: 'inventory.view', badge: 'expiring' },
        { label: 'Expired', path: '/inventory/expired', icon: AlertTriangle, permission: 'inventory.view' },
        { label: 'Categories', path: '/categories', icon: Layers, permission: 'categories.view' },
        { label: 'Suppliers', path: '/catalog/suppliers', icon: Truck, permission: 'suppliers.view' },
        { label: 'Active Ingredients', path: '/active-ingredients', icon: Layers, permission: 'product.view' },
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { label: 'Customers', path: '/customers', icon: Users, permission: 'customer.view' },
        { label: 'Customer Allergies', path: '/customer-allergies', icon: AlertTriangle, permission: 'customer.view' },
        { label: 'Doctors', path: '/doctors', icon: User, permission: 'doctor.view' },
        { label: 'Prescriptions', path: '/prescriptions', icon: FileText, permission: 'prescription.view' },
      ]
    },
    {
      title: 'ORGANIZATION',
      items: [
        { label: 'Organizations', path: '/organization/organizations', icon: Building2, permission: 'organization.view' },
        { label: 'Branches', path: '/branches', icon: Building, permission: 'branch.view' },
        { label: 'Branch Settings', path: '/branch-settings', icon: Settings, permission: 'branch.settings.update' },
      ]
    },
    {
      title: 'USER MANAGEMENT',
      items: [
        { label: 'Users', path: '/users', icon: Users, permission: 'user.view' },
        { label: 'Roles', path: '/roles-permissions', icon: ShieldCheck, permission: 'role.view' },
      ]
    },
    {
      title: 'SUBSCRIPTION',
      items: [
        { label: 'Subscription Plans', path: '/subscriptions', icon: DollarSign, permission: 'subscription.view' },
      ]
    },
    {
      title: 'DEVICES',
      items: [
        { label: 'Devices', path: '/devices', icon: Phone, permission: 'device.view' },
        { label: 'POS Terminals', path: '/devices/terminals', icon: Phone, permission: 'device.view' },
      ]
    },
    {
      title: 'SHIFTS',
      items: [
        { label: 'Current Shift', path: '/shifts/current', icon: Clock, permission: 'shift.view' },
        { label: 'Open Shift', path: '/shifts/open', icon: Clock, permission: 'shift.open' },
        { label: 'Shift History', path: '/shifts', icon: Clock, permission: 'shift.view' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { label: 'Sales Reports', path: '/reports/sales', icon: BarChart3, permission: 'report.view' },
        { label: 'Product Reports', path: '/reports/products', icon: Package, permission: 'report.view' },
        { label: 'Customer Reports', path: '/reports/customers', icon: Users, permission: 'report.view' },
        { label: 'Purchase Reports', path: '/reports/purchases', icon: ShoppingCart, permission: 'report.view' },
        { label: 'Inventory Reports', path: '/reports/inventory', icon: Warehouse, permission: 'report.view' },
      ]
    },
    {
      title: 'NOTIFICATIONS',
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell, permission: 'notification.view', badge: 'notifications' },
        { label: 'Announcements', path: '/notifications/announcements', icon: Bell, permission: 'notification.view' },
      ]
    },
    {
      title: 'AUDIT',
      items: [
        { label: 'Audit Logs', path: '/audit-logs', icon: FileText, permission: 'audit.view' },
        { label: 'Activity Logs', path: '/audit-logs/activity', icon: FileText, permission: 'audit.view' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'Profile', path: '/settings/profile', icon: User, permission: 'user.view' },
        { label: 'Change Password', path: '/settings/change-password', icon: ShieldCheck, permission: 'user.update' },
        { label: 'Branch Settings', path: '/branch-settings', icon: Settings, permission: 'branch.settings.update' },
        { label: 'System Preferences', path: '/system-settings', icon: Settings, permission: 'settings.manage' },
      ]
    },
  ];

  const isActive = (path: string) => pathname === path;
  
  // Check if user has permission for a navigation item
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    // Admin role has all permissions
    if (currentUser?.roleName?.toUpperCase().includes('ADMIN')) return true;
    return permissions.includes(permission) || false;
  };
  
  // Filter navigation items based on permissions
  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permission))
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-bento-bg dark:bg-bento-bg-dark">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Fixed/Sticky */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${collapsed ? 'w-20' : 'w-72'} bg-bento-white dark:bg-bento-sidebar-dark border-r border-bento-gray dark:border-bento-border-dark
          h-screen overflow-y-auto
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo */}
          <div className="h-20 flex items-center px-8 border-b border-bento-gray dark:border-bento-border-dark sticky top-0 bg-bento-white dark:bg-bento-sidebar-dark z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bento-primary rounded-xl">
                <span className="text-white text-xl">💊</span>
              </div>
              {!collapsed && (
                <h1 className="text-xl font-bold text-bento-primary dark:text-bento-text-primary-dark font-display">Pharmacy</h1>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto p-2 rounded-lg hover:bg-bento-gray dark:hover:bg-slate-800 transition-colors hidden lg:block"
            >
              <ChevronRight className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Navigation Groups */}
          <nav className="flex-1 p-6 space-y-8">
            {filteredNavGroups.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <h3 className={`text-xs font-semibold text-slate-400 dark:text-bento-text-muted-dark uppercase tracking-wider mb-4 ${language === 'kh' ? 'font-khmer' : ''}`}>
                    {getSectionTitle(group.title)}
                  </h3>
                )}
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const badgeCount = item.badge ? badgeCounts[item.badge] || 0 : 0;
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all relative ${
                          active 
                            ? 'bg-bento-primary text-white shadow-sm' 
                            : 'text-slate-600 dark:text-bento-text-menu-dark hover:bg-bento-gray dark:hover:bg-slate-800 hover:text-bento-primary dark:hover:text-bento-text-primary-dark'
                        }`}
                        title={collapsed ? getSidebarLabel(item.label) : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className={`font-medium ${language === 'kh' ? 'font-khmer' : ''}`}>{getSidebarLabel(item.label)}</span>
                            {badgeCount > 0 && (
                              <span className="ml-auto bg-bento-pink text-white text-xs px-2 py-0.5 rounded-full">
                                {badgeCount}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && badgeCount > 0 && (
                          <span className="absolute top-2 right-2 bg-bento-pink-text text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-bento-gray dark:border-bento-border-dark">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 dark:text-bento-text-menu-dark hover:bg-bento-gray dark:hover:bg-slate-800 hover:text-bento-primary dark:hover:text-bento-text-primary-dark transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className={`font-medium ${language === 'kh' ? 'font-khmer' : ''}`}>{getSidebarLabel('Logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area - Independent Scroll */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Fixed Top Navbar */}
          <Navbar />
          
          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-bento-bg dark:bg-bento-bg-dark pt-20 p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}