'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/languageStore';

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { language } = useLanguageStore();

  useEffect(() => {
    // Apply Khmer font when language is Khmer
    if (language === 'kh') {
      document.documentElement.style.fontFamily = "'Kantumruy Pro', 'Battambang', sans-serif";
      document.documentElement.classList.add('font-khmer');
      document.documentElement.lang = 'km';
    } else {
      document.documentElement.style.fontFamily = "inherit";
      document.documentElement.classList.remove('font-khmer');
      document.documentElement.lang = 'en';
    }
  }, [language]);

  return <>{children}</>;
}
