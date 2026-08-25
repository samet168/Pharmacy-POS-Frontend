'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Package, TrendingUp, DollarSign, Search, Award, Printer, ArrowUpRight } from 'lucide-react';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';

export default function ProductReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getProductReport({ organizationId: orgId, from: startDate, to: endDate });
      if (res) {
        setTotalProducts((res as any).totalProducts || 0);
        if ((res as any).topSellingProducts) {
          const topProducts = (res as any).topSellingProducts;
          setData(topProducts);
          setTotalRevenue(topProducts.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0));
        }
      }
    } catch (error) {
      console.error('Failed to load product report', error);
      toast.error('Failed to load product report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(p =>
    (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Units Sold', 'Total Revenue ($)', 'Profit ($)'];
    const rows = filteredData.map((p) => [
      p.productName || '',
      p.sku || '',
      p.quantitySold || 0,
      (p.revenue || 0).toFixed(2),
      (p.profit || 0).toFixed(2),
    ]);
    exportToCSV('Pharmacy_Product_Performance_Report', headers, rows);
    toast.success('Product report exported to CSV successfully!');
  };


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={6} tableCols={5} />;
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Product Performance &amp; Velocity Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Top-selling medications, sales volume breakdown, profit margins, and inventory turnover.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="flex items-center gap-1.5 text-xs">
            {loading ? <span className="animate-spin">↻</span> : null} Refresh
          </Button>
          <ExportDropdown
            filename="Pharmacy_Product_Performance_Report"
            title="Product Performance & Velocity Report"
            subtitle={`Period: ${startDate} to ${endDate}`}
            headers={['Product Name', 'SKU', 'Units Sold', 'Total Revenue ($)', 'Profit ($)']}
            rows={filteredData.map((p) => [
              p.productName || '',
              p.sku || '',
              p.quantitySold || 0,
              `$${(p.revenue || 0).toFixed(2)}`,
              `$${(p.profit || 0).toFixed(2)}`,
            ])}
            buttonVariant="primary"
            buttonText="Export Report"
          />
        </div>
      </div>

      {/* Date Range & Search Bar */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="primary" onClick={fetchReport} className="font-bold px-6">
            Filter
          </Button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Performing Products</span>
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalProducts}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Products Sales Value</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalRevenue.toFixed(2)}</span>
          </div>
        </Card>
      </div>

      {/* Product Velocity Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Top Selling Products Velocity Table</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Product Name</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader className="text-right">Units Sold</TableHeader>
                <TableHeader className="text-right">Total Revenue ($)</TableHeader>
                <TableHeader className="text-right">Profit Margin ($)</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((p: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{p.productName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell>
                    <TableCell className="text-right font-semibold">{p.quantitySold}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">${(p.revenue || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">${(p.profit || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No product performance data for this period.
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
