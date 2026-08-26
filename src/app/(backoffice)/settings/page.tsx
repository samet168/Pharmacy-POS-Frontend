'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Settings,
  User,
  Lock,
  Building2,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Globe,
  Bell,
  Monitor,
  Printer,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Key,
  Smartphone,
  Store,
  Receipt,
  FileText,
  Clock,
  Radio,
} from 'lucide-react';

export default function SettingsHubPage() {
  const { user, currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const orgName = currentUser?.organizationName || user?.organizationName || 'Phnom Penh Central Pharmacy';
  const roleName = currentUser?.roleName || user?.roleName || 'Pharmacist Administrator';
  const userName = currentUser?.name || user?.name || currentUser?.username || 'admin';

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={6} />;
  }

  const settingsCards = [
    {
      title: 'User Profile & Identity',
      description: 'Manage personal details, contact information, role assignments, and organizational profile.',
      icon: User,
      href: '/settings/profile',
      badge: 'Active User',
      badgeVariant: 'success' as const,
      color: 'bg-primary/10 text-primary border-primary/20',
      stats: `${userName} • ${roleName}`,
    },
    {
      title: 'Security & Password',
      description: 'Update account password, manage active POS sessions, and configure authentication safety.',
      icon: Lock,
      href: '/settings/change-password',
      badge: 'Protected',
      badgeVariant: 'neutral' as const,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      stats: 'Last changed 14 days ago',
    },
    {
      title: 'Branch & Store Configuration',
      description: 'Configure store operating hours, tax IDs, USD/KHR exchange rates, and POS receipt headers.',
      icon: Building2,
      href: '/branch-settings',
      badge: 'Store Operations',
      badgeVariant: 'info' as const,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      stats: `${orgName} (HQ)`,
    },
    {
      title: 'System Preferences & Tuning',
      description: 'Customize UI theme mode, low-stock thresholds, expiry alerts, sound cues, and currency decimals.',
      icon: Sliders,
      href: '/system-settings',
      badge: 'System Rules',
      badgeVariant: 'warning' as const,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      stats: '6 Active System Policies',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Administration</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Settings Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Settings className="h-7 w-7 text-primary shrink-0" />
              Settings &amp; Preferences
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Configuration
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized administrative controls for personal account, store branches, POS tax parameters, and system behaviors.
          </p>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: User Account */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Account Status
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {userName}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-primary">{roleName}</span>
          </div>
        </div>

        {/* Card 2: Security Health */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Security Level
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Lock className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              Optimal
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Key className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted credentials</span>
          </div>
        </div>

        {/* Card 3: Organization */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Store Organization
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {orgName}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Multi-branch enabled</span>
          </div>
        </div>

        {/* Card 4: Currency & Tax */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Currency &amp; Rate
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              USD / KHR
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>$1 = 4,100 KHR Reference</span>
          </div>
        </div>
      </div>

      {/* 3. Bento Navigation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="group bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${card.color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={card.badgeVariant}>{card.badge}</Badge>
                    <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{card.stats}</span>
                <span className="text-primary font-bold font-sans flex items-center gap-1 group-hover:underline">
                  Configure
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 4. Quick Help & Operational Tips Bento Section */}
      <div className="bg-gradient-to-br from-primary/5 via-slate-50 to-indigo-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary rounded-2xl text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pharmacy POS Multi-Tenant Administration Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Changes to tax identification, business legal names, and USD/KHR exchange rates instantly propagate to all active register terminals upon next cashier checkout.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/branch-settings">
              <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl shadow-md">
                Configure Tax &amp; Receipts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
