'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function POSPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main sell page
    router.replace('/pos/sell');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading POS...</p>
      </div>
    </div>
  );
}