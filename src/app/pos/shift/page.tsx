'use client';

import { useState, useEffect } from 'react';
import { shiftsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Play, Pause, Square, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ShiftPage() {
  const [currentShift, setCurrentShift] = useState(null);
  const [openingCash, setOpeningCash] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current shift status
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      // Use branch ID 1 as default - in real app, get from auth store
      const shifts = await shiftsApi.getByBranch(1);
      const activeShift = shifts.find(s => s.status === 'OPEN');
      setCurrentShift(activeShift || null);
    } catch (error) {
      console.error('Failed to fetch shift:', error);
    }
  };

  const handleOpenShift = async () => {
    setLoading(true);
    try {
      await shiftsApi.create({
        userId: 1, // Get from auth store
        branchId: 1, // Get from auth store
        openingCash: Number(openingCash),
      });
      toast.success('Shift opened successfully');
      fetchCurrentShift();
    } catch (error) {
      toast.error('Failed to open shift');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    setLoading(true);
    try {
      await shiftsApi.close(currentShift.id, {
        actualCash: Number(actualCash),
      });
      toast.success('Shift closed successfully');
      fetchCurrentShift();
    } catch (error) {
      toast.error('Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Shift Management</h1>
        <p className="text-slate-600">Manage your work shift</p>
      </div>

      {currentShift ? (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold">Shift Open</h2>
              </div>
              <span className="text-sm text-slate-600">
                {new Date(currentShift.openedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Opening Cash</p>
                <p className="text-2xl font-bold">${currentShift.openingCash.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Expected Total</p>
                <p className="text-2xl font-bold">${(currentShift.openingCash).toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Close Shift</h2>
            <Input
              label="Actual Cash in Drawer"
              type="number"
              placeholder="Enter actual cash amount"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCloseShift}
                loading={loading}
              >
                <Square className="h-4 w-4 mr-2" />
                Close Shift
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-4">
          <div className="text-center mb-6">
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold">No Active Shift</h2>
            <p className="text-slate-600">Open a shift to start processing sales</p>
          </div>
          <Input
            label="Opening Cash Amount"
            type="number"
            placeholder="Enter opening cash"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <Button
            className="w-full mt-4"
            onClick={handleOpenShift}
            loading={loading}
          >
            <Play className="h-4 w-4 mr-2" />
            Open Shift
          </Button>
        </Card>
      )}
    </div>
  );
}