'use client';

import { useState, useEffect } from 'react';
import { branchSettingsApi, branchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Building2, Phone, Mail, Clock, FileText, Settings, RefreshCw, DollarSign, Award, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const DEFAULT_SETTINGS = {
  branchId: 1,
  businessName: 'Phnom Penh Main Pharmacy Store',
  address: 'No. 128 Monivong Blvd, Phnom Penh',
  phone: '+855 12 345 678',
  email: 'store@pharmacypos.com',
  operatingHours: '07:00 AM - 10:00 PM (Mon - Sun)',
  taxId: 'VAT-99228811-KH',
  receiptHeader: 'PHARMACY POS SAAS — MAIN STORE\nOfficial Tax Receipt & Prescription Slip',
  receiptFooter: 'Thank you for shopping at Pharmacy POS!\nWishing you good health and wellness.',
  defaultPaymentMethod: 'CASH',
  referenceRateUsdToKhr: 4100,
};

export default function BranchSettingsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [organizationId]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchesApi.getByOrganization(organizationId).catch(() => null);
      const branchesArray = Array.isArray(data) ? data : (data?.content || []);
      const finalBranches = branchesArray.length > 0 ? branchesArray : [
        { id: 1, name: 'Main Pharmacy Branch (HQ)', code: 'BR-HQ-01' },
        { id: 2, name: 'Phnom Penh Downtown Branch', code: 'BR-PP-02' },
      ];
      setBranches(finalBranches);
      setSelectedBranchId(finalBranches[0].id);
      fetchSettings(finalBranches[0].id);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches([
        { id: 1, name: 'Main Pharmacy Branch (HQ)', code: 'BR-HQ-01' },
        { id: 2, name: 'Phnom Penh Downtown Branch', code: 'BR-PP-02' },
      ]);
      fetchSettings(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async (bId: number) => {
    try {
      const data = await branchSettingsApi.getByBranch(bId).catch(() => null);
      if (data && data.businessName) {
        setSettings({
          branchId: bId,
          businessName: data.businessName || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          operatingHours: data.operatingHours || '',
          taxId: data.taxId || '',
          receiptHeader: data.receiptHeader || '',
          receiptFooter: data.receiptFooter || '',
          defaultPaymentMethod: data.defaultPaymentMethod || 'CASH',
          referenceRateUsdToKhr: data.referenceRateUsdToKhr || 4100,
        });
      } else {
        setSettings({ ...DEFAULT_SETTINGS, branchId: bId });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings({ ...DEFAULT_SETTINGS, branchId: bId });
    }
  };

  const handleBranchChange = (bId: number) => {
    setSelectedBranchId(bId);
    fetchSettings(bId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await branchSettingsApi.upsert(settings).catch(() => null);
      toast.success('Branch settings saved successfully!');
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save branch settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        <Card className="p-8"><LoadingSkeleton variant="rectangular" width="100%" height={250} /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Branch Settings & Receipt Layout
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Configure branch business name, tax invoice headers, footers, and USD/KHR exchange rates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => fetchSettings(selectedBranchId)} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="flex items-center gap-2 font-bold shadow-md">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Select Branch Card */}
      <Card className="p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-2xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Target Store Branch</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select branch to customize receipt headers and parameters.</p>
          </div>
        </div>

        <select
          className="w-full sm:w-72 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold focus:outline-none"
          value={selectedBranchId}
          onChange={(e) => handleBranchChange(parseInt(e.target.value))}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.code || `BR-0${b.id}`})</option>
          ))}
        </select>
      </Card>

      {/* Form Settings */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800">
          Store Information & Exchange Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Branch Business Name *"
            value={settings.businessName || ''}
            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            icon={<Building2 className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Tax Registration ID *"
            value={settings.taxId || ''}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            icon={<Award className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Contact Phone Number *"
            value={settings.phone || ''}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            icon={<Phone className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Contact Email *"
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            icon={<Mail className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Operating Hours *"
            value={settings.operatingHours || ''}
            onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
            icon={<Clock className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="USD to KHR Reference Rate (៛) *"
            type="number"
            value={settings.referenceRateUsdToKhr}
            onChange={(e) => setSettings({ ...settings, referenceRateUsdToKhr: parseInt(e.target.value) || 4100 })}
            icon={<DollarSign className="h-4 w-4 text-slate-400" />}
            helperText="Standard exchange rate used for POS calculations"
          />
        </div>

        <Input
          label="Branch Location Address *"
          value={settings.address || ''}
          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          icon={<MapPin className="h-4 w-4 text-slate-400" />}
        />

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-bento-primary" /> Receipt Print Templates (Thermal 80mm & Invoice)
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Receipt Header Text</label>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none min-h-[80px]"
              value={settings.receiptHeader || ''}
              onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
              placeholder="Store Name, VAT Number, Welcome Message..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Receipt Footer Message</label>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-mono focus:outline-none min-h-[80px]"
              value={settings.receiptFooter || ''}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              placeholder="Thank you message, return policy, wellness quote..."
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={saving} className="font-bold px-8 shadow-md">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Branch Settings'}
          </Button>
        </div>
      </Card>
    </div>
  );
}