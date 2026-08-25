'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { FileText, Download, Calendar, Filter, ChevronLeft, ChevronRight, Printer, Sparkles, TrendingUp, BarChart3, ShoppingBag, Package, Users, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import Link from 'next/link';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('today');
  const [generating, setGenerating] = useState(false);

  const reportModules = [
    { id: 1, name: 'Sales Performance', type: 'sales', href: '/reports/sales', icon: ShoppingBag, description: 'Daily revenue, net profits & order velocity', color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 2, name: 'Product Velocity', type: 'products', href: '/reports/products', icon: Package, description: 'Top selling medications & profit margins', color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 3, name: 'Customer Analytics', type: 'customers', href: '/reports/customers', icon: Users, description: 'Patient lifetime value & repeat purchases', color: 'text-blue-500 bg-blue-500/10' },
    { id: 4, name: 'Procurement Purchases', type: 'purchases', href: '/reports/purchases', icon: Truck, description: 'Supplier purchase orders & goods received', color: 'text-amber-500 bg-amber-500/10' },
    { id: 5, name: 'Inventory Valuation', type: 'inventory', href: '/reports/inventory', icon: BarChart3, description: 'Stock asset valuation & low stock alerts', color: 'text-rose-500 bg-rose-500/10' },
  ];

  const mockReportData = [
    { id: 1, date: '2026-08-24', totalSales: 2450.00, totalOrders: 18, avgOrderValue: 136.11 },
    { id: 2, date: '2026-08-23', totalSales: 3120.00, totalOrders: 24, avgOrderValue: 130.00 },
    { id: 3, date: '2026-08-22', totalSales: 1890.00, totalOrders: 15, avgOrderValue: 126.00 },
    { id: 4, date: '2026-08-21', totalSales: 2750.00, totalOrders: 20, avgOrderValue: 137.50 },
    { id: 5, date: '2026-08-20', totalSales: 2080.00, totalOrders: 16, avgOrderValue: 130.00 },
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success('Business report generated successfully!');
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <LoadingSkeleton variant="text" width={240} height={36} />
        <Card className="p-8"><LoadingSkeleton variant="rectangular" width="100%" height={250} /></Card>
      </div>
    );
  }


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={6} tableCols={5} />;
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Business Intelligence &amp; Analytics Reports
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Comprehensive financial, sales, inventory valuation, and supplier procurement reporting dashboards.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportDropdown
            filename="Pharmacy_Business_Intelligence_Report"
            title="Business Analytics Master Report"
            headers={['ID', 'Date', 'Total Sales ($)', 'Total Orders', 'Avg Order Value ($)']}
            rows={mockReportData.map(r => [
              r.id,
              r.date,
              r.totalSales.toFixed(2),
              r.totalOrders,
              r.avgOrderValue.toFixed(2),
            ])}
            buttonVariant="outline"
            buttonSize="sm"
            buttonText="Export Master CSV"
          />
          <Button variant="outline" size="sm" onClick={handlePrintReport} className="flex items-center gap-1.5 text-xs font-bold">
            <Printer className="h-4 w-4" /> Print Summary
          </Button>
          <Button variant="primary" size="sm" onClick={handleGenerateReport} disabled={generating} className="flex items-center gap-2 font-bold shadow-md">
            <FileText className="h-4 w-4" /> {generating ? 'Generating...' : 'Run Analytics'}
          </Button>
        </div>
      </div>

      {/* Reports Directory Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.id} href={mod.href}>
              <Card className="p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-2xl ${mod.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="info">
                    Module
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">{mod.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Filters Bar */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Time Horizon</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pharmacy Outlet</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Pharmacy Outlets (HQ & Branches)</option>
              <option value="1">Main Pharmacy Branch (HQ)</option>
              <option value="2">Downtown Outlet Branch</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Executive Summary Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Executive Financial Summary Table</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader className="text-right">Total Revenue ($)</TableHeader>
                <TableHeader className="text-right">Total Orders</TableHeader>
                <TableHeader className="text-right">Average Order Value ($)</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockReportData.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.date}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">${row.totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">{row.totalOrders}</TableCell>
                  <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">${row.avgOrderValue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}