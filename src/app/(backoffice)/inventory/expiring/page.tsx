'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productBatchesApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Package,
  ArrowRight,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Pill,
  Send,
  Zap,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';

interface ExpiringItem {
  id: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantityRemaining: number;
  daysUntilExpiry: number;
  costPrice: number;
}

export default function ExpiringPage() {
  const router = useRouter();
  const { language } = useTranslation();
  const { user } = useAuthStore();
  const branchId = user?.branchId || 1;

  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threshold, setThreshold] = useState(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchExpiringData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [batchesRes, prodsRes] = await Promise.allSettled([
        productBatchesApi.listAll(),
        productsApi.listAll(),
      ]);

      let batchList: any[] = [];
      let productList: any[] = [];

      if (batchesRes.status === 'fulfilled' && batchesRes.value) {
        batchList = Array.isArray(batchesRes.value) ? batchesRes.value : (batchesRes.value as any)?.content || [];
      }
      if (prodsRes.status === 'fulfilled' && prodsRes.value) {
        productList = Array.isArray(prodsRes.value) ? prodsRes.value : (prodsRes.value as any)?.content || [];
      }

      const now = Date.now();
      let expiringList: ExpiringItem[] = [];

      if (batchList.length > 0) {
        expiringList = batchList
          .map((batch) => {
            const product = productList.find((p) => p.id === batch.productId);
            const expTime = new Date(batch.expiryDate).getTime();
            const daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
            return {
              id: batch.id,
              productId: batch.productId,
              productName: product?.name || product?.brandName || batch.productName || `Product #${batch.productId}`,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              quantityRemaining: batch.quantityRemaining ?? batch.quantityReceived ?? 10,
              daysUntilExpiry,
              costPrice: batch.costPrice || 5.0,
            };
          })
          .filter((b) => b.daysUntilExpiry > 0 && b.daysUntilExpiry <= threshold);
      }

      setItems(expiringList);
      if (isManual) {
        toast.success(language === 'kh' ? 'បានទាញយកទិន្នន័យជោគជ័យ!' : 'Expiring soon data refreshed!');
      }
    } catch (err) {
      console.error('Expiring data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [threshold, language]);

  useEffect(() => {
    fetchExpiringData();
  }, [fetchExpiringData]);

  const filteredItems = items.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  return (
    <div className="space-y-6 pb-10 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 md:p-6 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
        <div>
          <h1 className={`text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 ${language === 'kh' ? 'font-khmer' : ''}`}>
            <Clock className="h-6 w-6 text-rose-500" />
            <span>{language === 'kh' ? 'ឱសថជិតផុតកំណត់ (Expiring Soon - FEFO)' : 'Expiring Soon (FEFO Priority)'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            First-Expiry First-Out (FEFO) dispensing queue and promotion planner
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setThreshold(days)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  threshold === days
                    ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                &lt; {days} Days
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchExpiringData(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-rose-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Expiring in &lt;30 Days</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-500">
            {items.filter((i) => i.daysUntilExpiry <= 30).length} Batches
          </p>
          <p className="text-[11px] text-rose-500 font-bold mt-0.5">Urgent FEFO dispensing</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Units at Risk</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-500">
            {items.reduce((acc, i) => acc + i.quantityRemaining, 0)} Units
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Potential loss prevention</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Estimated Value</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ${items.reduce((acc, i) => acc + i.quantityRemaining * i.costPrice, 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Asset cost at risk</p>
        </div>
      </div>

      {/* Table */}
      <div className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expiring batch or medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <ExportDropdown
            data={paginatedItems}
            filename="expiring_medicines"
            columns={[
              { header: 'Medicine', key: 'productName' },
              { header: 'Batch #', key: 'batchNumber' },
              { header: 'Expiry Date', key: 'expiryDate' },
              { header: 'Days Left', key: 'daysUntilExpiry' },
              { header: 'Remaining', key: 'quantityRemaining' },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Batch Number</th>
                <th className="pb-3">Medicine / Product</th>
                <th className="pb-3">Expiry Date</th>
                <th className="pb-3 text-right">Days Left</th>
                <th className="pb-3 text-right">Remaining Stock</th>
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
                    <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold">No batches expiring within {threshold} days!</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isUrgent = item.daysUntilExpiry <= 30;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#04649C] dark:text-[#24A4EC]">
                        {item.batchNumber}
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                        {item.expiryDate}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-rose-500">
                        {item.daysUntilExpiry} days
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.quantityRemaining} units
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isUrgent
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}>
                          {isUrgent ? 'URGENT FEFO' : 'EXPIRING SOON'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => router.push('/pos/sell')}
                          className="px-3 py-1 bg-[#04649C]/10 hover:bg-[#04649C]/20 text-[#04649C] dark:text-[#24A4EC] rounded-xl font-bold text-[11px] transition-all"
                        >
                          Dispense in POS
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
