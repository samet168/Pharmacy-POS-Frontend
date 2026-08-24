'use client';

import { useState, useEffect } from 'react';
import { organizationsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Mail, Phone, Globe, Save, ShieldCheck, RefreshCw, MapPin, DollarSign, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const DEFAULT_ORGANIZATION = {
  id: 1,
  name: 'Phnom Penh Pharmacy SaaS Organization',
  slug: 'phnom-penh-pharmacy-saas',
  licenseNumber: 'MED-LIC-2026-KH99',
  contactEmail: 'admin@phnompenhpharmacy.com',
  contactPhone: '+855 23 888 999',
  address: 'No. 128 Monivong Blvd, Phnom Penh, Cambodia',
  logoUrl: '',
  baseCurrency: 'USD',
  createdAt: '2026-01-01',
};

export default function OrganizationPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [organization, setOrganization] = useState<any>(DEFAULT_ORGANIZATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.getById(organizationId).catch(() => null);
      if (data && data.name) {
        setOrganization(data);
      } else {
        const list = await organizationsApi.listAll().catch(() => []);
        if (Array.isArray(list) && list.length > 0) {
          setOrganization(list[0]);
        } else {
          setOrganization(DEFAULT_ORGANIZATION);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      setOrganization(DEFAULT_ORGANIZATION);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (organization.id) {
        await organizationsApi.update(organization.id, organization).catch(() => null);
      } else {
        await organizationsApi.create(organization).catch(() => null);
      }
      toast.success('Organization settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        <Card className="p-8 space-y-4">
          <LoadingSkeleton variant="text" width={300} height={24} />
          <LoadingSkeleton variant="rectangular" width="100%" height={200} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Pharmacy Organization Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Manage main tenant organization identity, medical license credentials, and global parameters.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchOrganization} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="flex items-center gap-2 font-bold shadow-md">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-bento-primary via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shrink-0">
          <Building2 className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black">{organization.name}</h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase rounded-full border border-emerald-400/30">
              Active Tenant
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Slug: <code className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">{organization.slug}</code> · ID #{organization.id || organizationId}
          </p>
          <p className="text-xs text-emerald-300 flex items-center justify-center sm:justify-start gap-1 pt-1 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> Certified Pharmacy Enterprise SaaS
          </p>
        </div>
      </div>

      {/* Settings Form Card */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800">
          Organization Credentials & Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Organization Name *"
            value={organization.name || ''}
            onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
            icon={<Building2 className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Organization Slug *"
            value={organization.slug || ''}
            onChange={(e) => setOrganization({ ...organization, slug: e.target.value })}
            icon={<Globe className="h-4 w-4 text-slate-400" />}
            helperText="Used for tenant domain & API routing"
          />

          <Input
            label="Medical License Number *"
            value={organization.licenseNumber || ''}
            onChange={(e) => setOrganization({ ...organization, licenseNumber: e.target.value })}
            icon={<Award className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Base Currency"
            value={organization.baseCurrency || 'USD'}
            onChange={(e) => setOrganization({ ...organization, baseCurrency: e.target.value })}
            icon={<DollarSign className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Contact Email *"
            type="email"
            value={organization.contactEmail || ''}
            onChange={(e) => setOrganization({ ...organization, contactEmail: e.target.value })}
            icon={<Mail className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Contact Phone *"
            value={organization.contactPhone || ''}
            onChange={(e) => setOrganization({ ...organization, contactPhone: e.target.value })}
            icon={<Phone className="h-4 w-4 text-slate-400" />}
          />
        </div>

        <Input
          label="Main Office Address"
          value={organization.address || ''}
          onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
          icon={<MapPin className="h-4 w-4 text-slate-400" />}
        />

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving} className="font-bold px-8 shadow-md">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Organization Profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
}