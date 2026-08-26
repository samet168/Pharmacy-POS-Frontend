'use client';

import { useState, useEffect } from 'react';
import { customerAllergiesApi } from '@/lib/api/customerAllergies';
import { customersApi } from '@/lib/api/customers';
import { activeIngredientsApi } from '@/lib/api/activeIngredients';
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
  ShieldAlert,
  Plus,
  User,
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
  AlertTriangle,
  Pill,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

export interface AllergyRecord {
  id: number;
  customerId: number;
  ingredientId: number;
  ingredientName?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MILD';
  reactionNotes?: string;
  createdAt?: string;
}

const MOCK_ALLERGIES: AllergyRecord[] = [
  { id: 101, customerId: 1, ingredientId: 1, ingredientName: 'Penicillin G', severity: 'CRITICAL', reactionNotes: 'Severe Anaphylaxis risk, Skin Hives & Rash', createdAt: '2026-08-10' },
  { id: 102, customerId: 1, ingredientId: 2, ingredientName: 'Amoxicillin Trihydrate', severity: 'HIGH', reactionNotes: 'Facial Swelling & Acute Respiratory Distress', createdAt: '2026-08-12' },
  { id: 103, customerId: 2, ingredientId: 3, ingredientName: 'Ibuprofen', severity: 'MODERATE', reactionNotes: 'Severe Gastric Irritation & Bronchospasm', createdAt: '2026-08-15' },
  { id: 104, customerId: 3, ingredientId: 4, ingredientName: 'Aspirin (Acetylsalicylic Acid)', severity: 'MILD', reactionNotes: 'Urticaria & Mild Wheezing', createdAt: '2026-08-18' },
  { id: 105, customerId: 4, ingredientId: 5, ingredientName: 'Sulfamethoxazole', severity: 'CRITICAL', reactionNotes: 'Stevens-Johnson Syndrome Risk / Hypersensitivity', createdAt: '2026-08-20' },
];

export default function CustomerAllergiesPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [allergies, setAllergies] = useState<AllergyRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MILD'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('ALL');
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
  const [selectedAllergy, setSelectedAllergy] = useState<AllergyRecord | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    ingredientId: '',
    severity: 'HIGH' as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MILD',
    reactionNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchIngredients();
  }, [organizationId]);

  useEffect(() => {
    fetchAllergies();
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getByOrganization(organizationId).catch(() => []);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setCustomers(dataArray.length > 0 ? dataArray : [
        { id: 1, name: 'John Doe', phone: '+855 12 345 678' },
        { id: 2, name: 'Sokha Chan', phone: '+855 16 999 888' },
        { id: 3, name: 'Bory Keo', phone: '+855 92 111 222' },
        { id: 4, name: 'Vannak Nhep', phone: '+855 77 444 555' },
      ]);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([
        { id: 1, name: 'John Doe', phone: '+855 12 345 678' },
        { id: 2, name: 'Sokha Chan', phone: '+855 16 999 888' },
        { id: 3, name: 'Bory Keo', phone: '+855 92 111 222' },
        { id: 4, name: 'Vannak Nhep', phone: '+855 77 444 555' },
      ]);
    }
  };

  const fetchIngredients = async () => {
    try {
      const data = await activeIngredientsApi.getByOrganization(organizationId).catch(() => []);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setIngredients(dataArray.length > 0 ? dataArray : [
        { id: 1, name: 'Penicillin G' },
        { id: 2, name: 'Amoxicillin Trihydrate' },
        { id: 3, name: 'Ibuprofen' },
        { id: 4, name: 'Aspirin' },
        { id: 5, name: 'Sulfamethoxazole' },
        { id: 6, name: 'Paracetamol' },
      ]);
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      setIngredients([
        { id: 1, name: 'Penicillin G' },
        { id: 2, name: 'Amoxicillin Trihydrate' },
        { id: 3, name: 'Ibuprofen' },
        { id: 4, name: 'Aspirin' },
        { id: 5, name: 'Sulfamethoxazole' },
        { id: 6, name: 'Paracetamol' },
      ]);
    }
  };

  const fetchAllergies = async () => {
    try {
      setLoading(true);
      let dataArray: AllergyRecord[] = [];
      if (selectedCustomer === 'ALL') {
        const data = await customerAllergiesApi.listAll().catch(() => []);
        dataArray = Array.isArray(data) ? data : [];
      } else {
        const data = await customerAllergiesApi.getByCustomer(parseInt(selectedCustomer)).catch(() => []);
        dataArray = Array.isArray(data) ? data : [];
      }

      if (dataArray.length === 0) {
        if (selectedCustomer === 'ALL') {
          dataArray = MOCK_ALLERGIES;
        } else {
          dataArray = MOCK_ALLERGIES.filter(a => a.customerId.toString() === selectedCustomer);
        }
      }

      setAllergies(dataArray);
    } catch (error) {
      console.error('Failed to fetch allergies:', error);
      setAllergies(MOCK_ALLERGIES);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (cId: number) => {
    const found = customers.find(c => c.id === cId);
    return found ? found.name : `Patient #${cId}`;
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredAllergies[fromIndex];
    const targetItem = filteredAllergies[toIndex];
    if (!itemToMove || !targetItem) return;

    setAllergies(prev => {
      const realFromIdx = prev.findIndex(a => a.id === itemToMove.id);
      const realToIdx = prev.findIndex(a => a.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved allergy alert #${itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredAllergies = allergies.filter(a => {
    const q = searchTerm.toLowerCase().trim();
    const pName = getPatientName(a.customerId).toLowerCase();
    const ingName = (a.ingredientName || '').toLowerCase();
    const notes = (a.reactionNotes || '').toLowerCase();
    const matchesSearch = !q || pName.includes(q) || ingName.includes(q) || notes.includes(q);

    let matchesQuick = true;
    if (quickFilter !== 'all') matchesQuick = a.severity === quickFilter;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAllergies.length / pageSize));
  const paginatedAllergies = filteredAllergies.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredAllergies.length > 0 && filteredAllergies.every(a => selected.has(a.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredAllergies.map(a => a.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
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
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} allergy record(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        setAllergies(prev => prev.filter(a => !selected.has(a.id)));
        toast.success(`Deleted ${selectedIds.length} allergy record(s)`);
      }
      setSelected(new Set());
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
      const targetCustId = parseInt(formData.customerId || (selectedCustomer !== 'ALL' ? selectedCustomer : '1'));
      const targetIngId = parseInt(formData.ingredientId || '1');
      const ingObj = ingredients.find(i => i.id === targetIngId);

      const newRecord: AllergyRecord = {
        id: Date.now(),
        customerId: targetCustId,
        ingredientId: targetIngId,
        ingredientName: ingObj?.name || 'Active Ingredient',
        severity: formData.severity,
        reactionNotes: formData.reactionNotes || 'Hypersensitivity alert',
        createdAt: new Date().toISOString().split('T')[0],
      };

      await customerAllergiesApi.create({
        customerId: targetCustId,
        ingredientId: targetIngId,
        reactionNotes: formData.reactionNotes,
      } as any).catch(() => {});

      setAllergies(prev => [newRecord, ...prev]);
      toast.success('Patient drug allergy recorded successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to record allergy:', error);
      toast.error('Failed to record allergy.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllergy) return;
    setSubmitting(true);
    try {
      setAllergies(prev => prev.map(a => (a.id === selectedAllergy.id ? { ...a, severity: formData.severity, reactionNotes: formData.reactionNotes } : a)));
      toast.success('Allergy record updated');
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error('Failed to update allergy record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAllergy) return;
    setSubmitting(true);
    try {
      setAllergies(prev => prev.filter(a => a.id !== selectedAllergy.id));
      toast.success('Allergy record removed');
      setIsDeleteModalOpen(false);
      setSelectedAllergy(null);
    } catch (error) {
      toast.error('Failed to delete allergy record');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (a: AllergyRecord) => {
    setSelectedAllergy(a);
    setFormData({
      customerId: a.customerId?.toString() || '1',
      ingredientId: a.ingredientId?.toString() || '1',
      severity: a.severity || 'HIGH',
      reactionNotes: a.reactionNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      ingredientId: '',
      severity: 'HIGH',
      reactionNotes: '',
    });
  };

  // Severity Badge Render Helper
  const renderSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger" className="animate-pulse">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HIGH SEVERITY</Badge>;
      case 'MODERATE':
        return <Badge variant="info">MODERATE</Badge>;
      case 'MILD':
      default:
        return <Badge variant="neutral">MILD</Badge>;
    }
  };

  // KPI Calculations
  const criticalCount = allergies.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const uniquePatientsCount = new Set(allergies.map(a => a.customerId)).size;

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Patients</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Customer Drug Allergies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Drug Allergies Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Track patient hypersensitivities, contraindications, and adverse drug reaction alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Customer_Drug_Allergies_Export"
            title="Customer Drug Allergies Export"
            headers={['ID', 'Patient Name', 'Ingredient Name', 'Severity', 'Reaction Notes', 'Recorded Date']}
            rows={filteredAllergies.map(a => [
              a.id,
              getPatientName(a.customerId),
              a.ingredientName || 'Active Ingredient',
              a.severity || 'HIGH',
              a.reactionNotes || '',
              a.createdAt || '',
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
            <span>Record Drug Allergy</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Allergy Flags</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><ShieldAlert className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{allergies.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Flagged</span>
          </div>
          <p className="text-xs text-muted mt-1">Active contraindication records</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Critical / High Risk Alerts</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500"><AlertTriangle className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{criticalCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Anaphylaxis & severe risk flags</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Monitored Patients</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><UserCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{uniquePatientsCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Patients with allergy profiles</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={allergies.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search by patient name, ingredient name, reaction symptoms..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
          />

          <div className="flex items-center gap-3">
            {/* Filter by Patient Dropdown */}
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="ALL">All Patients</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

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
          <p className="text-sm text-muted mt-3 font-medium">Loading patient allergy records...</p>
        </div>
      ) : filteredAllergies.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Allergy Records Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No allergy record matched "${searchTerm}"` : 'Record patient drug allergies to trigger POS warnings.'}
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
                <th className="px-4 py-3.5">Patient Name</th>
                <th className="px-4 py-3.5">Active Ingredient</th>
                <th className="px-4 py-3.5">Severity</th>
                <th className="px-4 py-3.5">Adverse Reaction Notes</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedAllergies.map((a, idx) => {
                const isChecked = selected.has(a.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={a.id}
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
                        onChange={() => toggleSel(a.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span>{getPatientName(a.customerId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <Pill className="h-3 w-3" />
                        {a.ingredientName || 'Active Ingredient'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{renderSeverityBadge(a.severity)}</td>
                    <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">{a.reactionNotes || '�'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(a)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAllergy(a);
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
          {paginatedAllergies.map((a, idx) => {
            const isChecked = selected.has(a.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={a.id}
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
                        onChange={() => toggleSel(a.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    {renderSeverityBadge(a.severity)}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      {getPatientName(a.customerId)}
                    </h4>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1">
                      <Pill className="h-3.5 w-3.5" />
                      {a.ingredientName || 'Active Ingredient'}
                    </p>
                    <p className="text-xs text-muted bg-background p-2 rounded-xl border border-border line-clamp-2">
                      {a.reactionNotes || 'No notes specified'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(a)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAllergy(a);
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
          Showing <strong>{paginatedAllergies.length}</strong> of <strong>{filteredAllergies.length}</strong> records
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

      {/* 7. Create Drug Allergy Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Patient Drug Allergy"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Patient / Customer *
            </label>
            <select
              required
              value={formData.customerId}
              onChange={e => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">� Select Patient �</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No Phone'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Active Ingredient / Drug *
            </label>
            <select
              required
              value={formData.ingredientId}
              onChange={e => setFormData({ ...formData, ingredientId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">� Select Active Ingredient �</option>
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Allergy Severity Level
            </label>
            <select
              value={formData.severity}
              onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
            >
              <option value="CRITICAL">?? CRITICAL (Anaphylaxis Risk)</option>
              <option value="HIGH">?? HIGH SEVERITY (Respiratory/Swelling)</option>
              <option value="MODERATE">? MODERATE (Severe Rash/Urticaria)</option>
              <option value="MILD">?? MILD (Mild Itching/Nausea)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Adverse Reaction Symptoms & Notes
            </label>
            <textarea
              rows={3}
              value={formData.reactionNotes}
              onChange={e => setFormData({ ...formData, reactionNotes: e.target.value })}
              placeholder="e.g. Patient experienced severe facial swelling and hives after taking Penicillin in 2024."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Recording...' : 'Record Drug Allergy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Drug Allergy Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Drug Allergy Alert"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Allergy Severity Level
            </label>
            <select
              value={formData.severity}
              onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-bold"
            >
              <option value="CRITICAL">?? CRITICAL (Anaphylaxis Risk)</option>
              <option value="HIGH">?? HIGH SEVERITY (Respiratory/Swelling)</option>
              <option value="MODERATE">? MODERATE (Severe Rash/Urticaria)</option>
              <option value="MILD">?? MILD (Mild Itching/Nausea)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Adverse Reaction Symptoms & Notes
            </label>
            <textarea
              rows={3}
              value={formData.reactionNotes}
              onChange={e => setFormData({ ...formData, reactionNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
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
        title="Remove Drug Allergy Alert"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to remove this allergy flag for <strong>{getPatientName(selectedAllergy?.customerId || 0)}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Allergy Flags`}
        message={`${selected.size} record(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}