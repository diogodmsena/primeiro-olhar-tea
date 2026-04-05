"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "../app/contexts/I18nContext";
import { Locale } from "../app/locales/dictionaries";
import { ChevronDown } from "lucide-react";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: "pt", label: "Português", flag: "https://flagcdn.com/br.svg" },
    { code: "en", label: "English", flag: "https://flagcdn.com/us.svg" },
    { code: "es", label: "Español", flag: "https://flagcdn.com/es.svg" },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-5 object-cover rounded-full shadow-sm" />
        <span className="font-semibold text-slate-600 text-sm hidden sm:inline-block">{currentLang.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul
          className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-soft-hover py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 focus:outline-none"
          role="listbox"
        >
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left font-medium text-sm
                  ${locale === lang.code ? "text-blue-600 bg-blue-50/50" : "text-slate-600"}
                `}
                role="option"
                aria-selected={locale === lang.code}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lang.flag} alt={lang.label} className="w-5 h-5 object-cover rounded-full shadow-sm" />
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
