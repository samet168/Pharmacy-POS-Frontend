'use client';

import { useState, useEffect } from 'react';
import { branchesApi } from '@/lib/api/branches';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    managerId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [page, pageSize]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchesApi.listAll().catch(() => []);
      setBranches(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedBranches = filteredBranches.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await branchesApi.create({
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
        organizationId: 1, // TODO: Get from auth store
      });
      toast.success('Branch created successfully');
      setIsCreateModalOpen(false);
      setFormData({ name: '', address: '', phone: '', email: '', managerId: '', active: true });
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to create branch:', error);
      toast.error(error.response?.data?.message || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await branchesApi.update(selectedBranch.id, {
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
        organizationId: 1,
      });
      toast.success('Branch updated successfully');
      setIsEditModalOpen(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to update branch:', error);
      toast.error(error.response?.data?.message || 'Failed to update branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await branchesApi.delete(selectedBranch.id);
      toast.success('Branch deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (error: any) {
      console.error('Failed to delete branch:', error);
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (branch: any) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      managerId: branch.managerId?.toString() || '',
      active: branch.active,
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Branches</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage pharmacy branches and locations</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <Input
          placeholder="Search branches by name, address, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          shape="pill"
        />
      </Card>

      {/* Branches Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Address</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Manager ID</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBranches.length > 0 ? (
                paginatedBranches.map((branch: any) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {branch.name}
                    </TableCell>
                    <TableCell>{branch.address || '-'}</TableCell>
                    <TableCell>{branch.phone || '-'}</TableCell>
                    <TableCell>{branch.email || '-'}</TableCell>
                    <TableCell>{branch.managerId || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={branch.active ? 'success' : 'danger'}>
                        {branch.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedBranch(branch);
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
                      <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No branches found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Add your first branch to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredBranches.length)} of {filteredBranches.length} branches
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
        title="Add New Branch"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Branch Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="Manager ID"
            type="number"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-bento-primary"
            />
            <span className="text-sm text-bento-primary dark:text-slate-100">Active</span>
          </label>
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
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Branch"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Branch Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="Manager ID"
            type="number"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-bento-primary"
            />
            <span className="text-sm text-bento-primary dark:text-slate-100">Active</span>
          </label>
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
              Update Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Branch"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{selectedBranch?.name}</strong>? This action cannot be undone.
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
              Delete Branch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}