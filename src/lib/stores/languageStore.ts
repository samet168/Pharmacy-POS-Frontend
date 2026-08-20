import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, getSavedLanguage, saveLanguage } from '@/lib/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: getSavedLanguage(),
      setLanguage: (language) => {
        console.log('Setting language in store:', language);
        saveLanguage(language);
        set({ language });
      },
      toggleLanguage: () => {
        const newLanguage: Language = useLanguageStore.getState().language === 'en' ? 'kh' : 'en';
        console.log('Toggling language to:', newLanguage);
        saveLanguage(newLanguage);
        set({ language: newLanguage });
      },
    }),
    {
      name: 'language-storage',
    }
  )
);