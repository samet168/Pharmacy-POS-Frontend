'use client';

import { useState, useEffect } from 'react';
import { rolesApi } from '@/lib/api/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isSystemRole: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [page, pageSize]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.listAll().catch(() => []);
      setRoles(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rolesApi.create(formData);
      toast.success('Role created successfully');
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', isSystemRole: false });
      fetchRoles();
    } catch (error: any) {
      console.error('Failed to create role:', error);
      toast.error(error.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rolesApi.update(selectedRole.id, formData);
      toast.success('Role updated successfully');
      setIsEditModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await rolesApi.delete(selectedRole.id);
      toast.success('Role deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error(error.response?.data?.message || 'Failed to delete role');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      isSystemRole: role.isSystemRole,
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Roles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage user roles and permissions</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <Input
          placeholder="Search roles by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          shape="pill"
        />
      </Card>

      {/* Roles Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRoles.length > 0 ? (
                paginatedRoles.map((role: any) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {role.name}
                    </TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={role.isSystemRole ? 'warning' : 'success'}>
                        {role.isSystemRole ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(role)}
                          disabled={role.isSystemRole}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={role.isSystemRole}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Shield className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No roles found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Add your first role to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredRoles.length)} of {filteredRoles.length} roles
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
        title="Add New Role"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Role Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isSystemRole}
              onChange={(e) => setFormData({ ...formData, isSystemRole: e.target.checked })}
              className="w-4 h-4 text-bento-primary"
            />
            <span className="text-sm text-bento-primary dark:text-slate-100">System Role</span>
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
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Role"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Role Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isSystemRole}
              onChange={(e) => setFormData({ ...formData, isSystemRole: e.target.checked })}
              className="w-4 h-4 text-bento-primary"
              disabled={selectedRole?.isSystemRole}
            />
            <span className="text-sm text-bento-primary dark:text-slate-100">System Role</span>
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
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{selectedRole?.name}</strong>? This action cannot be undone.
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
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
