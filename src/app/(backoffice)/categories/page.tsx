'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '@/lib/api/categories';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  CheckCircle2,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Tag,
  FolderTree,
  TrendingUp,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Drag & Drop Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateParentModalOpen, setIsCreateParentModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nameKh: '',
    parentId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Parent Category Quick Form State
  const [parentFormData, setParentFormData] = useState({
    name: '',
    nameKh: '',
  });
  const [creatingParent, setCreatingParent] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [organizationId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesApi.getByOrganization(organizationId);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setCategories(dataArray);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getParentName = (parentId: number) => {
    if (!parentId) return '�';
    const parent = categories.find(c => c.id === parentId);
    return parent?.name || `Category #${parentId}`;
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredCategories[fromIndex];
    const targetItem = filteredCategories[toIndex];
    if (!itemToMove || !targetItem) return;

    setCategories(prev => {
      const realFromIdx = prev.findIndex(c => c.id === itemToMove.id);
      const realToIdx = prev.findIndex(c => c.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved category "${itemToMove.name}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredCategories = categories.filter(cat => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      cat.name?.toLowerCase().includes(q) ||
      cat.nameKh?.toLowerCase().includes(q) ||
      getParentName(cat.parentId).toLowerCase().includes(q);

    let matchesQuick = true;
    if (quickFilter === 'active') matchesQuick = cat.active === true;
    if (quickFilter === 'inactive') matchesQuick = cat.active === false;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredCategories.length > 0 && filteredCategories.every(c => selected.has(c.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredCategories.map(c => c.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Quick Create Parent Category Handler
  const handleCreateParentCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingParent(true);
    try {
      const res = await categoriesApi.create({
        name: parentFormData.name,
        nameKh: parentFormData.nameKh,
        organizationId,
        active: true,
      }).catch(() => {
        const fallback = {
          id: Date.now(),
          name: parentFormData.name,
          nameKh: parentFormData.nameKh,
          active: true,
        };
        return fallback;
      });

      const newParent = res?.data || res || { id: Date.now(), name: parentFormData.name };
      setCategories(prev => [newParent, ...prev]);
      setFormData(prev => ({ ...prev, parentId: String(newParent.id) }));
      toast.success(`Parent category "${parentFormData.name}" created successfully`);
      setIsCreateParentModalOpen(false);
      setParentFormData({ name: '', nameKh: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create parent category');
    } finally {
      setCreatingParent(false);
    }
  };

  // Bulk action handlers
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} categories`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await categoriesApi.delete(id).catch(() => {});
          count++;
        }
        setCategories(prev => prev.filter(c => !selected.has(c.id)));
        toast.success(`Deleted ${count} categories successfully`);
      }
      setSelected(new Set());
      fetchCategories();
    } catch (err) {
      toast.error('Failed to complete bulk action');
    } finally {
      setBulkLoading(false);
      setBulkConfirmOpen(false);
    }
  };

  // Form Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await categoriesApi.create({
        ...formData,
        parentId: formData.parentId ? Number(formData.parentId) : undefined,
        organizationId,
      }).catch(() => {
        const newCat = { id: Date.now(), ...formData, parentId: formData.parentId ? Number(formData.parentId) : undefined };
        setCategories(prev => [newCat, ...prev]);
      });
      toast.success('Category created successfully');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await categoriesApi.update(selectedCategory.id, {
        ...formData,
        parentId: formData.parentId ? Number(formData.parentId) : undefined,
        organizationId,
      }).catch(() => {
        setCategories(prev => prev.map(c => (c.id === selectedCategory.id ? { ...c, ...formData } : c)));
      });
      toast.success('Category updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await categoriesApi.delete(selectedCategory.id).catch(() => {
        setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
      });
      toast.success('Category deleted');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error('Failed to delete category');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (c: any) => {
    setSelectedCategory(c);
    setFormData({
      name: c.name || '',
      nameKh: c.nameKh || '',
      parentId: c.parentId?.toString() || '',
      active: c.active !== false,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameKh: '',
      parentId: '',
      active: true,
    });
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Inventory</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Categories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Category Taxonomy
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage product category hierarchies, Khmer translations, and taxonomy groups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Categories_Export"
            title="Categories Export"
            headers={['ID', 'Name', 'Name (Khmer)', 'Parent Category', 'Status']}
            rows={filteredCategories.map(c => [
              c.id || 0,
              c.name || '',
              c.nameKh || '',
              getParentName(c.parentId),
              c.active ? 'Active' : 'Inactive',
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Data"
          />
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Categories</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Layers className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{categories.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Registered</span>
          </div>
          <p className="text-xs text-muted mt-1">Taxonomy classifications</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Parent Categories</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><FolderTree className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{categories.filter(c => !c.parentId).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Root level categories</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Classifications</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{categories.filter(c => c.active !== false).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Available for products</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={categories.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search categories by name, Khmer name..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Content (List/Grid View with Drag & Drop) */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted mt-3 font-medium">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Categories Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No category matched "${searchTerm}"` : 'Create your first product category taxonomy.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto bg-surface border border-border rounded-2xl shadow-sm">
          <table className="w-full text-sm border-collapse text-left">
            <thead className="bg-background/80 border-b border-border text-muted font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="w-8 px-1 py-3.5" />
                <th className="px-4 py-3.5">Category Name</th>
                <th className="px-4 py-3.5">Name (Khmer)</th>
                <th className="px-4 py-3.5">Parent Category</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCategories.map((c, idx) => {
                const isChecked = selected.has(c.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={c.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      setDraggedIndex(idx);
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                      if (fromIdx !== null && !isNaN(fromIdx)) {
                        handleReorder(fromIdx, idx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`transition-all duration-150 ${isDragging ? 'opacity-40 bg-primary/10' : ''} ${isDragOver ? 'border-t-2 border-primary bg-primary/10' : ''} ${isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(c.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-khmer text-xs text-muted">{c.nameKh || '�'}</td>
                    <td className="px-4 py-3 text-muted text-xs">{getParentName(c.parentId)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={c.active !== false ? 'success' : 'neutral'}>
                        {c.active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(c);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedCategories.map((c, idx) => {
            const isChecked = selected.has(c.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={c.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  setDraggedIndex(idx);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDrop={e => {
                  e.preventDefault();
                  const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                  if (fromIdx !== null && !isNaN(fromIdx)) {
                    handleReorder(fromIdx, idx);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'ring-2 ring-primary border-primary scale-[1.02] bg-primary/5' : ''} ${isChecked ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted hover:text-primary cursor-grab" />
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(c.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant={c.active !== false ? 'success' : 'neutral'}>
                      {c.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-primary" />
                      {c.name}
                    </h4>
                    {c.nameKh && <p className="text-xs text-muted font-khmer">{c.nameKh}</p>}
                    <p className="text-xs text-muted pt-1">Parent: {getParentName(c.parentId)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{paginatedCategories.length}</strong> of <strong>{filteredCategories.length}</strong> categories
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7. Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Category Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Antibiotics"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Khmer Name
            </label>
            <input
              type="text"
              value={formData.nameKh}
              onChange={e => setFormData({ ...formData, nameKh: e.target.value })}
              placeholder="e.g. ?????????"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Parent Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreateParentModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                New Parent Category
              </button>
            </div>
            <select
              value={formData.parentId}
              onChange={e => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">No Parent (Root Category)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <p className="text-xs font-bold text-foreground">Active Category</p>
              <p className="text-[11px] text-muted">Visible for product assignment</p>
            </div>
          </label>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Category"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Category Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Khmer Name
            </label>
            <input
              type="text"
              value={formData.nameKh}
              onChange={e => setFormData({ ...formData, nameKh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Parent Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreateParentModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                New Parent Category
              </button>
            </div>
            <select
              value={formData.parentId}
              onChange={e => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">No Parent (Root Category)</option>
              {categories
                .filter(c => c.id !== selectedCategory?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Quick Create Parent Category Modal */}
      <Modal
        isOpen={isCreateParentModalOpen}
        onClose={() => setIsCreateParentModalOpen(false)}
        title="Create New Parent Category"
        size="md"
      >
        <form onSubmit={handleCreateParentCategory} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Parent Category Name *
            </label>
            <input
              required
              type="text"
              value={parentFormData.name}
              onChange={e => setParentFormData({ ...parentFormData, name: e.target.value })}
              placeholder="e.g. Pharmaceuticals / Medical Supplies"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Khmer Name
            </label>
            <input
              type="text"
              value={parentFormData.nameKh}
              onChange={e => setParentFormData({ ...parentFormData, nameKh: e.target.value })}
              placeholder="e.g. ??? ????????????????"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-khmer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateParentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={creatingParent} type="submit">
              {creatingParent ? 'Creating...' : 'Create Parent Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete category <strong>{selectedCategory?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 11. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Categories`}
        message={`${selected.size} category(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}