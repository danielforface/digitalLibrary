
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

const translations: { [key in Language]?: any } = {};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en'); // Default to 'en'
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language | null;
    const initialLang = savedLang || 'en';
    setLang(initialLang);
  }, []);

  useEffect(() => {
    if (translations[lang]) {
      setIsLoaded(true);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', lang);
    } else {
      setIsLoaded(false);
      import(`@/data/locales/${lang}.json`)
        .then((module) => {
          translations[lang] = module.default;
          setIsLoaded(true);
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
          localStorage.setItem('lang', lang);
        })
        .catch(console.error);
    }
  }, [lang]);
  
  const t = useCallback((key: string, replacements?: { [key: string]: string | number }) => {
    if (!isLoaded || !translations[lang]) return key;
    
    let text = translations[lang][key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([rKey, value]) => {
        text = text.replace(`{${rKey}}`, String(value));
      });
    }
    
    return text;
  }, [lang, isLoaded]);
  
  const value = {
    lang,
    dir: lang === 'he' ? 'rtl' : 'ltr' as Direction,
    t,
    setLang,
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

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
