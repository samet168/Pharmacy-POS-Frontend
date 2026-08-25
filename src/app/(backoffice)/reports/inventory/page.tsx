'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Warehouse, AlertTriangle, Search, CheckCircle2, DollarSign } from 'lucide-react';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';

export default function InventoryReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalStockQuantity, setTotalStockQuantity] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      const orgId = currentUser?.organizationId || user?.organizationId;
      if (!orgId) return;

      setLoading(true);
      try {
        const res = await reportsApi.getInventoryReport({ organizationId: orgId });
        if (res) {
          setTotalStockValue((res as any).totalStockValue || 0);
          setTotalStockQuantity((res as any).totalStockQuantity || 0);
          setLowStockCount((res as any).lowStockCount || 0);
          if ((res as any).branchStocks) {
            setData((res as any).branchStocks);
          }
        }
      } catch (error) {
        console.error('Failed to load inventory report', error);
        toast.error('Failed to load inventory report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(i =>
    (i.name || i.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.batchNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Branch Name', 'Total Products', 'Stock Value ($)', 'Low Stock Count'];
    const rows = filteredData.map((i) => [
      i.branchName || '',
      i.totalProducts || 0,
      (i.stockValue || 0).toFixed(2),
      i.lowStockCount || 0,
    ]);
    exportToCSV('Pharmacy_Inventory_Valuation_Report', headers, rows);
    toast.success('Inventory report exported to CSV successfully!');
  };


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={6} tableCols={5} />;
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Inventory Valuation &amp; Stock Health Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Current stock quantities, batch tracking, low stock alerts, and total warehouse inventory value.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportDropdown
            filename="Pharmacy_Inventory_Valuation_Report"
            title="Inventory Valuation & Stock Health Report"
            subtitle="Warehouse Inventory & Branch Stock Breakdown"
            headers={['Branch Name', 'Total Products', 'Stock Value ($)', 'Low Stock Count']}
            rows={filteredData.map((i) => [
              i.branchName || '',
              `${i.totalProducts || 0} products`,
              `$${(i.stockValue || 0).toFixed(2)}`,
              `${i.lowStockCount || 0} low stock`,
            ])}
            buttonVariant="primary"
            buttonText="Export Inventory"
          />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Stocked Quantity</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalStockQuantity} items
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Valuation Asset</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Stock Alerts (Low/Expiry)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {lowStockCount} items needing reorder
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by SKU, medication name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Inventory Breakdown Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Branch Stock Valuation Breakdown</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Branch Name</TableHeader>
                <TableHeader className="text-right">Total Products</TableHeader>
                <TableHeader className="text-right">Total Stock Value ($)</TableHeader>
                <TableHeader className="text-right">Low Stock Items</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((i: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{i.branchName || `Branch #${idx+1}`}</TableCell>
                    <TableCell className="text-right font-semibold">{i.totalProducts || 0}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">${(i.stockValue || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400">{i.lowStockCount || 0}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No branch inventory valuation records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
