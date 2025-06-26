
'use client';

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';

type Language = 'en' | 'he';
type Direction = 'ltr' | 'rtl';

type LanguageContextType = {
  lang: Language;
  dir: Direction;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  setLang: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Statically import translations to avoid async logic issues on initial load
import enTranslations from '@/data/locales/en.json';
import heTranslations from '@/data/locales/he.json';

const translations = {
  en: enTranslations,
  he: heTranslations,
};


export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en'); // Default to 'en' for server render

  // This effect runs only on the client, after initial render
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'he')) {
      setLang(savedLang);
    }
  }, []);

  // This effect synchronizes the lang state with the DOM and localStorage on the client
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);
  
  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    const dictionary = translations[lang] || translations.en;
    let text = (dictionary as any)[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([rKey, value]) => {
        text = text.replace(`{${rKey}}`, String(value));
      });
    }
    
    return text;
  }, [lang]);
  
  const value = {
    lang,
    dir: lang === 'he' ? 'rtl' : 'ltr' as Direction,
    t,
    setLang,
  };

  // Always render children, even on the server.
  // The server will render with 'en'. The client will re-render if localStorage has 'he'.
  // `suppressHydrationWarning` on the <html> tag in RootLayout handles this.
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
