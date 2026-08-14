'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { productsApi } from '@/lib/api/products';
import { ordersApi } from '@/lib/api/orders';
import { productBatchesApi } from '@/lib/api/productBatches';
import { categoriesApi } from '@/lib/api/categories';
import { suppliersApi } from '@/lib/api/suppliers';
import { customersApi } from '@/lib/api/customers';
import { BarChart3, Users, ShoppingCart, Package, TrendingUp, MoreHorizontal, Calendar, AlertTriangle } from 'lucide-react';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get organizationId from auth store or localStorage
      const organizationId = localStorage.getItem('organizationId') || '1';

      // Fetch data in parallel
      const [products, orders, customers, batches, categories, suppliers] = await Promise.all([
        productsApi.listAll().catch(() => []),
        ordersApi.listAll(parseInt(organizationId)).catch(() => []),
        customersApi.listAll().catch(() => []),
        productBatchesApi.listAll().catch(() => []),
        categoriesApi.listAll().catch(() => []),
        suppliersApi.listAll().catch(() => []),
      ]);

      // Ensure all are arrays
      const safeProducts = Array.isArray(products) ? products : [];
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeCustomers = Array.isArray(customers) ? customers : [];
      const safeBatches = Array.isArray(batches) ? batches : [];
      const safeCategories = Array.isArray(categories) ? categories : [];
      const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

      // Calculate stats
      const lowStockCount = safeProducts.filter((p: any) => p.quantity <= 10).length;
      const expiringCount = safeBatches.filter((b: any) => {
        const daysUntilExpiry = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length;

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = safeOrders.filter((o: any) => o.orderDate?.startsWith(today));
      const todaySales = todayOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || 0), 0);

      setStats({
        totalSales: safeOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || 0), 0),
        totalOrders: safeOrders.length,
        totalCustomers: safeCustomers.length,
        lowStock: lowStockCount,
        expiringSoon: expiringCount,
        todaySales,
        todayOrders: todayOrders.length,
        totalProducts: safeProducts.length,
        totalCategories: safeCategories.length,
        totalSuppliers: safeSuppliers.length,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      // Use mock data if API fails
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
      toast.warning('Using mock data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-12 w-12 text-bento-pink mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">{error}</p>
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={fetchDashboardStats}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Welcome, User!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your pharmacy today</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" shape="pill" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Month
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alert Ticker */}
      {(stats.lowStock > 0 || stats.expiringSoon > 0) && (
        <div className="bg-bento-pink/10 dark:bg-bento-pink/20 border border-bento-pink dark:border-bento-pink/80 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-bento-pink-text" />
            <div className="flex-1">
              <p className="text-sm font-medium text-bento-pink-text dark:text-bento-pink-text">
                Attention Required
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {stats.lowStock} low stock items • {stats.expiringSoon} expiring soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row 1 - Pastel KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales - Lime */}
        <Card variant="lime" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-lime-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-lime-text/20 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-bento-lime-text rounded-full"></div>
              </div>
              <span className="text-xs font-medium text-bento-lime-text">+12.5%</span>
            </div>
            <div>
              <p className="text-sm text-bento-lime-text/70">Today's Sales</p>
              <p className="text-3xl font-bold text-bento-lime-text">${stats.todaySales.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Available Categories - Mint */}
        <Card variant="mint" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-mint-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-mint-text/20 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-bento-mint-text rounded-full"></div>
              </div>
              <span className="text-xs font-medium text-bento-mint-text">+8.2%</span>
            </div>
            <div>
              <p className="text-sm text-bento-mint-text/70">Total Categories</p>
              <p className="text-3xl font-bold text-bento-mint-text">{stats.totalCategories}</p>
            </div>
          </div>
        </Card>

        {/* Expired Medicines - Pink */}
        <Card variant="pink" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-pink-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-pink-text/20 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-bento-pink-text rounded-full"></div>
              </div>
              <span className="text-xs font-medium text-bento-pink-text">0.0%</span>
            </div>
            <div>
              <p className="text-sm text-bento-pink-text/70">Expiring Soon</p>
              <p className="text-3xl font-bold text-bento-pink-text">{stats.expiringSoon}</p>
            </div>
          </div>
        </Card>

        {/* System Users - Lavender */}
        <Card variant="lavender" className="relative">
          <div className="absolute top-6 right-6">
            <button className="text-bento-lavender-text hover:opacity-70">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-bento-lavender-text/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-bento-lavender-text rounded-full"></div>
              </div>
              <span className="text-xs font-medium text-bento-lavender-text">+5.1%</span>
            </div>
            <div>
              <p className="text-sm text-bento-lavender-text/70">Total Customers</p>
              <p className="text-3xl font-bold text-bento-lavender-text">{stats.totalCustomers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">{stats.totalProducts}</p>
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
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">{stats.totalOrders}</p>
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
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">{stats.totalSuppliers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 - Data Visualization Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card - Donut Chart */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-48 h-48 mb-6">
              {/* Donut Chart SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
                  <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">${stats.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Sales</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bento-primary"></div>
                  <span className="text-slate-600 dark:text-slate-400">Purchases</span>
                </div>
                <span className="font-medium text-bento-primary dark:text-slate-100">40%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bento-mint"></div>
                  <span className="text-slate-600 dark:text-slate-400">Suppliers</span>
                </div>
                <span className="font-medium text-bento-primary dark:text-slate-100">25%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bento-lime"></div>
                  <span className="text-slate-600 dark:text-slate-400">Sales</span>
                </div>
                <span className="font-medium text-bento-primary dark:text-slate-100">20%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-slate-600 dark:text-slate-400">No Sales</span>
                </div>
                <span className="font-medium text-slate-400">15%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Card - Total Sales Overview */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-bento-primary dark:text-slate-100">Total Sales Overview</h3>
            <Button variant="outline" shape="pill" size="sm">
              View Report
            </Button>
          </div>
          <div className="space-y-4">
            {/* Bar Chart with Pastel Colors */}
            <div className="flex items-end gap-4 h-48">
              {[
                { value: 60, label: 'Mon', color: 'bg-bento-lime' },
                { value: 80, label: 'Tue', color: 'bg-bento-mint' },
                { value: 45, label: 'Wed', color: 'bg-bento-lavender' },
                { value: 90, label: 'Thu', color: 'bg-bento-primary' },
                { value: 70, label: 'Fri', color: 'bg-bento-lime' },
                { value: 55, label: 'Sat', color: 'bg-bento-mint' },
                { value: 85, label: 'Sun', color: 'bg-bento-lavender' },
              ].map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group">
                    <div 
                      className={`w-full ${item.color} rounded-t-lg transition-all hover:opacity-80`}
                      style={{ height: `${item.value}%` }}
                    >
                      {/* Striped pattern */}
                      <div className="absolute inset-0 opacity-10" 
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.3) 5px, rgba(255,255,255,0.3) 10px)'
                        }}
                      ></div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${item.value * 10}.00K
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}