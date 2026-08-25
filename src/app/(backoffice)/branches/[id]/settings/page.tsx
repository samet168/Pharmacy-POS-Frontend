'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { branchSettingsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function BranchSettingsPage() {
  const params = useParams();
  const branchId = Number(params.id);
  const [settings, setSettings] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    taxId: '',
    receiptHeader: '',
    receiptFooter: '',
    defaultPaymentMethod: '',
    referenceRateUsdToKhr: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [branchId]);

  const fetchSettings = async () => {
    try {
      const data = await branchSettingsApi.getByBranch(branchId);
      setSettings(data as any);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load branch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await branchSettingsApi.upsert({
        branchId,
        ...settings,
        referenceRateUsdToKhr: settings.referenceRateUsdToKhr ? Number(settings.referenceRateUsdToKhr) : undefined,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
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
        <h1 className="text-2xl font-bold text-slate-900">Branch Settings</h1>
        <p className="text-slate-600">Configure branch-specific settings</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Business Information</h2>
          <div className="space-y-4">
            <Input
              label="Business Name"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
            <Input
              label="Address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
            <Input
              label="Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
            <Input
              label="Operating Hours"
              value={settings.operatingHours}
              onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
              placeholder="e.g., Mon-Fri 8:00-20:00"
            />
            <Input
              label="Tax ID"
              value={settings.taxId}
              onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Receipt Configuration</h2>
          <div className="space-y-4">
            <Input
              label="Receipt Header"
              value={settings.receiptHeader}
              onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
              placeholder="Header text that appears on receipts"
            />
            <Input
              label="Receipt Footer"
              value={settings.receiptFooter}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              placeholder="Footer text that appears on receipts"
            />
            <Input
              label="Default Payment Method"
              value={settings.defaultPaymentMethod}
              onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
              placeholder="e.g., CASH, KHQR, CARD"
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Exchange Rate</h2>
          <Input
            label="Reference Rate USD to KHR"
            type="number"
            value={settings.referenceRateUsdToKhr}
            onChange={(e) => setSettings({ ...settings, referenceRateUsdToKhr: e.target.value })}
            icon={<DollarSign className="h-5 w-5" />}
            placeholder="e.g., 4100"
            helperText="Used for displaying secondary currency on receipts"
          />
        </Card>

        <Button onClick={handleSave} loading={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}