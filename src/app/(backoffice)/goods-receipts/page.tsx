'use client';

import { useState, useEffect } from 'react';
import { goodsReceiptsApi, purchaseOrdersApi, branchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Package, ChevronLeft, ChevronRight, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';

export default function GoodsReceiptsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;
  
  const [receipts, setReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    branchId: branchId.toString(),
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsData, ordersData, branchesData] = await Promise.all([
        goodsReceiptsApi.getByOrganization(organizationId, { page: page - 1, size: pageSize, branchId }).catch(() => ({ content: [] })),
        purchaseOrdersApi.listAll().catch(() => []),
        branchesApi.listAll().catch(() => []),
      ]);
      const receiptsArray = Array.isArray(receiptsData) ? receiptsData : (receiptsData?.content || []);
      setReceipts(receiptsArray);
      setPurchaseOrders(ordersData);
      setBranches(branchesData);
      setTotalPages(receiptsData?.totalPages || Math.ceil(receiptsArray.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load goods receipts');
    } finally {
      setLoading(false);
    }
  };

  const getPONumber = (poId: number) => {
    const po = purchaseOrders.find((p: any) => p.id === poId);
    return po?.orderNumber || `PO #${poId}`;
  };

  const getBranchName = (branchId: number) => {
    const branch = branches.find((b: any) => b.id === branchId);
    return branch?.name || `Branch #${branchId}`;
  };

  const filteredReceipts = receipts.filter((receipt: any) =>
    receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPONumber(receipt.purchaseOrderId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBranchName(receipt.branchId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedReceipts = filteredReceipts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await goodsReceiptsApi.create({
        ...formData,
        purchaseOrderId: parseInt(formData.purchaseOrderId),
        branchId: parseInt(formData.branchId),
      });
      toast.success('Goods receipt created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        purchaseOrderId: '',
        branchId: '',
        receivedDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create goods receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to create goods receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await goodsReceiptsApi.update(selectedReceipt.id, {
        ...formData,
        purchaseOrderId: parseInt(formData.purchaseOrderId),
        branchId: parseInt(formData.branchId),
      });
      toast.success('Goods receipt updated successfully');
      setIsEditModalOpen(false);
      setSelectedReceipt(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to update goods receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to update goods receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await goodsReceiptsApi.delete(selectedReceipt.id);
      toast.success('Goods receipt deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedReceipt(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete goods receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to delete goods receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (receipt: any) => {
    setSelectedReceipt(receipt);
    setFormData({
      purchaseOrderId: receipt.purchaseOrderId.toString(),
      branchId: receipt.branchId.toString(),
      receivedDate: receipt.receivedDate.split('T')[0],
      notes: receipt.notes || '',
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={300} height={20} />
          </div>
          <LoadingSkeleton variant="rectangular" width={180} height={40} />
        </div>
        <Card className="p-6">
          <LoadingSkeleton variant="rectangular" width="100%" height={40} />
          <TableSkeleton rows={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Goods Receipts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage incoming goods from suppliers</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goods Receipt
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search goods receipts by receipt number, PO, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="px-4 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100">
              <option>All Branches</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Goods Receipts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Receipt Number</TableHeader>
                <TableHeader>Purchase Order</TableHeader>
                <TableHeader>Branch</TableHeader>
                <TableHeader>Received Date</TableHeader>
                <TableHeader>Received By</TableHeader>
                <TableHeader>Notes</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReceipts.length > 0 ? (
                paginatedReceipts.map((receipt: any) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell>{getPONumber(receipt.purchaseOrderId)}</TableCell>
                    <TableCell>{getBranchName(receipt.branchId)}</TableCell>
                    <TableCell>{new Date(receipt.receivedDate).toLocaleDateString()}</TableCell>
                    <TableCell>User #{receipt.receivedBy}</TableCell>
                    <TableCell className="max-w-xs truncate">{receipt.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(receipt)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No goods receipts found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Create your first goods receipt to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredReceipts.length)} of {filteredReceipts.length} goods receipts
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
        title="New Goods Receipt"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Purchase Order *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.purchaseOrderId}
              onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
              required
            >
              <option value="">Select Purchase Order</option>
              {purchaseOrders.map((po: any) => (
                <option key={po.id} value={po.id}>{po.orderNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Branch *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Received Date *"
            type="date"
            value={formData.receivedDate}
            onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Notes</label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
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
              Create Goods Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Goods Receipt"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Purchase Order *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.purchaseOrderId}
              onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
              required
            >
              <option value="">Select Purchase Order</option>
              {purchaseOrders.map((po: any) => (
                <option key={po.id} value={po.id}>{po.orderNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Branch *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Received Date *"
            type="date"
            value={formData.receivedDate}
            onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Notes</label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
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
              Update Goods Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Goods Receipt"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{selectedReceipt?.receiptNumber}</strong>? This action cannot be undone.
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
              Delete Goods Receipt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}