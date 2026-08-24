'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Clock, CheckCircle2, DollarSign, User, Building2, Monitor, AlertCircle, RefreshCw, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CurrentShiftPage() {
  const { user } = useAuthStore();
  
  const [shift, setShift] = useState({
    id: 102,
    shiftCode: 'SHIFT-2026-0824-02',
    cashierName: user?.username || 'Super Admin',
    branchName: 'Main Pharmacy Branch (HQ)',
    terminalName: 'POS Terminal #1 (Counter 1)',
    openingTime: 'Today, 08:00 AM',
    openingFloatUsd: 150.00,
    cashSalesUsd: 850.00,
    khqrSalesUsd: 420.00,
    cardSalesUsd: 180.00,
    expectedCashUsd: 1000.00,
    status: 'ACTIVE',
  });

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState('1000.00');
  const [submitting, setSubmitting] = useState(false);

  const handleCloseShift = () => {
    setSubmitting(true);
    setTimeout(() => {
      setShift({ ...shift, status: 'CLOSED' });
      toast.success('Current shift closed & till reconciled successfully!');
      setIsCloseModalOpen(false);
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Current Active Shift
            </h1>
            <span className={`px-3 py-1 text-xs font-black uppercase rounded-full ${
              shift.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {shift.status}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Live monitoring of current cashier register sales breakdown and cash drawer float.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {shift.status === 'ACTIVE' && (
            <Button variant="primary" size="sm" onClick={() => setIsCloseModalOpen(true)} className="flex items-center gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700">
              <Lock className="h-4 w-4" /> Close Shift & Reconcile
            </Button>
          )}
        </div>
      </div>

      {/* Hero Shift Details Card */}
      <div className="rounded-3xl bg-gradient-to-r from-bento-primary via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shrink-0">
            <Clock className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold">{shift.shiftCode}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-slate-400" /> Cashier: <strong className="text-white">{shift.cashierName}</strong>
            </p>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> {shift.branchName} · {shift.terminalName}
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right bg-white/10 p-4 rounded-2xl border border-white/10 min-w-[200px]">
          <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">Opening Float Cash</p>
          <h3 className="text-2xl font-black text-emerald-300">${shift.openingFloatUsd.toFixed(2)}</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">Started {shift.openingTime}</p>
        </div>
      </div>

      {/* Live Sales Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>CASH SALES</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">${shift.cashSalesUsd.toFixed(2)}</h3>
          <p className="text-xs text-slate-400">Added to cash drawer</p>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>KHQR DIGITAL PAY</span>
            <ArrowUpRight className="h-4 w-4 text-indigo-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">${shift.khqrSalesUsd.toFixed(2)}</h3>
          <p className="text-xs text-slate-400">Bank transfer / ABA KHQR</p>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>CREDIT / DEBIT CARD</span>
            <ArrowUpRight className="h-4 w-4 text-bento-primary" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">${shift.cardSalesUsd.toFixed(2)}</h3>
          <p className="text-xs text-slate-400">Visa / Mastercard / UnionPay</p>
        </Card>
      </div>

      {/* Expected Cash Reconciliation Card */}
      <Card className="p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" /> Cash Drawer Till Target
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase">Live Audit</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">Opening Float Cash:</span>
            <strong className="font-mono text-slate-900 dark:text-slate-100">${shift.openingFloatUsd.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">+ Cash Register Sales:</span>
            <strong className="font-mono text-emerald-600">+${shift.cashSalesUsd.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between py-3 text-base font-black border-t-2 border-slate-900 dark:border-slate-100">
            <span className="text-slate-900 dark:text-slate-100">Expected Total Cash in Till:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 text-xl">${shift.expectedCashUsd.toFixed(2)}</span>
          </div>
        </div>

        {shift.status === 'ACTIVE' && (
          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={() => setIsCloseModalOpen(true)} className="font-bold px-8 shadow-md bg-emerald-600 hover:bg-emerald-700">
              <Lock className="h-4 w-4 mr-2" /> Close Shift & Reconcile
            </Button>
          </div>
        )}
      </Card>

      {/* CLOSE SHIFT MODAL */}
      <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Close Shift & Count Cash Drawer">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Expected total cash in till is <strong>${shift.expectedCashUsd.toFixed(2)}</strong>. Please enter counted cash:
          </p>

          <Input
            label="Actual Counted Cash ($) *"
            type="number"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
            placeholder="1000.00"
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCloseShift} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? 'Reconciling...' : 'Confirm Close & Reconcile'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
