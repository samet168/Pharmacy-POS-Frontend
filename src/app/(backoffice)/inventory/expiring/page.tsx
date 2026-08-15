'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { productBatchesApi, productsApi } from '@/lib/api';
import { Clock, AlertTriangle, RefreshCw, Calendar, Package } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

interface ExpiringProduct {
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysUntilExpiry: number;
}

export default function ExpiringPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || 1;
  
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(30); // Days threshold

  const fetchExpiringProducts = async () => {
    try {
      setLoading(true);
      const [batchesData, productsData] = await Promise.all([
        productBatchesApi.getExpiring(branchId, threshold),
        productsApi.listAll(),
      ]);
      
      const batchesArray = Array.isArray(batchesData) ? batchesData : [];
      const productsArray = Array.isArray(productsData) ? productsData : (productsData?.content || []);
      
      const expiring = batchesArray.map((batch: any) => {
        const product = productsArray.find((p: any) => p.id === batch.productId);
        const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          productId: batch.productId,
          productName: product?.name || `Product #${batch.productId}`,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: batch.quantityRemaining,
          daysUntilExpiry,
        };
      }).filter((p: any) => p.daysUntilExpiry <= threshold && p.daysUntilExpiry > 0);
      
      setExpiringProducts(expiring);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringProducts();
  }, [threshold]);

  const getExpiryStatus = (days: number) => {
    if (days <= 0) return { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (days <= 7) return { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (days <= 14) return { label: 'Urgent', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' };
    if (days <= 30) return { label: 'Warning', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Soon', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            Expiring Products
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor products approaching their expiration date
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchExpiringProducts}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Threshold Settings */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Show products expiring within:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 30)}
              className="w-20 px-3 py-2 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              min="1"
              max="365"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">days</span>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="pink" className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-pink-text/10 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-bento-pink-text" />
            </div>
            <div>
              <p className="text-sm text-bento-pink-text/70">Expiring Soon</p>
              <p className="text-3xl font-bold text-bento-pink-text">
                {expiringProducts.filter(p => p.daysUntilExpiry > 0 && p.daysUntilExpiry <= threshold).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Already Expired</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {expiringProducts.filter(p => p.daysUntilExpiry <= 0).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Batches</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {expiringProducts.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert Banner */}
      {expiringProducts.filter(p => p.daysUntilExpiry <= 7).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Critical Alert
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {expiringProducts.filter(p => p.daysUntilExpiry <= 7).length} products will expire within 7 days. Immediate action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Products Table */}
      <Card className="overflow-hidden">
        {expiringProducts.length === 0 ? (
          <EmptyState
            title="No expiring products"
            description={`No products are expiring within the next ${threshold} days.`}
            icon={<Calendar className="h-12 w-12 text-slate-400" />}
            action={<Button onClick={fetchExpiringProducts}>Refresh Data</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Product ID</TableHeader>
                  <TableHeader>Product Name</TableHeader>
                  <TableHeader>Batch Number</TableHeader>
                  <TableHeader>Expiry Date</TableHeader>
                  <TableHeader>Days Remaining</TableHeader>
                  <TableHeader>Quantity</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiringProducts
                  .filter(p => p.daysUntilExpiry <= threshold)
                  .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                  .map((product) => {
                    const status = getExpiryStatus(product.daysUntilExpiry);
                    
                    return (
                      <TableRow key={`${product.productId}-${product.batchNumber}`}>
                        <TableCell className="font-medium">#{product.productId}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="font-mono text-sm">{product.batchNumber}</TableCell>
                        <TableCell>{formatDate(product.expiryDate)}</TableCell>
                        <TableCell className="font-medium">
                          {product.daysUntilExpiry > 0 ? `${product.daysUntilExpiry} days` : 'Expired'}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
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
                              onClick={() => toast.info('View batch details - Coming soon')}
                              className="flex items-center gap-1"
                            >
                              View
                            </Button>
                            {product.daysUntilExpiry > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast.info('Discount promotion - Coming soon')}
                                className="flex items-center gap-1"
                              >
                                Discount
                              </Button>
                            )}
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