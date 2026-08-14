'use client';

import { useState, useEffect } from 'react';
import { organizationsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Mail, Phone, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizationPage() {
  const [organization, setOrganization] = useState({
    name: '',
    slug: '',
    licenseNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    logoUrl: '',
    baseCurrency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const data = await organizationsApi.listAll();
      if (data.length > 0) {
        setOrganization(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (organization.id) {
        await organizationsApi.update(organization.id, organization);
      } else {
        await organizationsApi.create(organization);
      }
      toast.success('Organization saved successfully');
    } catch (error) {
      toast.error('Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-600">Configure your pharmacy organization</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{organization.name || 'Organization Name'}</h2>
            <p className="text-slate-600 text-sm">{organization.slug || 'organization-slug'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Organization Name"
            value={organization.name}
            onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
            icon={<Building2 className="h-5 w-5" />}
          />
          <Input
            label="Slug"
            value={organization.slug}
            onChange={(e) => setOrganization({ ...organization, slug: e.target.value })}
            icon={<Globe className="h-5 w-5" />}
            helperText="Used for URLs and identification"
          />
          <Input
            label="License Number"
            value={organization.licenseNumber}
            onChange={(e) => setOrganization({ ...organization, licenseNumber: e.target.value })}
          />
          <Input
            label="Contact Email"
            type="email"
            value={organization.contactEmail}
            onChange={(e) => setOrganization({ ...organization, contactEmail: e.target.value })}
            icon={<Mail className="h-5 w-5" />}
          />
          <Input
            label="Contact Phone"
            value={organization.contactPhone}
            onChange={(e) => setOrganization({ ...organization, contactPhone: e.target.value })}
            icon={<Phone className="h-5 w-5" />}
          />
          <Input
            label="Address"
            value={organization.address}
            onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
          />
          <Input
            label="Base Currency"
            value={organization.baseCurrency}
            onChange={(e) => setOrganization({ ...organization, baseCurrency: e.target.value })}
            helperText="Primary currency for transactions"
          />
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Organization
          </Button>
        </div>
      </Card>
    </div>
  );
}