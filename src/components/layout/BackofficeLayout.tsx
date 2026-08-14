'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  Clock
} from 'lucide-react';
import Navbar from './Navbar';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('permissions');
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const navGroups = [
    {
      title: 'MAIN MENU',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Categories', path: '/categories', icon: Layers },
        { label: 'Suppliers', path: '/catalog/suppliers', icon: Truck },
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Stock', path: '/inventory', icon: Warehouse },
        { label: 'Transfers', path: '/inventory/transfers', icon: Warehouse },
        { label: 'Goods Receipts', path: '/goods-receipts', icon: Package },
      ]
    },
    {
      title: 'SALES',
      items: [
        { label: 'Orders', path: '/orders', icon: ShoppingCart },
        { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
        { label: 'Payments', path: '/payments', icon: CreditCard },
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Doctors', path: '/doctors', icon: User },
        { label: 'Prescriptions', path: '/prescriptions', icon: FileText },
      ]
    },
    {
      title: 'ORGANIZATION',
      items: [
        { label: 'Branches', path: '/branches', icon: Building },
        { label: 'Branch Settings', path: '/branch-settings', icon: Settings },
        { label: 'Users', path: '/users', icon: Users },
        { label: 'Roles', path: '/roles', icon: ShieldCheck },
        { label: 'Permissions', path: '/permissions', icon: Settings },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Shifts', path: '/shifts', icon: Clock },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
        { label: 'Settings', path: '/system-settings', icon: Settings },
      ]
    },
  ];

  const isActive = (path: string) => pathname === path;

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
          w-72 bg-bento-white dark:bg-bento-sidebar-dark border-r border-bento-gray dark:border-slate-800
          h-screen overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo */}
          <div className="h-20 flex items-center px-8 border-b border-bento-gray dark:border-slate-800 sticky top-0 bg-bento-white dark:bg-bento-sidebar-dark z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bento-primary rounded-xl">
                <span className="text-white text-xl">💊</span>
              </div>
              <h1 className="text-xl font-bold text-bento-primary dark:text-slate-100 font-display">Pharmacy</h1>
            </div>
          </div>
          
          {/* Navigation Groups */}
          <nav className="flex-1 p-6 space-y-8">
            {navGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
                          active 
                            ? 'bg-bento-primary text-white shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-bento-gray dark:hover:bg-slate-800 hover:text-bento-primary dark:hover:text-slate-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-6 border-t border-bento-gray dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-slate-600 dark:text-slate-400 hover:bg-bento-gray dark:hover:bg-slate-800 hover:text-bento-primary dark:hover:text-slate-100 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
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