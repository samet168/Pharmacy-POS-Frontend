'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Clock, User, Building2, Monitor, DollarSign, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';

export default function OpenShiftPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [openingCash, setOpeningCash] = useState('100.00');
  const [selectedBranch, setSelectedBranch] = useState('Main Pharmacy Branch (HQ)');
  const [selectedTerminal, setSelectedTerminal] = useState('POS Terminal #1 (Main Cashier)');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingCash || parseFloat(openingCash) < 0) {
      toast.error('Please enter a valid opening cash float amount');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      toast.success(`Cashier shift opened successfully with $${parseFloat(openingCash).toFixed(2)} float!`);
      setSubmitting(false);
      router.push('/shifts/current');
    }, 600);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          Open Cashier Shift Register
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
          Initialize your cash drawer opening float to start accepting customer sales orders.
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <form onSubmit={handleOpenShift} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-800">
              Shift Parameters & Opening Float
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Cashier Operator</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100">
                  <User className="h-4 w-4 text-bento-primary" /> {user?.username || 'Super Admin'} (ID #{user?.id || 1})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Store Branch Location</label>
                <select
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="Main Pharmacy Branch (HQ)">Main Pharmacy Branch (HQ)</option>
                  <option value="Phnom Penh Downtown Branch">Phnom Penh Downtown Branch</option>
                  <option value="Siem Reap Airport Branch">Siem Reap Airport Branch</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target POS Hardware Terminal</label>
                <select
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                >
                  <option value="POS Terminal #1 (Main Cashier)">POS Terminal #1 (Main Cashier)</option>
                  <option value="Prescription Desk #2 (Tablet)">Prescription Desk #2 (Tablet)</option>
                  <option value="Mobile Delivery POS Handheld">Mobile Delivery POS Handheld</option>
                </select>
              </div>

              <Input
                label="Opening Cash Float Amount ($) *"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                helperText="Initial cash placed in till for customer change"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => router.push('/shifts')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting} className="font-bold px-8 shadow-md flex items-center gap-2">
              {submitting ? 'Opening...' : 'Start Cashier Shift'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
