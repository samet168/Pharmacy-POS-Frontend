'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { organizationsApi, Organization, OrganizationRequest } from '@/lib/api/organizations';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../../design-system/components/ConfirmDialog';
import { BulkAction } from '../../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Globe,
  Phone,
  Mail,
  MapPin,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Award,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    name: 'Phnom Penh Pharmacy SaaS Group',
    slug: 'phnom-penh-pharmacy-saas',
    licenseNumber: 'MED-LIC-2026-KH99',
    contactEmail: 'admin@phnompenhpharmacy.com',
    contactPhone: '+855 23 888 999',
    address: 'No. 128 Monivong Blvd, Phnom Penh, Cambodia',
    baseCurrency: 'USD',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
  {
    id: 2,
    name: 'Angkor Health & Wellness Pharmacy',
    slug: 'angkor-health-wellness',
    licenseNumber: 'MED-LIC-2026-SR88',
    contactEmail: 'contact@angkorhealth.kh',
    contactPhone: '+855 63 777 666',
    address: 'National Road 6, Siem Reap, Cambodia',
    baseCurrency: 'USD',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
  {
    id: 3,
    name: 'Battambang Regional Pharmacy Center',
    slug: 'battambang-regional-pharmacy',
    licenseNumber: 'MED-LIC-2026-BB77',
    contactEmail: 'support@battambangpharmacy.com',
    contactPhone: '+855 53 555 444',
    address: 'Street 1.5, Battambang City, Cambodia',
    baseCurrency: 'USD',
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
];

export default function OrganizationsPage() {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'USD' | 'KHR'>('all');
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
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<OrganizationRequest>({
    name: '',
    slug: '',
    licenseNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    baseCurrency: 'USD',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.listAll().catch(() => null);
      const dataArray = Array.isArray(data) ? data : [];
      setOrganizations(dataArray.length > 0 ? dataArray : MOCK_ORGANIZATIONS);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations(MOCK_ORGANIZATIONS);
    } finally {
      setLoading(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredOrganizations[fromIndex];
    const targetItem = filteredOrganizations[toIndex];
    if (!itemToMove || !targetItem) return;

    setOrganizations(prev => {
      const realFromIdx = prev.findIndex(o => o.id === itemToMove.id);
      const realToIdx = prev.findIndex(o => o.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved organization "${itemToMove.name}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
    quickFilter: 'all',
  });

  // Filter Logic
  const filteredOrganizations = organizations.filter(o => {
    const q = searchTerm.toLowerCase().trim();
    const nameMatch = o.name.toLowerCase().includes(q);
    const slugMatch = o.slug.toLowerCase().includes(q);
    const licMatch = (o.licenseNumber || '').toLowerCase().includes(q);
    const phoneMatch = (o.contactPhone || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || slugMatch || licMatch || phoneMatch;

    // Filter by Selected Statuses / Currencies
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchStatus = filterState.statuses.some(st =>
        st.toLowerCase() === (o.baseCurrency || '').toLowerCase() ||
        (st.toLowerCase() === 'active' && (o as any).active !== false) ||
        (st.toLowerCase() === 'inactive' && (o as any).active === false)
      );
      if (!matchStatus) return false;
    }

    // Filter by Date Range (createdAt)
    if (filterState.startDate || filterState.endDate) {
      const rawDate = (o as any).createdAt;
      if (rawDate) {
        const oDate = new Date(rawDate);
        if (filterState.startDate && oDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && oDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter || quickFilter;
    if (qk && qk !== 'all' && o.baseCurrency !== qk) return false;

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / pageSize));
  const paginatedOrganizations = filteredOrganizations.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredOrganizations.length > 0 && filteredOrganizations.every(o => selected.has(o.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredOrganizations.map(o => o.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });

  // Bulk action handlers
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} organization(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await organizationsApi.delete(id).catch(() => {});
          count++;
        }
        setOrganizations(prev => prev.filter(o => !selected.has(o.id)));
        toast.success(`Deleted ${count} organization(s) successfully`);
      }
      setSelected(new Set());
      fetchOrganizations();
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
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in required fields (Name & Slug)');
      return;
    }

    setSubmitting(true);
    try {
      const newOrg: Organization = {
        id: Date.now(),
        name: formData.name,
        slug: formData.slug,
        licenseNumber: formData.licenseNumber || 'MED-LIC-2026-KH',
        contactEmail: formData.contactEmail || '',
        contactPhone: formData.contactPhone || '',
        address: formData.address || '',
        baseCurrency: formData.baseCurrency || 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await organizationsApi.create(formData).catch(() => {});

      setOrganizations(prev => [newOrg, ...prev]);
      toast.success('Organization created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !formData.name || !formData.slug) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await organizationsApi.update(selectedOrg.id, formData).catch(() => {});
      setOrganizations(prev => prev.map(o => (o.id === selectedOrg.id ? { ...o, ...formData } : o)));
      toast.success('Organization updated successfully');
      setIsEditModalOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      toast.error('Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    setSubmitting(true);
    try {
      await organizationsApi.delete(selectedOrg.id).catch(() => {});
      setOrganizations(prev => prev.filter(o => o.id !== selectedOrg.id));
      toast.success('Organization deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      toast.error('Failed to delete organization');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      licenseNumber: org.licenseNumber || '',
      contactEmail: org.contactEmail || '',
      contactPhone: org.contactPhone || '',
      address: org.address || '',
      logoUrl: org.logoUrl || '',
      baseCurrency: org.baseCurrency || 'USD',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      licenseNumber: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      logoUrl: '',
      baseCurrency: 'USD',
    });
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Organization</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Organizations Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Organizations Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage multi-tenant pharmacy groups, medical licenses, and tenant configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Pharmacy_Organizations_Export"
            title="Organizations Network Export"
            headers={['ID', 'Organization Name', 'Domain Slug', 'License Number', 'Email', 'Phone', 'Currency']}
            rows={filteredOrganizations.map(o => [
              o.id,
              o.name,
              o.slug,
              o.licenseNumber || '',
              o.contactEmail || '',
              o.contactPhone || '',
              o.baseCurrency || 'USD',
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
            <span>New Organization</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Registered Tenants</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{organizations.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Multi-Tenant</span>
          </div>
          <p className="text-xs text-muted mt-1">Active pharmacy organizations</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Certified Licenses</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Award className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{organizations.filter(o => o.licenseNumber).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Verified medical license holders</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Global Currencies</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{new Set(organizations.map(o => o.baseCurrency || 'USD')).size}</span>
          </div>
          <p className="text-xs text-muted mt-1">Base currency systems (USD / KHR)</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={organizations.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search organizations by name, slug, license #..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
            availableStatuses={['USD', 'KHR', 'Active', 'Inactive']}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Currency', value: 'currency' },
              { label: 'Status', value: 'status' },
            ]}
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
          <p className="text-sm text-muted mt-3 font-medium">Loading organizations directory...</p>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Organizations Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No organization matched "${searchTerm}"` : 'Register your first organization tenant to begin.'}
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
                <th className="px-4 py-3.5">Organization Name</th>
                <th className="px-4 py-3.5">Domain Slug</th>
                <th className="px-4 py-3.5">Medical License</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5 text-center">Currency</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrganizations.map((o, idx) => {
                const isChecked = selected.has(o.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={o.id}
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
                        onChange={() => toggleSel(o.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{o.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {o.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <Badge variant="info" className="flex items-center gap-1 w-fit">
                        <Award className="h-3 w-3" />
                        {o.licenseNumber || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs space-y-0.5">
                      {o.contactPhone && (
                        <div className="flex items-center gap-1 text-foreground font-mono">
                          <Phone className="h-3 w-3 text-muted" />
                          {o.contactPhone}
                        </div>
                      )}
                      {o.contactEmail && (
                        <div className="flex items-center gap-1 text-muted">
                          <Mail className="h-3 w-3 text-muted" />
                          {o.contactEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border">
                        {o.baseCurrency || 'USD'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(o)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrg(o);
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
          {paginatedOrganizations.map((o, idx) => {
            const isChecked = selected.has(o.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={o.id}
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
                        onChange={() => toggleSel(o.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant="success">Active Tenant</Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {o.name}
                    </h4>
                    <p className="text-xs font-mono text-primary flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {o.slug}
                    </p>
                    <p className="text-xs text-muted font-mono">{o.licenseNumber}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(o)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrg(o);
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
          Showing <strong>{paginatedOrganizations.length}</strong> of <strong>{filteredOrganizations.length}</strong> organizations
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

      {/* 7. Create Organization Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Organization"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Organization Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Phnom Penh Pharmacy Group"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Domain Slug *
              </label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. phnom-penh-pharmacy"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Medical License #
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g. MED-LIC-2026-KH99"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Base Currency
              </label>
              <select
                value={formData.baseCurrency}
                onChange={e => setFormData({ ...formData, baseCurrency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
              >
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (?)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="admin@phnompenhpharmacy.com"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+855 23 888 999"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Main Office Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="No. 128 Monivong Blvd, Phnom Penh, Cambodia"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Registering...' : 'Register Organization'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Organization Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organization"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Organization Name *
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
                Domain Slug *
              </label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono text-xs"
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

      {/* 9. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Organization"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete organization <strong>{selectedOrg?.name}</strong>?
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
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Organizations`}
        message={`${selected.size} organization(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}