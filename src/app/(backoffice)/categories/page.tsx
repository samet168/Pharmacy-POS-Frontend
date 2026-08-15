'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '@/lib/api/categories';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameKh: '',
    parentId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [page, pageSize]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.listAll();
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setCategories(dataArray);
      setTotalPages(Math.ceil(dataArray.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories. Please try again.');
      setCategories([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.nameKh?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCategories = filteredCategories.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await categoriesApi.create({
        ...formData,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      });
      toast.success('Category created successfully');
      setIsCreateModalOpen(false);
      setFormData({ name: '', nameKh: '', parentId: '', active: true });
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await categoriesApi.update(selectedCategory.id, {
        ...formData,
        parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      });
      toast.success('Category updated successfully');
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await categoriesApi.delete(selectedCategory.id);
      toast.success('Category deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      nameKh: category.nameKh || '',
      parentId: category.parentId?.toString() || '',
      active: category.active,
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage product categories and organization</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <Input
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          shape="pill"
        />
      </Card>

      {/* Categories Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Name (Khmer)</TableHeader>
                <TableHeader>Parent Category</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.nameKh || '-'}</TableCell>
                    <TableCell>{category.parentName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={category.active ? 'success' : 'danger'}>
                        {category.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedCategory(category);
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
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No categories found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Add your first category to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredCategories.length)} of {filteredCategories.length} categories
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
        title="Add New Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Khmer Name"
            value={formData.nameKh}
            onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Parent Category</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">No Parent (Root Category)</option>
              {categories
                .filter((c: any) => c.id !== selectedCategory?.id)
                .map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
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
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Category"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Khmer Name"
            value={formData.nameKh}
            onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Parent Category</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">No Parent (Root Category)</option>
              {categories
                .filter((c: any) => c.id !== selectedCategory?.id)
                .map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
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
              Update Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{selectedCategory?.name}</strong>? This action cannot be undone.
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
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}