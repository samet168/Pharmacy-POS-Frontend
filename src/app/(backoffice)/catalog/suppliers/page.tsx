'use client';

import { useState, useEffect } from 'react';
import { suppliersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Filter, Download, Printer, MoreHorizontal, Edit, Trash2, Eye, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get organizationId from auth store
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  // Form state
  const [formData, setFormData] = useState({
    organizationId: organizationId,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    active: true
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersApi.listAll();
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setSuppliers(dataArray);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast.error('Failed to load suppliers. Please try again.');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && supplier.active) ||
      (filterStatus === 'inactive' && !supplier.active);
    
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    toast.success('Exporting CSV...');
  };

  const handlePrint = () => {
    toast.success('Printing suppliers list...');
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await suppliersApi.create(formData);
      toast.success('Supplier created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to create supplier:', error);
      toast.error('Failed to create supplier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      await suppliersApi.update(selectedSupplier.id, formData);
      toast.success('Supplier updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast.error('Failed to update supplier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await suppliersApi.delete(selectedSupplier.id);
      toast.success('Supplier deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('Failed to delete supplier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      organizationId: supplier.organizationId || organizationId,
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      active: supplier.active !== undefined ? supplier.active : true
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      organizationId: organizationId,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      active: true
    });
    setSelectedSupplier(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bento-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Suppliers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage product suppliers and vendor information</p>
        </div>
        <Button 
          variant="primary" 
          shape="pill" 
          size="md"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder="Search suppliers by name, contact, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>

          {/* Filter Badges */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-bento-primary text-white' 
                  : 'bg-bento-bg dark:bg-slate-800 text-bento-primary dark:text-slate-100 hover:bg-bento-gray dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                filterStatus === 'active' 
                  ? 'bg-bento-primary text-white' 
                  : 'bg-bento-bg dark:bg-slate-800 text-bento-primary dark:text-slate-100 hover:bg-bento-gray dark:hover:bg-slate-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                filterStatus === 'inactive' 
                  ? 'bg-bento-primary text-white' 
                  : 'bg-bento-bg dark:bg-slate-800 text-bento-primary dark:text-slate-100 hover:bg-bento-gray dark:hover:bg-slate-700'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              shape="pill"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button
              variant="outline"
              shape="pill"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Modern Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="rounded-bento">
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Contact Person</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Address</TableHeader>
                <TableHeader>Tax ID</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{supplier.address || '-'}</TableCell>
                    <TableCell>{supplier.taxId || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.active ? 'success' : 'danger'}>
                        {supplier.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => openDeleteModal(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No suppliers found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search or filters' : 'Add your first supplier to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Supplier' : 'Add New Supplier'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter supplier name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Person
            </label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tax ID
            </label>
            <Input
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="Enter tax ID"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-bento-primary focus:ring-bento-primary"
            />
            <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={isEditModalOpen ? handleUpdate : handleCreate}
              disabled={submitting || !formData.name || !formData.phone}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSupplier(null);
        }}
        title="Delete Supplier"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete supplier <strong>{selectedSupplier?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedSupplier(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Supplier'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}