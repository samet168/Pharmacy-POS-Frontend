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
import { AlertTriangle, RefreshCw, Calendar, Package, Trash2, Archive } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

interface ExpiredProduct {
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysExpired: number;
}

export default function ExpiredPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || 1;
  
  const [expiredProducts, setExpiredProducts] = useState<ExpiredProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpiredProducts = async () => {
    try {
      setLoading(true);
      const [batchesData, productsData] = await Promise.all([
        productBatchesApi.getByBranch(branchId),
        productsApi.listAll(),
      ]);
      
      const batchesArray = Array.isArray(batchesData) ? batchesData : [];
      const productsArray = Array.isArray(productsData) ? productsData : (productsData?.content || []);
      
      const expired = batchesArray.map((batch: any) => {
        const product = productsArray.find((p: any) => p.id === batch.productId);
        const daysExpired = Math.ceil((Date.now() - new Date(batch.expiryDate).getTime()) / (1000 * 60 * 60 * 24));
        return {
          productId: batch.productId,
          productName: product?.name || `Product #${batch.productId}`,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          quantity: batch.quantityRemaining,
          daysExpired,
        };
      }).filter((p: any) => p.daysExpired > 0);
      
      setExpiredProducts(expired);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredProducts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDispose = (productId: number, batchNumber: string) => {
    toast.info(`Dispose product #${productId} batch ${batchNumber} - Coming soon`);
  };

  const handleArchive = (productId: number, batchNumber: string) => {
    toast.info(`Archive product #${productId} batch ${batchNumber} - Coming soon`);
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
            Expired Products
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and dispose of expired inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchExpiredProducts}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="pink" className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-pink-text/10 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-bento-pink-text" />
            </div>
            <div>
              <p className="text-sm text-bento-pink-text/70">Expired Items</p>
              <p className="text-3xl font-bold text-bento-pink-text">{expiredProducts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Package className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Quantity</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {expiredProducts.reduce((sum, p) => sum + p.quantity, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Days Expired</p>
              <p className="text-3xl font-bold text-bento-primary dark:text-slate-100">
                {expiredProducts.length > 0
                  ? Math.round(expiredProducts.reduce((sum, p) => sum + p.daysExpired, 0) / expiredProducts.length)
                  : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Warning Banner */}
      {expiredProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Expired Inventory Alert
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {expiredProducts.length} expired product batches found. These items should be disposed of or archived according to your pharmacy's procedures and local regulations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Products Table */}
      <Card className="overflow-hidden">
        {expiredProducts.length === 0 ? (
          <EmptyState
            title="No expired products"
            description="Great! No expired products found in your inventory."
            icon={<Calendar className="h-12 w-12 text-slate-400" />}
            action={<Button onClick={fetchExpiredProducts}>Refresh Data</Button>}
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
                  <TableHeader>Days Expired</TableHeader>
                  <TableHeader>Quantity</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiredProducts
                  .sort((a, b) => b.daysExpired - a.daysExpired)
                  .map((product) => (
                    <TableRow key={`${product.productId}-${product.batchNumber}`}>
                      <TableCell className="font-medium">#{product.productId}</TableCell>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{product.batchNumber}</TableCell>
                      <TableCell>{formatDate(product.expiryDate)}</TableCell>
                      <TableCell className="font-medium text-red-600 dark:text-red-400">
                        {product.daysExpired} days
                      </TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDispose(product.productId, product.batchNumber)}
                            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Dispose
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(product.productId, product.batchNumber)}
                            className="flex items-center gap-1"
                          >
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}