'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { organizationsApi, Organization, OrganizationRequest } from '@/lib/api/organizations';
import { Building2, Search, Plus, Edit, Trash2, RefreshCw, Mail, Phone, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
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
  const [saving, setSaving] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.listAll();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.slug || !formData.baseCurrency) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await organizationsApi.create(formData);
      toast.success('Organization created successfully');
      setShowCreateModal(false);
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
      fetchOrganizations();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrg || !formData.name || !formData.slug || !formData.baseCurrency) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await organizationsApi.update(selectedOrg.id, formData);
      toast.success('Organization updated successfully');
      setShowEditModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    try {
      setSaving(true);
      await organizationsApi.delete(selectedOrg.id);
      toast.success('Organization deleted successfully');
      setShowDeleteModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
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
      baseCurrency: org.baseCurrency,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteModal(true);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Organizations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage pharmacy organizations and their settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchOrganizations}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search organizations by name, slug, or license number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Organizations Table */}
      <Card className="overflow-hidden">
        {filteredOrganizations.length === 0 ? (
          <EmptyState
            title="No organizations found"
            description={
              searchTerm
                ? 'Try adjusting your search criteria'
                : 'No organizations have been created yet'
            }
            action={
              !searchTerm && (
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Organization
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Slug</TableHeader>
                  <TableHeader>License Number</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Currency</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">#{org.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {org.logoUrl && (
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{org.slug}</TableCell>
                    <TableCell>{org.licenseNumber || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {org.contactEmail && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{org.contactEmail}</span>
                          </div>
                        )}
                        {org.contactPhone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{org.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{org.baseCurrency}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.active ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(org)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(org)}
                          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Organization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization Name *
            </label>
            <Input
              placeholder="Enter organization name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug *
            </label>
            <Input
              placeholder="Enter unique slug (e.g., my-pharmacy)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              License Number
            </label>
            <Input
              placeholder="Enter license number"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Email
            </label>
            <Input
              type="email"
              placeholder="Enter contact email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Phone
            </label>
            <Input
              placeholder="Enter contact phone"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address
            </label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              placeholder="Enter organization address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Base Currency *
            </label>
            <select
              value={formData.baseCurrency}
              onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="KHR">KHR - Cambodian Riel</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} loading={saving} className="flex-1">
              Create Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Organization - ${selectedOrg?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization Name *
            </label>
            <Input
              placeholder="Enter organization name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug *
            </label>
            <Input
              placeholder="Enter unique slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              License Number
            </label>
            <Input
              placeholder="Enter license number"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Email
            </label>
            <Input
              type="email"
              placeholder="Enter contact email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Contact Phone
            </label>
            <Input
              placeholder="Enter contact phone"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Address
            </label>
            <textarea
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              rows={3}
              placeholder="Enter organization address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Base Currency *
            </label>
            <select
              value={formData.baseCurrency}
              onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="KHR">KHR - Cambodian Riel</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleUpdate} loading={saving} className="flex-1">
              Update Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Organization"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Building2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Deleting the organization will also delete all associated branches, users, and data. This action is irreversible.
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{selectedOrg?.name}</strong>?
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDelete}
              loading={saving}
              variant="danger"
              className="flex-1"
            >
              Delete Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}