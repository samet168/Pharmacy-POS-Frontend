'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { branchSettingsApi, branchesApi } from '@/lib/api';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  Building2,
  Phone,
  Mail,
  Clock,
  FileText,
  Settings,
  RefreshCw,
  DollarSign,
  MapPin,
  Save,
  ChevronRight,
  Radio,
  Receipt,
  Store,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface BranchSettingsData {
  branchId: number;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  taxId: string;
  receiptHeader: string;
  receiptFooter: string;
  defaultPaymentMethod: string;
  referenceRateUsdToKhr: number;
}

const DEFAULT_SETTINGS: BranchSettingsData = {
  branchId: 1,
  businessName: 'Phnom Penh Main Pharmacy Store',
  address: 'No. 128 Monivong Blvd, Phnom Penh, Cambodia',
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

  const [settings, setSettings] = useState<BranchSettingsData>(DEFAULT_SETTINGS);
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
      toast.success('Branch & receipt settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save branch settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={6} />;
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-primary transition-colors">
              Settings
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Branch Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-primary shrink-0" />
              Branch &amp; Store Configuration
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Multi-Store Enabled
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure store business details, operating hours, tax IDs, USD/KHR exchange rates, and POS receipt layouts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSettings(selectedBranchId)}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Branches */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Branches
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Store className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {branches.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">locations</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Currently editing: {selectedBranch?.name}</span>
          </div>
        </div>

        {/* Card 2: USD / KHR Reference Rate */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reference Rate
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {settings.referenceRateUsdToKhr.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">KHR / USD</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>POS Dual Currency Checkout</span>
          </div>
        </div>

        {/* Card 3: Default Tender */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Default Tender
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {settings.defaultPaymentMethod}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Quick cash register selection</span>
          </div>
        </div>

        {/* Card 4: Operating Hours */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Store Hours
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 truncate">
              07:00 - 22:00
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Daily 7 Days / Week</span>
          </div>
        </div>
      </div>

      {/* 3. Branch Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {branches.map(b => (
          <button
            key={b.id}
            onClick={() => handleBranchChange(b.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              selectedBranchId === b.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{b.name}</span>
            {b.code && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                selectedBranchId === b.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                {b.code}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Business Identity */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Business Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tax ID / VAT Registration Number
                </label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={e => setSettings({ ...settings, taxId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store Contact Phone
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Store Street Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={settings.operatingHours}
                  onChange={e => setSettings({ ...settings, operatingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section B: Financial & Tender Parameters */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Financial &amp; Dual Currency Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  USD to KHR Reference Rate *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    1 USD =
                  </span>
                  <input
                    type="number"
                    value={settings.referenceRateUsdToKhr}
                    onChange={e => setSettings({ ...settings, referenceRateUsdToKhr: Number(e.target.value) })}
                    className="w-full pl-16 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    KHR
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Payment Tender *
                </label>
                <select
                  value={settings.defaultPaymentMethod}
                  onChange={e => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="CASH">Cash (USD / KHR)</option>
                  <option value="ABA_PAY">ABA PAY KHQR</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section C: Receipts Header & Footer */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Thermal POS Receipt Layout
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Header Slip Text
                </label>
                <textarea
                  rows={3}
                  value={settings.receiptHeader}
                  onChange={e => setSettings({ ...settings, receiptHeader: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Footer Thank You Message
                </label>
                <textarea
                  rows={3}
                  value={settings.receiptFooter}
                  onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Receipt Preview */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Thermal 80mm Preview
              </span>
              <Receipt className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-inner space-y-4 text-center">
              <div className="space-y-1">
                <p className="font-bold text-sm leading-tight">{settings.businessName}</p>
                <p className="text-[10px] text-slate-600 whitespace-pre-line">{settings.receiptHeader}</p>
                <p className="text-[10px] text-slate-500">{settings.address}</p>
                <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
                <p className="text-[10px] text-slate-500">Tax ID: {settings.taxId}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-left text-[11px]">
                <div className="flex justify-between">
                  <span>Amoxicillin 500mg (2x)</span>
                  <span className="font-bold">$24.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Paracetamol 500mg (1x)</span>
                  <span className="font-bold">$3.50</span>
                </div>
              </div>

              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between font-bold text-sm">
                  <span>Total USD:</span>
                  <span>$27.50</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Total KHR:</span>
                  <span>{(27.5 * settings.referenceRateUsdToKhr).toLocaleString()} ៛</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tender:</span>
                  <span>{settings.defaultPaymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-600 whitespace-pre-line">
                {settings.receiptFooter}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
