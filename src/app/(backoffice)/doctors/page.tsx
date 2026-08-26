'use client';

import { useState, useEffect, useRef } from 'react';
import { doctorsApi } from '@/lib/api';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  Stethoscope,
  Plus,
  Phone,
  Mail,
  Award,
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
  UserCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
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
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Image Upload Preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    address: '',
    licenseNumber: '',
    imageFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorsApi.listAll();
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setDoctors(dataArray);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load physicians directory');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredDoctors[fromIndex];
    const targetItem = filteredDoctors[toIndex];
    if (!itemToMove || !targetItem) return;

    setDoctors(prev => {
      const realFromIdx = prev.findIndex(d => d.id === itemToMove.id);
      const realToIdx = prev.findIndex(d => d.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved physician "${itemToMove.name}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Image Selection
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

  // Filter Logic
  const filteredDoctors = doctors.filter(d => {
    const q = searchTerm.toLowerCase().trim();
    const dName = (d.name || '').toLowerCase();
    const dSpec = (d.specialization || '').toLowerCase();
    const dPhone = (d.phone || '').toLowerCase();
    const dLic = (d.licenseNumber || '').toLowerCase();

    const matchesSearch =
      !q ||
      dName.includes(q) ||
      dSpec.includes(q) ||
      dPhone.includes(q) ||
      dLic.includes(q);

    // Filter by Selected Statuses / Specializations
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchStatus = filterState.statuses.some(st =>
        st.toLowerCase() === dSpec ||
        (st.toLowerCase() === 'active' && d.active !== false) ||
        (st.toLowerCase() === 'inactive' && d.active === false)
      );
      if (!matchStatus) return false;
    }

    // Filter by Date Range (createdAt)
    if (filterState.startDate || filterState.endDate) {
      const rawDate = (d as any).createdAt;
      if (rawDate) {
        const dDate = new Date(rawDate);
        if (filterState.startDate && dDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && dDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter;
    if (qk === 'active' && d.active === false) return false;
    if (qk === 'inactive' && d.active !== false) return false;

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / pageSize));
  const paginatedDoctors = filteredDoctors.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredDoctors.length > 0 && filteredDoctors.every(d => selected.has(d.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredDoctors.map(d => d.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
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
    toast.success(`Processed ${selectedIds.length} physician(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await doctorsApi.delete(id).catch(() => {});
          count++;
        }
        setDoctors(prev => prev.filter(d => !selected.has(d.id)));
        toast.success(`Deleted ${count} physician(s) successfully`);
      }
      setSelected(new Set());
      fetchDoctors();
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
      const { imageFile, ...rest } = formData;
      await doctorsApi.create(rest, imageFile || undefined);
      toast.success('Physician created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create physician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setSubmitting(true);
    try {
      const { imageFile, ...rest } = formData;
      await doctorsApi.update(selectedDoctor.id, rest, imageFile || undefined);
      toast.success('Physician updated successfully');
      setIsEditModalOpen(false);
      fetchDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update physician');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoctor) return;
    setSubmitting(true);
    try {
      await doctorsApi.delete(selectedDoctor.id);
      toast.success('Physician deleted successfully');
      setIsDeleteModalOpen(false);
      fetchDoctors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete physician');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      address: doctor.address || '',
      licenseNumber: doctor.licenseNumber || '',
      imageFile: null,
    });
    setImagePreview(doctor.imageUrl || null);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      phone: '',
      email: '',
      address: '',
      licenseNumber: '',
      imageFile: null,
    });
    setImagePreview(null);
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Clinical</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Doctors Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Prescribing Physicians
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage partner physicians, specializations, and medical license numbers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Physicians_Directory"
            title="Doctors Export"
            headers={['ID', 'Doctor Name', 'Specialization', 'License No', 'Phone', 'Email']}
            rows={filteredDoctors.map(d => [
              d.id || 0,
              d.name || '',
              d.specialization || '',
              d.licenseNumber || '',
              d.phone || '',
              d.email || '',
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
            <span>New Doctor</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Physicians</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Stethoscope className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{doctors.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Registered</span>
          </div>
          <p className="text-xs text-muted mt-1">Partner doctors</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Specialists</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Award className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{doctors.filter(d => d.specialization).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Specialized care providers</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Licensed Doctors</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><UserCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{doctors.filter(d => d.licenseNumber).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Verified license numbers</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={doctors.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search doctors by name, specialization, phone, license..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
            }}
            availableStatuses={['General Practitioner', 'Pharmacist', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Active', 'Inactive']}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Specialization', value: 'specialization' },
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
          <p className="text-sm text-muted mt-3 font-medium">Loading doctors directory...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Stethoscope className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Physicians Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No doctor matched "${searchTerm}"` : 'Add your first partner physician.'}
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
                <th className="px-4 py-3.5">Doctor Name</th>
                <th className="px-4 py-3.5">Specialization</th>
                <th className="px-4 py-3.5">License Number</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedDoctors.map((d, idx) => {
                const isChecked = selected.has(d.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={d.id}
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
                        onChange={() => toggleSel(d.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={d.imageUrl}
                          alt={d.name}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                          fallback={
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {(d.name || 'D').charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <span className="font-bold text-foreground">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                        <Award className="h-3 w-3 text-primary" />
                        {d.specialization || 'General Practice'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{d.licenseNumber || '�'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted" />
                        {d.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted" />
                        {d.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoctor(d);
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
          {paginatedDoctors.map((d, idx) => {
            const isChecked = selected.has(d.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={d.id}
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
                        onChange={() => toggleSel(d.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant="success">Physician</Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={d.imageUrl}
                      alt={d.name}
                      className="w-12 h-12 rounded-full object-cover border border-border shadow-sm"
                      fallback={
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {(d.name || 'D').charAt(0).toUpperCase()}
                        </div>
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-foreground text-sm truncate">{d.name}</h4>
                      <p className="text-xs text-primary font-semibold truncate">{d.specialization || 'General Practice'}</p>
                      <p className="text-[11px] font-mono text-muted truncate mt-0.5">{d.phone || 'No Phone'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(d)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctor(d);
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
          Showing <strong>{paginatedDoctors.length}</strong> of <strong>{filteredDoctors.length}</strong> physicians
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

      {/* 7. Create Doctor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Physician"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Photo Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Doctor Photo
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
                <div className="relative w-full h-28 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-28 object-contain rounded-xl shadow-md" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-1">
                  <UploadCloud className="h-7 w-7 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">Click or Drag Photo to Upload</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Doctor Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Cardiology"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Medical License Number
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g. MED-889977"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 012345678"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. dr.jenkins@clinic.com"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Clinic Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Phnom Penh, Cambodia"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Adding...' : 'Add Physician'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Doctor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Physician Details"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          {/* Photo Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Doctor Photo
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
                <div className="relative w-full h-28 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-28 object-contain rounded-xl shadow-md" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-1">
                  <UploadCloud className="h-7 w-7 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">Click or Drag Photo to Change</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Doctor Name *
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
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Medical License Number
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
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

      {/* 9. Delete Doctor Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Doctor Record"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete <strong>{selectedDoctor?.name}</strong>? This action cannot be undone.
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
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Physicians`}
        message={`${selected.size} physician(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}