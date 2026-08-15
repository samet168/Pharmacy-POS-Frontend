'use client';

import { useState, useEffect } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Eye, Filter, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    sku: '',
    costPrice: '',
    sellingPrice: '',
    categoryId: '',
    defaultSupplierId: '',
    isControlledSubstance: false,
    isActive: true,
    imageFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        productsApi.getByOrganization(organizationId, page - 1, pageSize),
        categoriesApi.getByOrganization(organizationId, 0, 100),
        suppliersApi.getByOrganization(organizationId, 0, 100),
      ]);
      const productsArray = Array.isArray(productsData) ? productsData : (productsData?.content || []);
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.content || []);
      const suppliersArray = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.content || []);
      setProducts(productsArray);
      setCategories(categoriesArray);
      setSuppliers(suppliersArray);
      setTotalPages(productsData?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load products data. Please try again.');
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedProducts = filteredProducts;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const { imageFile, ...dataToSend } = formData;
      await productsApi.create({
        ...dataToSend,
        organizationId,
        minStockAlert: 10, // Default minimum stock
      }, imageFile || undefined);
      toast.success('Product created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        brandName: '',
        sku: '',
        costPrice: '',
        sellingPrice: '',
        categoryId: '',
        defaultSupplierId: '',
        isControlledSubstance: false,
        isActive: true,
        imageFile: null,
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const { imageFile, ...dataToSend } = formData;
      await productsApi.update(selectedProduct.id, {
        ...dataToSend,
        organizationId,
        minStockAlert: selectedProduct.minStockAlert || 10,
      }, imageFile || undefined);
      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to update product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await productsApi.delete(selectedProduct.id);
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      brandName: product.brandName,
      sku: product.sku || '',
      costPrice: '', // These fields are not in ProductResponse
      sellingPrice: '',
      categoryId: product.categoryId?.toString() || '',
      defaultSupplierId: product.defaultSupplierId?.toString() || '',
      isControlledSubstance: product.isControlledSubstance,
      isActive: product.isActive,
      imageFile: null,
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
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your pharmacy products and inventory</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products by name, barcode, or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <select className="px-4 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100">
              <option>All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Image</TableHeader>
                <TableHeader>Brand Name</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Supplier</TableHeader>
                <TableHeader>Min Stock</TableHeader>
                <TableHeader>Controlled</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.brandName} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-bento-gray dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {product.brandName?.charAt(0)?.toUpperCase() || 'P'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {product.brandName}
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{categories.find((c: any) => c.id === product.categoryId)?.name || '-'}</TableCell>
                    <TableCell>{suppliers.find((s: any) => s.id === product.defaultSupplierId)?.name || '-'}</TableCell>
                    <TableCell>{product.minStockAlert || '-'}</TableCell>
                    <TableCell>
                      {product.isControlledSubstance ? (
                        <Badge variant="danger">Yes</Badge>
                      ) : (
                        <Badge variant="success">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'success' : 'danger'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedProduct(product);
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
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No products found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Add your first product to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length} products
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
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Brand Name *"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              required
            />
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Category</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Supplier</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.defaultSupplierId}
                onChange={(e) => setFormData({ ...formData, defaultSupplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup: any) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isControlledSubstance}
                onChange={(e) => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
                className="w-4 h-4 text-bento-primary"
              />
              <span className="text-sm text-bento-primary dark:text-slate-100">Controlled Substance</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-bento-primary"
              />
              <span className="text-sm text-bento-primary dark:text-slate-100">Active</span>
            </label>
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
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
            />
            {selectedProduct?.imageUrl && (
              <div className="mt-2">
                <img src={selectedProduct.imageUrl} alt="Current product image" className="w-20 h-20 rounded-lg object-cover" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Brand Name *"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              required
            />
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Category</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Supplier</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.defaultSupplierId}
                onChange={(e) => setFormData({ ...formData, defaultSupplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup: any) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isControlledSubstance}
                onChange={(e) => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
                className="w-4 h-4 text-bento-primary"
              />
              <span className="text-sm text-bento-primary dark:text-slate-100">Controlled Substance</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-bento-primary"
              />
              <span className="text-sm text-bento-primary dark:text-slate-100">Active</span>
            </label>
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
              Update Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
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
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}