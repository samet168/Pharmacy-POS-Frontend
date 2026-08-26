'use client';

import { useState, useEffect } from 'react';
import { productBatchesApi, productsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Warehouse, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';
import { ExportDropdown } from '@/components/ui/ExportDropdown';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;
  
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [formData, setFormData] = useState({
    organizationId,
    branchId,
    productId: '',
    batchNumber: '',
    expiryDate: '',
    costPrice: '',
    quantityReceived: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, organizationId, branchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesData, productsData] = await Promise.all([
        productBatchesApi.getByBranch(branchId),
        productsApi.listAll(),
      ]);
      
      // Handle paginated responses
      const batchesArray = Array.isArray(batchesData) ? batchesData : (batchesData?.content || []);
      const productsArray = Array.isArray(productsData) ? productsData : (productsData?.content || []);
      
      setBatches(batchesArray);
      setProducts(productsArray);
      setTotalPages(Math.ceil(batchesArray.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error('Failed to load inventory data. Please try again.');
      setProducts([]);
      setBatches([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter((batch: any) =>
    batch.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    products.find((p: any) => p.id === batch.productId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedBatches = filteredBatches.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productBatchesApi.create({
        ...formData,
        organizationId,
        branchId,
        productId: parseInt(formData.productId),
        costPrice: parseFloat(formData.costPrice),
        quantityReceived: parseInt(formData.quantityReceived),
      });
      toast.success('Batch created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        organizationId,
        branchId,
        productId: '',
        batchNumber: '',
        expiryDate: '',
        costPrice: '',
        quantityReceived: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create batch:', error);
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await productBatchesApi.delete(selectedBatch.id);
      toast.success('Batch deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete batch:', error);
      toast.error(error.response?.data?.message || 'Failed to delete batch');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { text: 'Expired', color: 'danger' };
    if (days <= 30) return { text: 'Expiring Soon', color: 'warning' };
    if (days <= 90) return { text: 'Near Expiry', color: 'info' };
    return { text: 'Good', color: 'success' };
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Stock Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage product batches and stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Pharmacy_Stock_Inventory_Batches"
            title="Stock Inventory & Product Batches"
            subtitle="Batch Tracking, Expiry Dates & Stock Levels"
            headers={['Batch Number', 'Product Name', 'Cost Price ($)', 'Qty Received', 'Expiry Date', 'Status']}
            rows={filteredBatches.map((b) => [
              b.batchNumber,
              b.product?.name || `Product #${b.productId}`,
              `$${Number(b.costPrice || 0).toFixed(2)}`,
              b.quantityReceived || 0,
              b.expiryDate || '',
              getDaysUntilExpiry(b.expiryDate).text,
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Inventory"
          />
          <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <Input
          placeholder="Search by batch number or product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          shape="pill"
        />
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Product</TableHeader>
                <TableHeader>Batch Number</TableHeader>
                <TableHeader>Expiry Date</TableHeader>
                <TableHeader>Days Until Expiry</TableHeader>
                <TableHeader>Cost Price</TableHeader>
                <TableHeader>Received</TableHeader>
                <TableHeader>Remaining</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBatches.length > 0 ? (
                paginatedBatches.map((batch: any) => {
                  const product = products.find((p: any) => p.id === batch.productId);
                  const expiryStatus = getExpiryStatus(batch.expiryDate);
                  const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
                  
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                        {product?.name || 'Unknown Product'}
                      </TableCell>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${daysUntilExpiry < 0 ? 'text-bento-pink-text' : daysUntilExpiry <= 30 ? 'text-orange-500' : 'text-slate-600 dark:text-slate-400'}`}>
                          {daysUntilExpiry} days
                        </span>
                      </TableCell>
                      <TableCell>${batch.costPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{batch.quantityReceived || 0}</TableCell>
                      <TableCell>{batch.quantityRemaining || 0}</TableCell>
                      <TableCell>
                        <Badge variant={expiryStatus.color as any}>
                          {expiryStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Warehouse className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No batches found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Add your first batch to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredBatches.length)} of {filteredBatches.length} batches
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
        title="Add New Batch"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Product</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Batch Number *"
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            required
          />
          <Input
            label="Expiry Date *"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />
          <Input
            label="Cost Price *"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            required
          />
          <Input
            label="Quantity Received *"
            type="number"
            value={formData.quantityReceived}
            onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
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
              Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Batch"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete batch <strong>{selectedBatch?.batchNumber}</strong>? This action cannot be undone.
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
              Delete Batch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
