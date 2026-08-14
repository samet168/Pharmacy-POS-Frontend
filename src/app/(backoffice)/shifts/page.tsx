'use client';

import { useState, useEffect } from 'react';
import { shiftsApi, usersApi, branchesApi, devicesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Trash2, Clock, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    userId: '',
    branchId: '',
    deviceId: '',
    openingCash: '',
  });
  const [closeFormData, setCloseFormData] = useState({
    actualCash: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftsData, usersData, branchesData, devicesData] = await Promise.all([
        shiftsApi.listAll().catch(() => []),
        usersApi.listAll().catch(() => []),
        branchesApi.listAll().catch(() => []),
        devicesApi.listAll().catch(() => []),
      ]);
      setShifts(shiftsData);
      setUsers(usersData);
      setBranches(branchesData);
      setDevices(devicesData);
      setTotalPages(Math.ceil(shiftsData.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter((shift: any) =>
    users.find((u: any) => u.id === shift.userId)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branches.find((b: any) => b.id === shift.branchId)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedShifts = filteredShifts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shiftsApi.create({
        userId: parseInt(formData.userId),
        branchId: parseInt(formData.branchId),
        deviceId: formData.deviceId ? parseInt(formData.deviceId) : undefined,
        openingCash: parseFloat(formData.openingCash),
      });
      toast.success('Shift created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        userId: '',
        branchId: '',
        deviceId: '',
        openingCash: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create shift:', error);
      toast.error(error.response?.data?.message || 'Failed to create shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shiftsApi.close(selectedShift.id, {
        actualCash: parseFloat(closeFormData.actualCash),
      });
      toast.success('Shift closed successfully');
      setIsCloseModalOpen(false);
      setSelectedShift(null);
      setCloseFormData({ actualCash: '' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to close shift:', error);
      toast.error(error.response?.data?.message || 'Failed to close shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await shiftsApi.delete(selectedShift.id);
      toast.success('Shift deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedShift(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete shift:', error);
      toast.error(error.response?.data?.message || 'Failed to delete shift');
    } finally {
      setSubmitting(false);
    }
  };

  const openCloseModal = (shift: any) => {
    setSelectedShift(shift);
    setCloseFormData({
      actualCash: shift.actualCash?.toString() || shift.openingCash?.toString() || '',
    });
    setIsCloseModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success">Open</Badge>;
      case 'CLOSED':
        return <Badge variant="warning">Closed</Badge>;
      case 'RECONCILED':
        return <Badge variant="info">Reconciled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Shifts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage staff shifts and cash register operations</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Open New Shift
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search shifts by staff, branch, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>
          <div className="flex items-center gap-2">
            <select className="px-4 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100">
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="RECONCILED">Reconciled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Shifts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Staff</TableHeader>
                <TableHeader>Branch</TableHeader>
                <TableHeader>Device</TableHeader>
                <TableHeader>Opened At</TableHeader>
                <TableHeader>Closed At</TableHeader>
                <TableHeader>Opening Cash</TableHeader>
                <TableHeader>Actual Cash</TableHeader>
                <TableHeader>Difference</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedShifts.length > 0 ? (
                paginatedShifts.map((shift: any) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {users.find((u: any) => u.id === shift.userId)?.name || '-'}
                    </TableCell>
                    <TableCell>{branches.find((b: any) => b.id === shift.branchId)?.name || '-'}</TableCell>
                    <TableCell>{devices.find((d: any) => d.id === shift.deviceId)?.deviceName || '-'}</TableCell>
                    <TableCell>{formatDate(shift.openedAt)}</TableCell>
                    <TableCell>{formatDate(shift.closedAt)}</TableCell>
                    <TableCell>${shift.openingCash?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${shift.actualCash?.toFixed(2) || '-'}</TableCell>
                    <TableCell>
                      {shift.difference !== undefined && shift.difference !== null ? (
                        <span className={shift.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${shift.difference.toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(shift.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shift.status === 'OPEN' && (
                          <button 
                            className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                            onClick={() => openCloseModal(shift)}
                            title="Close Shift"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedShift(shift);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Shift"
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
                      <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No shifts found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm ? 'Try adjusting your search' : 'Open your first shift to get started'}
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredShifts.length)} of {filteredShifts.length} shifts
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
        title="Open New Shift"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Staff Member *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">Select Staff Member</option>
              {users.filter((u: any) => u.active).map((user: any) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Branch *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
            >
              <option value="">Select Branch</option>
              {branches.filter((b: any) => b.active).map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Device (Optional)</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
            >
              <option value="">Select Device</option>
              {devices.filter((d: any) => d.active).map((device: any) => (
                <option key={device.id} value={device.id}>{device.deviceName || device.deviceUuid}</option>
              ))}
            </select>
          </div>
          <Input
            label="Opening Cash Amount *"
            type="number"
            step="0.01"
            min="0"
            value={formData.openingCash}
            onChange={(e) => setFormData({ ...formData, openingCash: e.target.value })}
            required
          />
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
              Open Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Shift Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Close Shift"
        size="md"
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="bg-bento-bg dark:bg-slate-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Staff:</span> {users.find((u: any) => u.id === selectedShift?.userId)?.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Branch:</span> {branches.find((b: any) => b.id === selectedShift?.branchId)?.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Opened:</span> {formatDate(selectedShift?.openedAt)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Opening Cash:</span> ${selectedShift?.openingCash?.toFixed(2)}
            </p>
          </div>
          <Input
            label="Actual Cash Amount *"
            type="number"
            step="0.01"
            min="0"
            value={closeFormData.actualCash}
            onChange={(e) => setCloseFormData({ ...closeFormData, actualCash: e.target.value })}
            required
            helperText="Enter the actual cash count in the register"
          />
          {closeFormData.actualCash && selectedShift && (
            <div className="p-3 bg-bento-bg dark:bg-slate-800 rounded-lg">
              <p className="text-sm">
                <span className="font-medium text-bento-primary dark:text-slate-100">Difference:</span>{' '}
                <span className={parseFloat(closeFormData.actualCash) - selectedShift.openingCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${(parseFloat(closeFormData.actualCash) - selectedShift.openingCash).toFixed(2)}
                </span>
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsCloseModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Close Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Shift"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this shift? This action cannot be undone.
          </p>
          <div className="bg-bento-bg dark:bg-slate-800 p-4 rounded-lg space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Staff:</span> {users.find((u: any) => u.id === selectedShift?.userId)?.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Branch:</span> {branches.find((b: any) => b.id === selectedShift?.branchId)?.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Status:</span> {selectedShift?.status}
            </p>
          </div>
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
              Delete Shift
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
