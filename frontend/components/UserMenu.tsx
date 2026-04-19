"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../app/contexts/AuthContext";
import { useI18n } from "../app/contexts/I18nContext";
import { LogOut, History, ChevronDown } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user, isAuthenticated, isLoading, signOut, isGoogleReady } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const renderGoogleBtn = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      if (google?.accounts?.id && googleButtonRef.current && isGoogleReady) {
        google.accounts.id.renderButton(googleButtonRef.current, {
           theme: "outline",
           size: "large",
           shape: "pill",
           text: "signin_with"
        });
        clearInterval(interval);
      }
    };

    if (isGoogleReady && !isLoading) {
      renderGoogleBtn();
      interval = setInterval(renderGoogleBtn, 500);
    }
    
    return () => clearInterval(interval);
  }, [isLoading, isGoogleReady]);

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return (
      <div className="hidden md:flex items-center h-10 overflow-hidden rounded-full shadow-sm hover:shadow-md transition-shadow">
          <div ref={googleButtonRef}></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:flex items-center gap-2 bg-white border-2 border-slate-200 pl-1.5 pr-3 py-1.5 rounded-full font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
      >
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0)}
          </div>
        )}
        <span className="text-slate-700 max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-bold text-sm text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <Link 
            href="/historico" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            <History className="w-4 h-4 text-blue-500" />
            {t('common.myReports')}
          </Link>
          <button 
            onClick={() => { signOut(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
