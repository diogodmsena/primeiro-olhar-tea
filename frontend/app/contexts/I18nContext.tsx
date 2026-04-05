"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, Locale } from "../locales/dictionaries";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (keyPath: string, variables?: Record<string, any>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_locale") as Locale;
    if (saved && ["pt", "en", "es"].includes(saved)) {
      setLocaleState(saved);
    } else {
      // Auto-detect browser language if not set
      const browserLang = navigator.language.slice(0, 2);
      if (["pt", "en", "es"].includes(browserLang)) {
        setLocaleState(browserLang as Locale);
      }
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred_locale", newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (keyPath: string, variables?: Record<string, string | number>) => {
    const keys = keyPath.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dictionaries[locale];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath;
      }
      current = current[key];
    }

    if (typeof current !== "string") {
      return keyPath;
    }

    let text = current;
    if (variables) {
      Object.keys(variables).forEach((key) => {
        text = text.replace(`{${key}}`, String(variables[key]));
      });
    }

    return text;
  };

  // Avoid hydration mismatch by rendering default immediately but respecting client storage afterwards
  // However, rendering immediately with mismatching text causes Next.js hydration errors. 
  // It's usually better to just wait until mounted to render children, or render with 'pt' by default server-side.
  // Since this is a simple SSG/SPA setup, we'll render children anyway, the server assumes 'pt'.
  // Returning children naked allows Next.js to hydrate. If it mismatches, it will fix itself on client.

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {mounted ? children : <div className="invisible">{children}</div>}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
