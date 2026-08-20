// Language state management
export type Language = 'en' | 'kh';

// Import translation files
import enTranslations from '../messages/en.json';
import kmTranslations from '../messages/km.json';

// Type for nested translation object
export type Translations = typeof enTranslations;

// Translation objects
export const translations: Record<Language, Translations> = {
  en: enTranslations,
  kh: kmTranslations,
};

// Get saved language from localStorage or default to 'en'
export const getSavedLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language') as Language;
    if (saved === 'en' || saved === 'kh') {
      console.log('Found saved language:', saved);
      return saved;
    }
  }
  console.log('No saved language, defaulting to en');
  return 'en';
};

// Save language to localStorage
export const saveLanguage = (language: Language) => {
  if (typeof window !== 'undefined') {
    console.log('Saving language to localStorage:', language);
    localStorage.setItem('language', language);
  }
};

// Get translation for a nested key (e.g., 'navbar.searchPlaceholder')
export const t = (key: string, language: Language = getSavedLanguage()): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  // Fallback to English if key not found in current language
  if (!value && language !== 'en') {
    let fallbackValue: any = translations['en'];
    for (const k of keys) {
      fallbackValue = fallbackValue?.[k];
    }
    return fallbackValue || key;
  }
  
  return value || key;
};

// Hook for using translations in components
export const useTranslation = (language?: Language) => {
  const currentLanguage = language || getSavedLanguage();
  
  return {
    t: (key: string) => t(key, currentLanguage),
    language: currentLanguage,
  };
};
