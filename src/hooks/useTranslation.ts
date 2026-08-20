import { useLanguageStore } from '@/lib/stores/languageStore';
import { t } from '@/lib/i18n';
import { useEffect, useState } from 'react';

/**
 * Hook for using translations in components
 * Automatically uses the current language from the language store
 */
export const useTranslation = () => {
  const storeLanguage = useLanguageStore((state) => state.language);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    t: (key: string) => t(key, mounted ? storeLanguage : 'en'),
    language: mounted ? storeLanguage : 'en',
    mounted: mounted,
  };
};
