'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LegacyCheckoutRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const target = query ? `/pos/checkout?${query}` : '/pos/checkout';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Redirecting to POS Checkout...</p>
      </div>
    </div>
  );
}

export default function LegacyCheckoutRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
        </div>
      }
    >
      <LegacyCheckoutRedirect />
    </Suspense>
  );
}

