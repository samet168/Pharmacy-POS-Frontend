'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function RegisterPage() {
  const router = useRouter();
  const { language } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className={`text-xl font-black text-slate-800 dark:text-white ${language === 'kh' ? 'font-khmer' : ''}`}>
          {language === 'kh' ? 'ការចុះឈ្មោះត្រូវបានគ្រប់គ្រងដោយ SuperAdmin' : 'Registration Managed by SuperAdmin'}
        </h2>
        <p className={`text-xs text-slate-500 dark:text-slate-400 ${language === 'kh' ? 'font-khmer' : ''}`}>
          {language === 'kh'
            ? 'គណនីបុគ្គលិក និងវេជ្ជបណ្ឌិតទាំងអស់ ត្រូវបានបង្កើត និងចាត់តាំងសាខាដោយផ្ទាល់ដោយ SuperAdmin តាមរយៈផ្ទាំងគ្រប់គ្រង។ កំពុងនាំអ្នកទៅកាន់ទំព័រ Login...'
            : 'All staff and doctor accounts are provisioned centrally by SuperAdmin. Redirecting to Login...'}
        </p>
        <button
          onClick={() => router.replace('/login')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#04649C] hover:bg-[#035382] text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'kh' ? 'ទៅកាន់ទំព័រ Login ភ្លាមៗ' : 'Go to Login Now'}
        </button>
      </div>
    </div>
  );
}
