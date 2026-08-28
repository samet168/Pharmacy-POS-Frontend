'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect based on authentication state
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (user) {
      // If authenticated, redirect to dashboard
      router.push('/dashboard');
    } else {
      // If not authenticated, redirect to login with preserved hash
      router.push('/login' + (hash ? hash : ''));
    }
  }, [router, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Pharmacy POS</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}