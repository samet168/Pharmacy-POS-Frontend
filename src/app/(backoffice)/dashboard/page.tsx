'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/authStore';
import { dashboardApi } from '@/lib/api/dashboard';
import {
  Users,
  ShoppingCart,
  Package,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  lowStock: number;
  expiringSoon: number;
  todaySales: number;
  todayOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
}

const EMPTY_STATS: DashboardStats = {
  totalSales: 0,
  totalOrders: 0,
  totalCustomers: 0,
  lowStock: 0,
  expiringSoon: 0,
  todaySales: 0,
  todayOrders: 0,
  totalProducts: 0,
  totalCategories: 0,
  totalSuppliers: 0,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setUsingMockData(false);

    try {
      const overview = await dashboardApi.getOverview();
      
      setStats({
        totalSales: overview.totalRevenue,
        totalOrders: overview.totalOrders,
        totalCustomers: overview.totalCustomers,
        lowStock: overview.lowStockProducts,
        expiringSoon: 0, // Not available in overview API
        todaySales: overview.todayRevenue,
        todayOrders: overview.todayOrders,
        totalProducts: overview.totalProducts,
        totalCategories: 0, // Not available in overview API
        totalSuppliers: 0, // Not available in overview API
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Graceful degradation — show mock data with a notice
      setStats({
        totalSales: 15420,
        totalOrders: 156,
        totalCustomers: 255,
        lowStock: 12,
        expiringSoon: 8,
        todaySales: 2450,
        todayOrders: 18,
        totalProducts: 456,
        totalCategories: 24,
        totalSuppliers: 18,
      });
      setUsingMockData(true);
      toast.warning('Could not reach the API — showing sample data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={300} height={20} />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const displayName = user?.username ?? 'User';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Welcome, {displayName}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here&apos;s what&apos;s happening with your pharmacy today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            shape="pill"
            className="flex items-center gap-2"
            onClick={fetchDashboardStats}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" shape="pill" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Month
          </Button>
        </div>
      </div>

      {/* Mock-data / alert banner */}
      {(usingMockData || stats.lowStock > 0 || stats.expiringSoon > 0) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              {usingMockData && (
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  API unavailable — displaying sample data
                </p>
              )}
              {(stats.lowStock > 0 || stats.expiringSoon > 0) && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {stats.lowStock > 0 && `${stats.lowStock} low stock items`}
                  {stats.lowStock > 0 && stats.expiringSoon > 0 && ' • '}
                  {stats.expiringSoon > 0 && `${stats.expiringSoon} batches expiring within 30 days`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Row 1 — KPI Cards                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <Card variant="lime" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-lime-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-lime-text/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-bento-lime-text rounded-full" />
              </div>
              <span className="text-xs font-medium text-bento-lime-text">Today</span>
            </div>
            <div>
              <p className="text-sm text-bento-lime-text/70">Today&apos;s Sales</p>
              <p className="text-3xl font-bold text-bento-lime-text">
                ${stats.todaySales.toLocaleString()}
              </p>
              <p className="text-xs text-bento-lime-text/60 mt-1">{stats.todayOrders} orders</p>
            </div>
          </div>
        </Card>

        {/* Total Categories */}
        <Card variant="mint" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-mint-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-mint-text/20 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-bento-mint-text rounded-full" />
              </div>
            </div>
            <div>
              <p className="text-sm text-bento-mint-text/70">Total Categories</p>
              <p className="text-3xl font-bold text-bento-mint-text">{stats.totalCategories}</p>
            </div>
          </div>
        </Card>

        {/* Expiring Soon */}
        <Card variant="pink" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-pink-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-pink-text/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-bento-pink-text rounded-full"
                  style={{ width: stats.expiringSoon > 0 ? '60%' : '0%' }}
                />
              </div>
              {stats.expiringSoon > 0 && (
                <span className="text-xs font-medium text-bento-pink-text">⚠ Alert</span>
              )}
            </div>
            <div>
              <p className="text-sm text-bento-pink-text/70">Expiring Soon</p>
              <p className="text-3xl font-bold text-bento-pink-text">{stats.expiringSoon}</p>
              <p className="text-xs text-bento-pink-text/60 mt-1">within 30 days</p>
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card variant="lavender" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-lavender-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-lavender-text/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-bento-lavender-text rounded-full" />
              </div>
            </div>
            <div>
              <p className="text-sm text-bento-lavender-text/70">Total Customers</p>
              <p className="text-3xl font-bold text-bento-lavender-text">{stats.totalCustomers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Row 2 — Secondary stats                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {stats.totalProducts}
              </p>
              {stats.lowStock > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">{stats.lowStock} need restock</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {stats.totalOrders}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                ${stats.totalSales.toLocaleString()} revenue
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Suppliers</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {stats.totalSuppliers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Row 3 — Charts                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#062D2D" strokeWidth="12"
                  strokeDasharray="100.53 251.33" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#A2E8DD" strokeWidth="12"
                  strokeDasharray="62.83 251.33" strokeDashoffset="-100.53" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#D7F3B0" strokeWidth="12"
                  strokeDasharray="50.27 251.33" strokeDashoffset="-163.36" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                    ${stats.totalSales.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Sales</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 w-full">
              {[
                { label: 'Orders', color: 'bg-bento-primary', value: `${stats.totalOrders}` },
                { label: 'Customers', color: 'bg-bento-mint', value: `${stats.totalCustomers}` },
                { label: 'Products', color: 'bg-bento-lime', value: `${stats.totalProducts}` },
                { label: 'Suppliers', color: 'bg-slate-200', value: `${stats.totalSuppliers}` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${row.color}`} />
                    <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                  </div>
                  <span className="font-medium text-bento-primary dark:text-slate-100">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Weekly bar chart (static visual — real chart lib can replace later) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-bento-primary dark:text-slate-100">
              Sales Overview
            </h3>
            <Button variant="outline" shape="pill" size="sm">
              View Report
            </Button>
          </div>
          <div className="flex items-end gap-4 h-48">
            {[
              { value: 60, label: 'Mon', color: 'bg-bento-lime' },
              { value: 80, label: 'Tue', color: 'bg-bento-mint' },
              { value: 45, label: 'Wed', color: 'bg-bento-lavender' },
              { value: 90, label: 'Thu', color: 'bg-bento-primary' },
              { value: 70, label: 'Fri', color: 'bg-bento-lime' },
              { value: 55, label: 'Sat', color: 'bg-bento-mint' },
              { value: 85, label: 'Sun', color: 'bg-bento-lavender' },
            ].map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group cursor-default">
                  <div
                    className={`w-full ${item.color} rounded-t-lg transition-all hover:opacity-80`}
                    style={{ height: `${item.value * 1.6}px` }}
                  >
                    <div
                      className="absolute inset-0 opacity-10 rounded-t-lg"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,0.3) 5px,rgba(255,255,255,0.3) 10px)',
                      }}
                    />
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ${item.value}K
                  </div>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
