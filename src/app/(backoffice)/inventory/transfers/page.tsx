'use client';

import { useState, useEffect } from 'react';
import { stockTransfersApi, branchesApi, productsApi, productBatchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, ArrowLeftRight, Send, Download, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';

export default function StockTransfersPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;
  
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [formData, setFormData] = useState({
    fromBranchId: '',
    toBranchId: '',
    productId: '',
    batchId: '',
    quantity: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transfersData, branchesData, productsData, batchesData] = await Promise.all([
        stockTransfersApi.getByOrganization(organizationId, { page: page - 1, size: pageSize }).catch(() => ({ content: [] })),
        branchesApi.listAll().catch(() => []),
        productsApi.listAll().catch(() => []),
        productBatchesApi.listAll().catch(() => []),
      ]);
      const transfersArray = Array.isArray(transfersData) ? transfersData : (transfersData?.content || []);
      setTransfers(transfersArray);
      setBranches(branchesData);
      setProducts(productsData);
      setBatches(batchesData);
      setTotalPages(transfersData?.totalPages || Math.ceil(transfersArray.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (id: number) => {
    const branch = branches.find(b => b.id === id);
    return branch?.name || `Branch #${id}`;
  };

  const getProductName = (id: number) => {
    const product = products.find(p => p.id === id);
    return product?.name || `Product #${id}`;
  };

  const getBatchNumber = (id: number) => {
    const batch = batches.find(b => b.id === id);
    return batch?.batchNumber || `Batch #${id}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'IN_TRANSIT': return 'info';
      case 'RECEIVED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch =
      getProductName(transfer.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBranchName(transfer.fromBranchId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBranchName(transfer.toBranchId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedTransfers = filteredTransfers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await stockTransfersApi.create({
        ...formData,
        fromBranchId: parseInt(formData.fromBranchId),
        toBranchId: parseInt(formData.toBranchId),
        productId: parseInt(formData.productId),
        batchId: parseInt(formData.batchId),
        quantity: parseInt(formData.quantity),
        organizationId,
      });
      toast.success('Stock transfer created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        fromBranchId: '',
        toBranchId: '',
        productId: '',
        batchId: '',
        quantity: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to create stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await stockTransfersApi.update(selectedTransfer.id, {
        ...formData,
        fromBranchId: parseInt(formData.fromBranchId),
        toBranchId: parseInt(formData.toBranchId),
        productId: parseInt(formData.productId),
        batchId: parseInt(formData.batchId),
        quantity: parseInt(formData.quantity),
        organizationId,
      });
      toast.success('Stock transfer updated successfully');
      setIsEditModalOpen(false);
      setSelectedTransfer(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to update transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to update stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await stockTransfersApi.delete(selectedTransfer.id);
      toast.success('Stock transfer deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedTransfer(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to delete stock transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id: number) => {
    try {
      await stockTransfersApi.dispatch(id);
      toast.success('Transfer dispatched successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to dispatch transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to dispatch transfer');
    }
  };

  const handleReceive = async (id: number) => {
    try {
      await stockTransfersApi.receive(id);
      toast.success('Transfer received successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to receive transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to receive transfer');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await stockTransfersApi.cancel(id);
      toast.success('Transfer cancelled successfully');
      fetchData();
    } catch (error: any) {
      console.error('Failed to cancel transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel transfer');
    }
  };

  const openEditModal = (transfer: any) => {
    setSelectedTransfer(transfer);
    setFormData({
      fromBranchId: transfer.fromBranchId.toString(),
      toBranchId: transfer.toBranchId.toString(),
      productId: transfer.productId.toString(),
      batchId: transfer.batchId.toString(),
      quantity: transfer.quantity.toString(),
    });
    setIsEditModalOpen(true);
  };

  const getAvailableBatches = (branchId: string, productId: string) => {
    return batches.filter(
      (b: any) => b.branchId === parseInt(branchId) && b.productId === parseInt(productId) && b.quantityRemaining > 0
    );
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Stock Transfers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage inventory transfers between branches</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Transfer
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search transfers by product, from branch, or to branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-4 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transfers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Product</TableHeader>
                <TableHeader>Batch</TableHeader>
                <TableHeader>From Branch</TableHeader>
                <TableHeader>To Branch</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransfers.length > 0 ? (
                paginatedTransfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {getProductName(transfer.productId)}
                    </TableCell>
                    <TableCell>{getBatchNumber(transfer.batchId)}</TableCell>
                    <TableCell>{getBranchName(transfer.fromBranchId)}</TableCell>
                    <TableCell>{getBranchName(transfer.toBranchId)}</TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(transfer.status)}>
                        {transfer.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {transfer.status === 'PENDING' && (
                          <>
                            <button
                              className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => handleDispatch(transfer.id)}
                              title="Dispatch"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                              onClick={() => openEditModal(transfer)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                              onClick={() => handleCancel(transfer.id)}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {transfer.status === 'IN_TRANSIT' && (
                          <>
                            <button
                              className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400"
                              onClick={() => handleReceive(transfer.id)}
                              title="Receive"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                              onClick={() => handleCancel(transfer.id)}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {transfer.status === 'RECEIVED' && (
                          <button
                            className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                            title="Completed"
                          >
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </button>
                        )}
                        {transfer.status === 'CANCELLED' && (
                          <button
                            className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <ArrowLeftRight className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No transfers found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Create your first transfer to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-bento-gray dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredTransfers.length)} of {filteredTransfers.length} transfers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Stock Transfer"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">From Branch *</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.fromBranchId}
                onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value, productId: '', batchId: '' })}
                required
              >
                <option value="">Select Source Branch</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">To Branch *</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.toBranchId}
                onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                required
              >
                <option value="">Select Destination Branch</option>
                {branches
                  .filter((b: any) => b.id !== parseInt(formData.fromBranchId))
                  .map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Product *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value, batchId: '' })}
              required
              disabled={!formData.fromBranchId}
            >
              <option value="">Select Product</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Batch *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              required
              disabled={!formData.productId}
            >
              <option value="">Select Batch</option>
              {getAvailableBatches(formData.fromBranchId, formData.productId).map((batch: any) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} (Available: {batch.quantityRemaining})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity *"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsCreateModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Create Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Stock Transfer"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">From Branch *</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.fromBranchId}
                onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value, productId: '', batchId: '' })}
                required
              >
                <option value="">Select Source Branch</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">To Branch *</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.toBranchId}
                onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                required
              >
                <option value="">Select Destination Branch</option>
                {branches
                  .filter((b: any) => b.id !== parseInt(formData.fromBranchId))
                  .map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Product *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value, batchId: '' })}
              required
              disabled={!formData.fromBranchId}
            >
              <option value="">Select Product</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Batch *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              required
              disabled={!formData.productId}
            >
              <option value="">Select Batch</option>
              {getAvailableBatches(formData.fromBranchId, formData.productId).map((batch: any) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} (Available: {batch.quantityRemaining})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity *"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsEditModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Update Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Stock Transfer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this stock transfer? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsDeleteModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              shape="pill"
              loading={submitting}
              onClick={handleDelete}
            >
              Delete Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
