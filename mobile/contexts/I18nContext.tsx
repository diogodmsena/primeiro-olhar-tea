import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dictionaries, Locale } from '../locales/dictionaries';

interface I18nContextType {
  locale: Locale;
  setLocale: (opts: { locale: Locale }) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt');

  useEffect(() => {
    AsyncStorage.getItem('preferred_locale').then(stored => {
      if (stored && (stored === 'pt' || stored === 'en' || stored === 'es')) {
        setLocaleState(stored as Locale);
      }
    });
  }, []);

  const setLocale = useCallback(async ({ locale: newLocale }: { locale: Locale }) => {
    setLocaleState(newLocale);
    await AsyncStorage.setItem('preferred_locale', newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let current: any = dictionaries[locale];
    
    for (const k of keys) {
      if (current[k] === undefined) {
        return key;
      }
      current = current[k];
    }
    return current as string;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
