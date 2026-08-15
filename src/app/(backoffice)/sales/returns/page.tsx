'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { orderReturnsApi, OrderReturn } from '@/lib/api/orderReturns';
import { RotateCcw, Search, Filter, Download, RefreshCw, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

export default function ReturnsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<OrderReturn | null>(null);
  const [createFormData, setCreateFormData] = useState({
    orderId: '',
    reason: '',
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      // Since the API doesn't have a list all endpoint, we'll need to get returns by order
      // For now, we'll use an empty array and the user can search by order ID
      setReturns([]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleSearchByOrder = async () => {
    if (!createFormData.orderId) {
      toast.error('Please enter an order ID');
      return;
    }

    try {
      setLoading(true);
      const data = await orderReturnsApi.getByOrder(parseInt(createFormData.orderId));
      setReturns(data);
      toast.success(`Found ${data.length} return(s) for order #${createFormData.orderId}`);
    } catch (error) {
      handleApiError(error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!createFormData.orderId || !createFormData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await orderReturnsApi.create({
        orderId: parseInt(createFormData.orderId),
        reason: createFormData.reason,
        items: [], // Items would be selected in a more detailed form
      });
      toast.success('Return request submitted successfully');
      setShowCreateModal(false);
      setCreateFormData({ orderId: '', reason: '' });
      handleSearchByOrder();
    } catch (error) {
      handleApiError(error);
    }
  };

  const filteredReturns = returns.filter(ret => 
    ret.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.orderId.toString().includes(searchTerm)
  );

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
            Returns
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage product returns and refunds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchReturns}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Return
          </Button>
        </div>
      </div>

      {/* Search by Order */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by order ID to find returns..."
              value={createFormData.orderId}
              onChange={(e) => setCreateFormData({ ...createFormData, orderId: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearchByOrder} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </Card>

      {/* Returns Table */}
      <Card className="overflow-hidden">
        {filteredReturns.length === 0 ? (
          <EmptyState
            title="No returns found"
            description={
              searchTerm
                ? 'Try adjusting your search or search by order ID'
                : 'Search by order ID to find returns, or create a new return'
            }
            action={
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Return
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Return ID</TableHeader>
                  <TableHeader>Order ID</TableHeader>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Return Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-medium">#{ret.id}</TableCell>
                    <TableCell>#{ret.orderId}</TableCell>
                    <TableCell className="max-w-xs truncate">{ret.reason}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(ret.totalAmount)}</TableCell>
                    <TableCell>{formatDate(ret.returnDate)}</TableCell>
                    <TableCell>
                      {ret.approvedBy ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <XCircle className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(ret);
                            setShowViewModal(true);
                          }}
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

      {/* Create Return Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Return"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Order ID *
            </label>
            <Input
              placeholder="Enter order ID"
              value={createFormData.orderId}
              onChange={(e) => setCreateFormData({ ...createFormData, orderId: e.target.value })}
              type="number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Return Reason *
            </label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={4}
              placeholder="Explain why the customer wants to return the items..."
              value={createFormData.reason}
              onChange={(e) => setCreateFormData({ ...createFormData, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateReturn} className="flex-1 flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Submit Return
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Return Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Return #${selectedReturn?.id}`}
      >
        {selectedReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Order ID</p>
                <p className="font-medium text-bento-primary dark:text-slate-100">#{selectedReturn.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Return Date</p>
                <p className="font-medium text-bento-primary dark:text-slate-100">
                  {formatDate(selectedReturn.returnDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Refund Amount</p>
                <p className="font-medium text-bento-primary dark:text-slate-100">
                  {formatCurrency(selectedReturn.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <p className="font-medium">
                  {selectedReturn.approvedBy ? (
                    <span className="text-green-600 dark:text-green-400">Approved</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Pending</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Reason</p>
              <p className="text-bento-primary dark:text-slate-100">{selectedReturn.reason}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}