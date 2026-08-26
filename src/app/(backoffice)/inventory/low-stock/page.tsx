'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  Truck,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';

interface LowStockItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  reorderQuantity: number;
  unit: string;
  category: string;
  supplier: string;
}

export default function LowStockPage() {
  const router = useRouter();
  const { language } = useTranslation();
  const { getOrganizationId } = useAuthStore();
  const organizationId = getOrganizationId();

  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchLowStockData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [lowStockRes, prodsRes] = await Promise.allSettled([
        dashboardApi.getLowStock(),
        productsApi.listAll(),
      ]);

      let productList: any[] = [];
      if (prodsRes.status === 'fulfilled' && prodsRes.value) {
        productList = Array.isArray(prodsRes.value) ? prodsRes.value : (prodsRes.value as any)?.content || [];
      }

      let lowStockList: LowStockItem[] = [];

      if (lowStockRes.status === 'fulfilled' && lowStockRes.value?.lowStockProducts?.length > 0) {
        lowStockList = lowStockRes.value.lowStockProducts.map((item: any, idx: number) => ({
          id: idx + 1,
          productId: item.productId,
          productName: item.productName || `Medicine #${item.productId}`,
          sku: `SKU-${String(item.productId).padStart(4, '0')}`,
          currentStock: item.currentStock || 0,
          minimumStock: item.minimumStock || 0,
          reorderQuantity: Math.max(1, (item.minimumStock || 10) - (item.currentStock || 0)),
          unit: 'Units',
          category: 'General',
          supplier: 'Default Supplier',
        }));
      }

      setItems(lowStockList);
      if (isManual) {
        toast.success(language === 'kh' ? 'បានទាញយកទិន្នន័យស្តុកទាបជោគជ័យ!' : 'Low stock data refreshed!');
      }
    } catch (err) {
      console.error('Low stock fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    fetchLowStockData();
  }, [fetchLowStockData]);

  const filteredItems = items.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  return (
    <div className="space-y-6 pb-10 transition-colors duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
        <div>
          <h1 className={`text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 ${language === 'kh' ? 'font-khmer' : ''}`}>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <span>{language === 'kh' ? 'ឱសថជិតដាច់ស្តុក (Low Stock Alert)' : 'Low Stock Replenishment'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated alerts for medications below minimum safe threshold level
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchLowStockData(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Button
            type="button"
            onClick={() => router.push('/purchase-orders')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/25 flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            <span>{language === 'kh' ? 'បង្កើត PO បញ្ជាទិញ' : 'Create Supplier PO'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Low Stock Items</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-500">{items.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Needs urgent reorder</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Critical (Stock &lt; 3)</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-500">
            {items.filter((i) => i.currentStock <= 3).length}
          </p>
          <p className="text-[11px] text-rose-500 font-bold mt-0.5">Imminent stockout</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Suggested PO Reorder</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {items.reduce((acc, i) => acc + i.reorderQuantity, 0)} Units
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recommended buffer</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search low stock medicines or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <ExportDropdown
            data={paginatedItems}
            filename="low_stock_medicines"
            columns={[
              { header: 'Medicine Name', key: 'productName' },
              { header: 'SKU', key: 'sku' },
              { header: 'Current Stock', key: 'currentStock' },
              { header: 'Min Stock', key: 'minimumStock' },
              { header: 'Supplier', key: 'supplier' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">SKU</th>
                <th className="pb-3">Medicine Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Current Stock</th>
                <th className="pb-3 text-right">Safety Threshold</th>
                <th className="pb-3 text-center">Urgency</th>
                <th className="pb-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <LoadingSkeleton variant="text" width={200} height={20} className="mx-auto" />
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold">No low stock items! All inventory healthy.</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isCritical = item.currentStock <= 3;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#04649C] dark:text-[#24A4EC]">
                        {item.sku}
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {item.category}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-rose-500">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                        {item.minimumStock} {item.unit}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {isCritical ? 'CRITICAL' : 'REORDER'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => router.push('/purchase-orders')}
                          className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-[11px] transition-all"
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
