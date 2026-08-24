'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { paymentsApi, Payment } from '@/lib/api/payments';
import { CreditCard, DollarSign, Search, Filter, Download, RefreshCw, Eye } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

import { exportToCSV } from '@/lib/utils/exportUtils';

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const handleExportPayments = () => {
    if (filteredPayments.length === 0) {
      toast.error('No payments data to export.');
      return;
    }
    const headers = ['Payment ID', 'Order ID', 'Amount ($)', 'Payment Method', 'Ref Number', 'Date'];
    const rows = filteredPayments.map((p) => [
      p.id,
      p.orderId,
      p.amount,
      p.paymentMethod,
      p.referenceNumber || '',
      p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-US') : '',
    ]);
    exportToCSV('Pharmacy_POS_Payments_Export', headers, rows);
    toast.success('Payments list exported as CSV successfully!');
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsApi.getByOrganization(organizationId, { branchId });
      const paymentsArray = Array.isArray(data) ? data : (data?.content || []);
      setPayments(paymentsArray);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toString().includes(searchTerm);
    
    const matchesMethod = filterMethod === 'ALL' || payment.paymentMethod === filterMethod;
    
    return matchesSearch && matchesMethod;
  });

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'CASH': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'KHQR': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'CARD': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'CREDIT': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'BANK_TRANSFER': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      'WALLET': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[method] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            Payments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track all payment transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchPayments}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPayments}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <DollarSign className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Payments</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {payments.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Card Payments</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {payments.filter(p => p.paymentMethod === 'CARD').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cash Payments</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {payments.filter(p => p.paymentMethod === 'CASH').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by reference or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {showFilters && (
            <div className="flex gap-2">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-4 py-2 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="KHQR">KHQR</option>
                <option value="CARD">Card</option>
                <option value="CREDIT">Credit</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description={
              searchTerm || filterMethod !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'No payments have been recorded yet'
            }
            action={
              !searchTerm && filterMethod === 'ALL' && (
                <Button onClick={fetchPayments}>Refresh Data</Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Payment ID</TableHeader>
                  <TableHeader>Order ID</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Reference</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>#{payment.orderId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.referenceNumber || '-'}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info('View payment details - Coming soon')}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
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