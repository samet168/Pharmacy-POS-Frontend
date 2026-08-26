'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacySellRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mx-auto" />
        <p className="text-sm font-medium text-slate-400">Loading Order POS Counter...</p>
      </div>
    </div>
  );
}
