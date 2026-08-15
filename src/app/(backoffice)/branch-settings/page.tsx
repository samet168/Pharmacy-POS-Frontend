'use client';

import { useState, useEffect } from 'react';
import { branchSettingsApi, branchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Building2, Phone, Mail, Clock, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

export default function BranchSettingsPage() {
  const [settings, setSettings] = useState({
    branchId: 0,
    businessName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    taxId: '',
    receiptHeader: '',
    receiptFooter: '',
    defaultPaymentMethod: '',
    referenceRateUsdToKhr: 4100,
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const organizationId = useAuthStore.getState().user?.organizationId || 1;
      const data = await branchesApi.getByOrganization(organizationId);
      const branchesArray = Array.isArray(data) ? data : (data?.content || []);
      setBranches(branchesArray);
      if (branchesArray.length > 0) {
        fetchSettings(branchesArray[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async (branchId: number) => {
    try {
      const data = await branchSettingsApi.getByBranch(branchId);
      setSettings({
        branchId: branchId,
        businessName: data.businessName || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        operatingHours: data.operatingHours || '',
        taxId: data.taxId || '',
        receiptHeader: data.receiptHeader || '',
        receiptFooter: data.receiptFooter || '',
        defaultPaymentMethod: data.defaultPaymentMethod || '',
        referenceRateUsdToKhr: data.referenceRateUsdToKhr || 4100,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleBranchChange = (branchId: number) => {
    setSettings({ ...settings, branchId });
    fetchSettings(branchId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await branchSettingsApi.upsert(settings);
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

      <Card className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Branch
          </label>
          <select
            value={settings.branchId}
            onChange={(e) => handleBranchChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              icon={<Building2 className="h-5 w-5" />}
            />
            <Input
              label="Address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              icon={<Phone className="h-5 w-5" />}
            />
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              icon={<Mail className="h-5 w-5" />}
            />
          </div>

          <Input
            label="Operating Hours"
            value={settings.operatingHours}
            onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
            icon={<Clock className="h-5 w-5" />}
            helperText="e.g., Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM"
          />

          <Input
            label="Tax ID"
            value={settings.taxId}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Payment Method"
              value={settings.defaultPaymentMethod}
              onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
              icon={<Settings className="h-5 w-5" />}
            />
            <Input
              label="Exchange Rate (USD to KHR)"
              type="number"
              value={settings.referenceRateUsdToKhr}
              onChange={(e) => setSettings({ ...settings, referenceRateUsdToKhr: Number(e.target.value) })}
              helperText="Used for currency conversion"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipt Settings
            </h3>
            <div className="space-y-4">
              <Input
                label="Receipt Header"
                value={settings.receiptHeader}
                onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                helperText="Text to appear at the top of receipts"
              />
              <Input
                label="Receipt Footer"
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                helperText="Text to appear at the bottom of receipts"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}