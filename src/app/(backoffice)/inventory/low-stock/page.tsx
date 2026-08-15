'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { dashboardApi } from '@/lib/api/dashboard';
import { AlertTriangle, Package, ShoppingCart, RefreshCw, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

interface LowStockProduct {
  productId: number;
  productName: string;
  currentStock: number;
  minimumStock: number;
}

export default function LowStockPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalProducts: 0,
    lowStockCount: 0,
  });

  const fetchLowStockData = async () => {
    try {
      setLoading(true);
      const [lowStockData, overviewData] = await Promise.all([
        dashboardApi.getLowStock(organizationId),
        dashboardApi.getOverview(organizationId),
      ]);
      
      setLowStockProducts(lowStockData.lowStockProducts || []);
      setOverview({
        totalProducts: overviewData.totalProducts,
        lowStockCount: overviewData.lowStockProducts,
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockData();
  }, [organizationId]);

  const getStockStatus = (current: number, minimum: number) => {
    const ratio = current / minimum;
    if (ratio === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (ratio < 0.5) return { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (ratio < 0.75) return { label: 'Low', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Warning', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
  };

  const getStockLevel = (current: number, minimum: number) => {
    const ratio = Math.min(current / minimum, 1);
    if (ratio < 0.25) return 'bg-red-500';
    if (ratio < 0.5) return 'bg-orange-500';
    if (ratio < 0.75) return 'bg-yellow-500';
    return 'bg-amber-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Low Stock Alerts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor products that need restocking
          </p>
        </div>
        <Button
          onClick={fetchLowStockData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="pink" className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-pink-text/10 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-bento-pink-text" />
            </div>
            <div>
              <p className="text-sm text-bento-pink-text/70">Low Stock Items</p>
              <p className="text-3xl font-bold text-bento-pink-text">{overview.lowStockCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {overview.totalProducts}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Stock Health</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {overview.totalProducts > 0 
                  ? Math.round(((overview.totalProducts - overview.lowStockCount) / overview.totalProducts) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Banner */}
      {overview.lowStockCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Attention Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {overview.lowStockCount} products are below their minimum stock level. Consider creating purchase orders to replenish inventory.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Create Purchase Order - Coming soon')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </div>
        </div>
      )}

      {/* Low Stock Table */}
      <Card className="overflow-hidden">
        {lowStockProducts.length === 0 ? (
          <EmptyState
            title="No low stock items"
            description="All products are well stocked. Great job maintaining inventory!"
            icon={<Package className="h-12 w-12 text-slate-400" />}
            action={<Button onClick={fetchLowStockData}>Refresh Data</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Product ID</TableHeader>
                  <TableHeader>Product Name</TableHeader>
                  <TableHeader>Current Stock</TableHeader>
                  <TableHeader>Minimum Stock</TableHeader>
                  <TableHeader>Stock Level</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockProducts.map((product) => {
                  const status = getStockStatus(product.currentStock, product.minimumStock);
                  const stockLevel = getStockLevel(product.currentStock, product.minimumStock);
                  const stockPercentage = Math.min((product.currentStock / product.minimumStock) * 100, 100);
                  
                  return (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">#{product.productId}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell className="font-medium">{product.currentStock}</TableCell>
                      <TableCell>{product.minimumStock}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${stockLevel} transition-all duration-300`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {Math.round(stockPercentage)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info('View product details - Coming soon')}
                            className="flex items-center gap-1"
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info('Create purchase order - Coming soon')}
                            className="flex items-center gap-1"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Reorder
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}