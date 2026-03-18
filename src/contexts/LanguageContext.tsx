import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('dukkandoor_lang');
    if (saved === 'ur' || saved === 'en') return saved;
    const browserLang = navigator.language?.toLowerCase();
    return browserLang?.startsWith('ur') ? 'ur' : 'en';
  });

  const isRtl = language === 'ur';

  useEffect(() => {
    localStorage.setItem('dukkandoor_lang', language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRtl) {
      document.documentElement.style.fontFamily = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif";
    } else {
      document.documentElement.style.fontFamily = '';
    }
  }, [language, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => translate(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
