'use client';

import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </p>
          <Button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}