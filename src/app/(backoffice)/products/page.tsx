'use client';

import { useState, useEffect, useRef } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  AlertTriangle,
  Pill,
  CheckCircle2,
  TrendingUp,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  Star,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Tag,
  Building2,
  UploadCloud,
  X,
  Check,
  Image as ImageIcon,
} from 'lucide-react';

type SortField = 'brandName' | 'sku' | 'category' | 'minStockAlert' | 'custom';
type SortDir = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'inactive' | 'rx' | 'lowStock'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('custom');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Selection & Favorites
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Quick Inline Creation States for Category & Supplier inside Modals
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Image Upload Preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Drag & Drop Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    const itemToMove = filtered[fromIndex];
    const targetItem = filtered[toIndex];
    if (!itemToMove || !targetItem) return;

    setSortField('custom');

    setProducts(prev => {
      const realFromIdx = prev.findIndex(p => p.id === itemToMove.id);
      const realToIdx = prev.findIndex(p => p.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved "${itemToMove.brandName}" to new position`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Bulk confirmation dialog
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const productsArray = Array.isArray(productsData) ? productsData : productsData?.content || [];
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : categoriesData?.content || [];
      const suppliersArray = Array.isArray(suppliersData) ? suppliersData : suppliersData?.content || [];

      setProducts(productsArray);
      setCategories(categoriesArray);
      setSuppliers(suppliersArray);
      setTotalPages(productsData?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products data');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Inline Quick Create Category
  const handleInlineCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      const res: any = await categoriesApi.create({
        name: newCategoryName.trim(),
        organizationId,
        active: true,
      });
      toast.success(`Category "${newCategoryName}" created!`);
      const newCatObj = res?.data || res || { id: Date.now(), name: newCategoryName.trim() };
      setCategories(prev => [...prev, newCatObj]);
      setFormData(prev => ({ ...prev, categoryId: String(newCatObj.id) }));
      setNewCategoryName('');
      setShowQuickCategory(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Inline Quick Create Supplier
  const handleInlineCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setCreatingSupplier(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      const res: any = await suppliersApi.create({
        name: newSupplierName.trim(),
        organizationId,
        active: true,
      });
      toast.success(`Supplier "${newSupplierName}" created!`);
      const newSupObj = res?.data || res || { id: Date.now(), name: newSupplierName.trim() };
      setSuppliers(prev => [...prev, newSupObj]);
      setFormData(prev => ({ ...prev, defaultSupplierId: String(newSupObj.id) }));
      setNewSupplierName('');
      setShowQuickSupplier(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create supplier');
    } finally {
      setCreatingSupplier(false);
    }
  };

  // Handle File Drag & Selection
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, imageFile: null }));
      setImagePreview(null);
      return;
    }
    setFormData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
    quickFilter: 'all',
  });

  // Filter & Sort Logic
  const filtered = products
    .filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const catName = categories.find(c => c.id === p.categoryId)?.name?.toLowerCase() || '';
      const supName = suppliers.find(s => s.id === p.defaultSupplierId)?.name?.toLowerCase() || '';
      const pName = (p.brandName || (p as any).name || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();

      const matchesSearch =
        !q ||
        pName.includes(q) ||
        pSku.includes(q) ||
        catName.includes(q) ||
        supName.includes(q);

      const matchesCategory = !filterCategory || String(p.categoryId) === filterCategory;

      // Filter by Selected Statuses / Categories / Suppliers
      if (filterState.statuses && filterState.statuses.length > 0) {
        const matchStatus = filterState.statuses.some(st =>
          st.toLowerCase() === catName ||
          st.toLowerCase() === supName ||
          (st.toLowerCase() === 'active' && p.isActive !== false) ||
          (st.toLowerCase() === 'inactive' && p.isActive === false)
        );
        if (!matchStatus) return false;
      }

      // Filter by Date Range (createdAt)
      if (filterState.startDate || filterState.endDate) {
        const rawDate = (p as any).createdAt;
        if (rawDate) {
          const pDate = new Date(rawDate);
          if (filterState.startDate && pDate < new Date(filterState.startDate + 'T00:00:00')) return false;
          if (filterState.endDate && pDate > new Date(filterState.endDate + 'T23:59:59')) return false;
        }
      }

      const qk = filterState.quickFilter || quickFilter;
      let matchesQuick = true;
      if (qk === 'active') matchesQuick = p.isActive !== false;
      else if (qk === 'inactive') matchesQuick = p.isActive === false;
      else if (qk === 'rx') matchesQuick = !!p.isControlledSubstance;
      else if (qk === 'lowStock') matchesQuick = (p.minStockAlert || 0) > 5;

      return matchesSearch && matchesCategory && matchesQuick;
    })
    .sort((a, b) => {
      if (sortField === 'custom') return 0;
      let av: any = '', bv: any = '';
      if (sortField === 'brandName') { av = a.brandName || ''; bv = b.brandName || ''; }
      else if (sortField === 'sku') { av = a.sku || ''; bv = b.sku || ''; }
      else if (sortField === 'category') {
        av = categories.find(c => c.id === a.categoryId)?.name || '';
        bv = categories.find(c => c.id === b.categoryId)?.name || '';
      } else if (sortField === 'minStockAlert') { av = a.minStockAlert || 0; bv = b.minStockAlert || 0; }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  // KPI Analytics Metrics
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter(p => p.isActive).length;
  const controlledRxCount = products.filter(p => p.isControlledSubstance).length;
  const lowStockCount = products.filter(p => (p.minStockAlert || 0) > 5).length;

  // Selection handlers
  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(p => p.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleFav = (id: number) =>
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Bulk action handler
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);

    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }

    const { user } = useAuthStore.getState();
    const organizationId = user?.organizationId || 1;
    const selectedIdsArray = Array.from(selected);

    if (selectedIdsArray.length === 0) return;

    if (action === 'deactivate') {
      setLoading(true);
      try {
        let successCount = 0;
        for (const id of selectedIdsArray) {
          const p = products.find(prod => prod.id === id);
          if (!p) continue;
          const currentSku = p.sku || `SKU-${p.id}`;
          try {
            await productsApi.update(id, {
              organizationId: p.organizationId || organizationId,
              brandName: p.brandName || 'Product',
              sku: currentSku,
              categoryId: p.categoryId ? Number(p.categoryId) : undefined,
              defaultSupplierId: p.defaultSupplierId ? Number(p.defaultSupplierId) : undefined,
              isControlledSubstance: !!(p.controlledSubstance ?? p.isControlledSubstance),
              minStockAlert: p.minStockAlert || 10,
              imageUrl: p.imageUrl,
              isActive: false,
            });
            successCount++;
          } catch (err: any) {
            console.error(`Failed to deactivate product ${id}:`, err);
          }
        }

        setProducts(prev =>
          prev.map(p => (selected.has(p.id) ? { ...p, active: false, isActive: false } : p))
        );
        toast.success(`Deactivated ${successCount} product(s) successfully`);
        setSelected(new Set());
        await fetchData();
      } catch (err: any) {
        toast.error('Failed to deactivate products');
      } finally {
        setLoading(false);
      }
    } else if (action === 'duplicate') {
      setLoading(true);
      try {
        let successCount = 0;
        for (const id of selectedIdsArray) {
          const p = products.find(prod => prod.id === id);
          if (!p) continue;
          const uniqueSku = p.sku ? `${p.sku}-DUP-${Date.now() % 10000}` : `SKU-${Date.now()}`;
          try {
            await productsApi.create({
              organizationId: p.organizationId || organizationId,
              brandName: `${p.brandName || 'Product'} (Copy)`,
              sku: uniqueSku,
              categoryId: p.categoryId ? Number(p.categoryId) : undefined,
              defaultSupplierId: p.defaultSupplierId ? Number(p.defaultSupplierId) : undefined,
              isControlledSubstance: !!(p.controlledSubstance ?? p.isControlledSubstance),
              minStockAlert: p.minStockAlert || 10,
              imageUrl: p.imageUrl,
              isActive: true,
            });
            successCount++;
          } catch (err: any) {
            console.error(`Failed to duplicate product ${id}:`, err);
          }
        }

        toast.success(`Duplicated ${successCount} product(s) successfully`);
        setSelected(new Set());
        await fetchData();
      } catch (err: any) {
        toast.error('Failed to duplicate products');
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const { user } = useAuthStore.getState();
    const organizationId = user?.organizationId || 1;
    const selectedIdsArray = Array.from(selected);

    try {
      if (bulkActionType === 'delete') {
        let successCount = 0;
        for (const id of selectedIdsArray) {
          try {
            await productsApi.delete(id);
            successCount++;
          } catch (err) {
            console.error(`Failed to delete product ${id}:`, err);
          }
        }
        setProducts(prev => prev.filter(p => !selected.has(p.id)));
        toast.success(`Deleted ${successCount} product(s) successfully`);
      } else if (bulkActionType === 'archive') {
        let successCount = 0;
        for (const id of selectedIdsArray) {
          const p = products.find(prod => prod.id === id);
          if (!p) continue;
          const currentSku = p.sku || `SKU-${p.id}`;
          try {
            await productsApi.update(id, {
              organizationId: p.organizationId || organizationId,
              brandName: p.brandName || 'Product',
              sku: currentSku,
              categoryId: p.categoryId ? Number(p.categoryId) : undefined,
              defaultSupplierId: p.defaultSupplierId ? Number(p.defaultSupplierId) : undefined,
              isControlledSubstance: !!(p.controlledSubstance ?? p.isControlledSubstance),
              minStockAlert: p.minStockAlert || 10,
              imageUrl: p.imageUrl,
              isActive: false,
            });
            successCount++;
          } catch (err: any) {
            console.error(`Failed to archive product ${id}:`, err);
          }
        }
        setProducts(prev =>
          prev.map(p => (selected.has(p.id) ? { ...p, active: false, isActive: false } : p))
        );
        toast.success(`Archived ${successCount} product(s) successfully`);
      }
      setSelected(new Set());
      await fetchData();
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
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      const { imageFile, costPrice, sellingPrice, categoryId, defaultSupplierId, ...rest } = formData;
      const generatedSku = formData.sku?.trim() || `SKU-${Date.now()}`;
      const payload: any = {
        ...rest,
        organizationId,
        sku: generatedSku,
        brandName: formData.brandName?.trim() || 'New Product',
        categoryId: categoryId ? Number(categoryId) : undefined,
        defaultSupplierId: defaultSupplierId ? Number(defaultSupplierId) : undefined,
        minStockAlert: 10,
      };
      await productsApi.create(payload, imageFile || undefined);
      toast.success('Product created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Create product failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || selectedProduct.organizationId || 1;
      const { imageFile, costPrice, sellingPrice, categoryId, defaultSupplierId, ...rest } = formData;
      const payload: any = {
        ...rest,
        organizationId,
        sku: formData.sku?.trim() || selectedProduct.sku || `SKU-${selectedProduct.id}`,
        brandName: formData.brandName?.trim() || selectedProduct.brandName || 'Product',
        categoryId: categoryId ? Number(categoryId) : undefined,
        defaultSupplierId: defaultSupplierId ? Number(defaultSupplierId) : undefined,
        minStockAlert: selectedProduct.minStockAlert || 10,
        imageUrl: selectedProduct.imageUrl,
      };
      await productsApi.update(selectedProduct.id, payload, imageFile || undefined);
      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Update product failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await productsApi.delete(selectedProduct.id);
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      brandName: product.brandName || '',
      sku: product.sku || '',
      costPrice: product.costPrice || '',
      sellingPrice: product.sellingPrice || '',
      categoryId: String(product.categoryId || ''),
      defaultSupplierId: String(product.defaultSupplierId || ''),
      isControlledSubstance: !!product.isControlledSubstance,
      isActive: product.isActive !== false,
      imageFile: null,
    });
    setImagePreview(product.imageUrl || null);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
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
    setImagePreview(null);
    setShowQuickCategory(false);
    setShowQuickSupplier(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Inventory</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Products Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Products Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Enterprise Product Catalog & Pharmacy Inventory Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Pharmacy_Products_Catalog"
            title="Products Catalog"
            headers={['Product ID', 'Brand Name', 'SKU', 'Category', 'Supplier', 'Min Stock', 'Rx', 'Status']}
            rows={filtered.map(p => [
              p.id,
              p.brandName || '',
              p.sku || '',
              categories.find(c => c.id === p.categoryId)?.name || '',
              suppliers.find(s => s.id === p.defaultSupplierId)?.name || '',
              p.minStockAlert || 0,
              p.isControlledSubstance ? 'Yes' : 'No',
              p.isActive ? 'Active' : 'Inactive',
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
            <span>New Product</span>
          </Button>
        </div>
      </div>

      {/* 2. Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Products
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{totalProductsCount}</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +12%
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Catalog items registered</p>
        </div>

        {/* Active Products Card */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Active Listings
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{activeProductsCount}</span>
            <span className="text-xs text-muted">
              ({totalProductsCount > 0 ? Math.round((activeProductsCount / totalProductsCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Available for POS sales</p>
        </div>

        {/* Controlled Rx Substances */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Controlled (Rx)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{controlledRxCount}</span>
            <Badge variant="danger" className="text-[10px] px-1.5 py-0.2">
              Prescription Only
            </Badge>
          </div>
          <p className="text-xs text-muted mt-1">Requires prescription clearance</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Reorder Alerts
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{lowStockCount}</span>
            <span className="text-xs font-semibold text-amber-500">Attention Req.</span>
          </div>
          <p className="text-xs text-muted mt-1">Products near min stock threshold</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar (appears dynamically when selected) */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={products.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Enterprise Search & Quick Filter Chips Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search by name, SKU, category, supplier..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
            availableStatuses={[...categories.map(c => c.name), 'Active', 'Inactive']}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Category', value: 'category' },
              { label: 'Status', value: 'status' },
            ]}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Product Content (List / Grid View) */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted mt-3 font-medium">Loading catalog products...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Products Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm
              ? `No products matched your search "${searchTerm}".`
              : 'Start building your inventory catalog by adding your first product.'}
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              shape="pill"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create First Product
            </Button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* Table View */
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
                <th className="w-8 px-1 py-3.5" />
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5 text-right">Min Stock</th>
                <th className="px-4 py-3.5 text-center">Rx</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product, idx) => {
                const isChecked = selected.has(product.id);
                const isFav = favorites.has(product.id);
                const catName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
                const supName = suppliers.find(s => s.id === product.defaultSupplierId)?.name || 'N/A';
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={product.id}
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
                    className={`transition-all duration-150 ${
                      isDragging ? 'opacity-40 bg-primary/10' : ''
                    } ${
                      isDragOver ? 'border-t-2 border-primary bg-primary/10' : ''
                    } ${
                      isChecked
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(product.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted hover:text-primary transition-colors" />
                    </td>
                    <td className="px-1 py-3">
                      <button type="button" onClick={() => toggleFav(product.id)}>
                        <Star
                          className={`h-4 w-4 ${
                            isFav
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={product.imageUrl}
                          alt={product.brandName}
                          className="w-10 h-10 rounded-xl object-cover border border-border"
                          fallback={
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-inner"
                              style={{
                                background: `hsl(${
                                  (product.brandName || '').charCodeAt(0) % 360
                                }, 60%, 45%)`,
                              }}
                            >
                              {(product.brandName || 'P').charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <div>
                          <p className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                            {product.brandName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {product.sku || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                        <Tag className="h-3 w-3 text-primary" />
                        {catName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted" />
                        {supName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {product.minStockAlert || 10}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isControlledSubstance ? (
                        <Badge variant="danger" className="text-[10px]">
                          Rx Required
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.isActive !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Product"
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
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, idx) => {
            const catName = categories.find(c => c.id === product.categoryId)?.name || 'Unassigned';
            const isChecked = selected.has(product.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={product.id}
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
                className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 relative group flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-40 scale-95' : ''
                } ${
                  isDragOver ? 'ring-2 ring-primary border-primary scale-[1.02] bg-primary/5' : ''
                } ${
                  isChecked ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <div>
                  {/* Top Card Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted hover:text-primary cursor-grab" />
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(product.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {product.isControlledSubstance && (
                        <Badge variant="danger" className="text-[9px]">
                          Rx
                        </Badge>
                      )}
                      {product.isActive !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  {/* Image & Main Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <SafeImage
                      src={product.imageUrl}
                      alt={product.brandName}
                      className="w-14 h-14 rounded-2xl object-cover border border-border shadow-sm"
                      fallback={
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-inner"
                          style={{
                            background: `hsl(${
                              (product.brandName || '').charCodeAt(0) % 360
                            }, 60%, 45%)`,
                          }}
                        >
                          {(product.brandName || 'P').charAt(0).toUpperCase()}
                        </div>
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground text-sm truncate">
                        {product.brandName}
                      </h4>
                      <p className="text-xs font-mono text-muted truncate mt-0.5">
                        SKU: {product.sku || 'N/A'}
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-muted mt-1">
                        {catName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">
                    Min Stock: <strong>{product.minStockAlert || 10}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong> products
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

      {/* 7. Create Product Modal (With Image Drag & Drop + Searchable Select + Inline Quick Create) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Product"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Image Drag & Drop Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Product Image Upload
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 bg-background hover:bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />

              {imagePreview ? (
                <div className="relative w-full h-32 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 object-contain rounded-xl shadow-md"
                  />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Remove Image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <UploadCloud className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-foreground">
                    Click or Drag Image to Upload
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">Supports PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Brand Name *
              </label>
              <input
                required
                type="text"
                value={formData.brandName}
                onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                SKU Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. MED-001"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Category Select + Quick Create ("search and create") */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowQuickCategory(prev => !prev)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {showQuickCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {showQuickCategory ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Enter new Category Name..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={creatingCategory}
                  onClick={handleInlineCreateCategory}
                >
                  {creatingCategory ? 'Creating...' : 'Save'}
                </Button>
              </div>
            ) : (
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">— Select Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Supplier Select + Quick Create ("search and create") */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Default Supplier
              </label>
              <button
                type="button"
                onClick={() => setShowQuickSupplier(prev => !prev)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {showQuickSupplier ? 'Cancel' : 'New Supplier'}
              </button>
            </div>

            {showQuickSupplier ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Enter new Supplier Name..."
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={creatingSupplier}
                  onClick={handleInlineCreateSupplier}
                >
                  {creatingSupplier ? 'Creating...' : 'Save'}
                </Button>
              </div>
            ) : (
              <select
                value={formData.defaultSupplierId}
                onChange={e => setFormData({ ...formData, defaultSupplierId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isControlledSubstance}
                onChange={e => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-xs font-bold text-foreground">Controlled Substance (Rx)</p>
                <p className="text-[11px] text-muted">Requires prescription verification</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <div>
                <p className="text-xs font-bold text-foreground">Active Listing</p>
                <p className="text-[11px] text-muted">Visible for POS sales</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Saving...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Product Modal (With Image Drag & Drop Upload) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product Details"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          {/* Image Upload Zone for Edit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Product Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 bg-background hover:bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />

              {imagePreview ? (
                <div className="relative w-full h-32 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-32 object-contain rounded-xl shadow-md"
                  />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md hover:scale-110 transition-transform"
                    title="Remove Image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <UploadCloud className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-foreground">
                    Click or Drag Image to Upload / Change
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">Supports PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Brand Name *
              </label>
              <input
                required
                type="text"
                value={formData.brandName}
                onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                SKU Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
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

      {/* 9. Delete Product Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete <strong>{selectedProduct?.brandName}</strong>? This action cannot be undone.
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

      {/* 10. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Products`}
        message={`${selected.size} product(s) will be ${
          bulkActionType === 'delete' ? 'permanently deleted' : 'archived'
        }.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
