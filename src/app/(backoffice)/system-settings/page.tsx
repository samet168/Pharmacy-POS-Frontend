'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  Settings,
  Save,
  ChevronRight,
  Radio,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  Shield,
  Layers,
  FileCode,
  DollarSign,
  AlertTriangle,
  Clock,
  Volume2,
  Monitor,
  Moon,
  Sun,
  XCircle,
} from 'lucide-react';

interface SystemSettingItem {
  id: number;
  key: string;
  value: string;
  description: string;
  category: 'INVENTORY' | 'FINANCIAL' | 'INTERFACE' | 'SECURITY';
}

const INITIAL_SETTINGS: SystemSettingItem[] = [
  { id: 1, key: 'company.name', value: 'Phnom Penh Central Pharmacy', description: 'Legal name displayed across reports and invoices', category: 'INTERFACE' },
  { id: 2, key: 'tax.rate.default', value: '10', description: 'Default VAT percentage applied on taxable medications', category: 'FINANCIAL' },
  { id: 3, key: 'currency.symbol', value: '$', description: 'Primary currency symbol for backoffice and catalog', category: 'FINANCIAL' },
  { id: 4, key: 'price.decimal.places', value: '2', description: 'Standard decimal precision for unit prices and invoices', category: 'FINANCIAL' },
  { id: 5, key: 'inventory.low_stock.threshold', value: '15', description: 'Minimum stock count triggering emergency replenishment alert', category: 'INVENTORY' },
  { id: 6, key: 'inventory.expiry_warning.days', value: '60', description: 'Days before expiration to flag medication batch warnings', category: 'INVENTORY' },
  { id: 7, key: 'pos.barcode.beep_sound', value: 'true', description: 'Audio sound feedback on successful barcode scanner read', category: 'INTERFACE' },
  { id: 8, key: 'pos.auto_logout.minutes', value: '30', description: 'Inactivity threshold in minutes before automatic terminal lock', category: 'SECURITY' },
];

type CategoryTab = 'ALL' | 'INVENTORY' | 'FINANCIAL' | 'INTERFACE' | 'SECURITY';
type ViewMode = 'table' | 'cards';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingItem[]>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SystemSettingItem | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'INTERFACE' as SystemSettingItem['category'],
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Filtered Settings
  const filteredSettings = useMemo(() => {
    return settings.filter(item => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesKey = item.key.toLowerCase().includes(q);
        const matchesVal = item.value.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesKey && !matchesVal && !matchesDesc) return false;
      }
      return true;
    });
  }, [settings, activeCategory, searchTerm]);

  // Derived KPI Metrics
  const totalCount = settings.length;
  const inventoryCount = settings.filter(s => s.category === 'INVENTORY').length;
  const financialCount = settings.filter(s => s.category === 'FINANCIAL').length;
  const interfaceCount = settings.filter(s => s.category === 'INTERFACE').length;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      key: '',
      value: '',
      description: '',
      category: 'INTERFACE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SystemSettingItem) => {
    setEditingItem(item);
    setFormData({
      key: item.key,
      value: item.value,
      description: item.description,
      category: item.category,
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.value.trim()) {
      toast.error('Please enter both setting key and value');
      return;
    }

    if (editingItem) {
      setSettings(prev => prev.map(s => s.id === editingItem.id ? { ...formData, id: s.id } : s));
      toast.success('System setting updated successfully!');
    } else {
      const newItem: SystemSettingItem = {
        ...formData,
        id: Date.now(),
      };
      setSettings(prev => [newItem, ...prev]);
      toast.success('New system setting created!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setSettings(prev => prev.filter(s => s.id !== id));
    toast.success('Setting removed from system registry');
  };

  const getCategoryBadge = (cat: SystemSettingItem['category']) => {
    switch (cat) {
      case 'INVENTORY':
        return <Badge variant="warning">INVENTORY</Badge>;
      case 'FINANCIAL':
        return <Badge variant="success">FINANCIAL</Badge>;
      case 'INTERFACE':
        return <Badge variant="info">INTERFACE</Badge>;
      case 'SECURITY':
        return <Badge variant="danger">SECURITY</Badge>;
      default:
        return <Badge variant="neutral">GENERAL</Badge>;
    }
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={8} />;
  }

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
            <span className="text-primary font-bold">System Preferences</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Sliders className="h-7 w-7 text-primary shrink-0" />
              System Preferences &amp; Tuning
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Global Policies
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system-wide behavioral policies, threshold triggers, decimal precisions, and hardware feedback.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Configuration
          </Button>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Parameters */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Parameters
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">policies</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Global application state</span>
          </div>
        </div>

        {/* Card 2: Inventory Thresholds */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stock &amp; Expiry
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {inventoryCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">triggers</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Low stock &amp; expiration alerts</span>
          </div>
        </div>

        {/* Card 3: Financial & Tax */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Financial &amp; VAT
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {financialCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">rules</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Tax %, Currency, Decimals</span>
          </div>
        </div>

        {/* Card 4: Interface & Audio */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hardware &amp; UX
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {interfaceCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">features</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Scanner beep &amp; auto-logout</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Preferences', count: totalCount },
              { id: 'INVENTORY', label: 'Inventory & Alerts', count: inventoryCount },
              { id: 'FINANCIAL', label: 'Financial & VAT', count: financialCount },
              { id: 'INTERFACE', label: 'Interface & Hardware', count: interfaceCount },
              { id: 'SECURITY', label: 'Security & Auth', count: settings.filter(s => s.category === 'SECURITY').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as CategoryTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeCategory === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search parameters by key name, value, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 4. Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-32">Category</th>
                  <th className="py-3 px-4 w-60">Configuration Key</th>
                  <th className="py-3 px-4 w-48">Value</th>
                  <th className="py-3 px-4">Description &amp; Effect</th>
                  <th className="py-3 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {filteredSettings.length > 0 ? (
                  filteredSettings.map(item => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        {getCategoryBadge(item.category)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                        {item.key}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                          {item.value}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Edit Setting"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Setting"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No configuration settings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Cards View Mode */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSettings.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  {getCategoryBadge(item.category)}
                  <span className="text-[10px] font-mono text-slate-400">ID #{item.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs break-all">
                    {item.key}
                  </h3>
                  <div className="pt-1">
                    <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20 inline-block">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(item)}
                  className="text-xs rounded-xl"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Create / Edit Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Sliders className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingItem ? 'Edit Configuration' : 'Add New Configuration'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set policy key, value parameter, and operational scope.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="INTERFACE">Interface &amp; Hardware</option>
                  <option value="FINANCIAL">Financial &amp; VAT</option>
                  <option value="INVENTORY">Inventory &amp; Alerts</option>
                  <option value="SECURITY">Security &amp; Auth</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Configuration Key *
                </label>
                <input
                  type="text"
                  placeholder="e.g. pos.receipt.printer_dpi"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Configuration Value *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 203"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description &amp; Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Explains what this parameter controls..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="text-xs font-bold rounded-xl shadow-md"
                >
                  {editingItem ? 'Save Changes' : 'Create Parameter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
