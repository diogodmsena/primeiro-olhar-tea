"use client";

import { useState } from "react";
import { Eye, Type, PlaySquare, Accessibility, X } from "lucide-react";
import { useA11y } from "../app/contexts/AccessibilityContext";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, toggleSetting } = useA11y();

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:scale-105 transition-all z-50 group print:hidden focus:outline-none focus:ring-4 focus:ring-slate-800/20"
        aria-label="Abrir Painel de Acessibilidade"
      >
        <Accessibility className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white shadow-2xl rounded-3xl border border-slate-100 z-50 p-6 animate-in slide-in-from-bottom-8 fade-in print:hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-blue-500" />
              Acessibilidade
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Fechar Painel de Acessibilidade"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Contraste */}
            <button 
              onClick={() => toggleSetting('highContrast')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                settings.highContrast ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${settings.highContrast ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:text-blue-500'}`}>
                  <Eye className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${settings.highContrast ? 'text-blue-700' : 'text-slate-700'}`}>Alto Contraste</p>
                  <p className="text-xs font-semibold text-slate-500">Inverter cores</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${settings.highContrast ? 'bg-blue-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </button>

            {/* Reduzir Animação */}
            <button 
              onClick={() => toggleSetting('reduceMotion')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                settings.reduceMotion ? 'border-amber-400 bg-amber-50/50' : 'border-slate-100 hover:border-amber-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${settings.reduceMotion ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 group-hover:text-amber-500'}`}>
                  <PlaySquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${settings.reduceMotion ? 'text-amber-700' : 'text-slate-700'}`}>Reduzir Motion</p>
                  <p className="text-xs font-semibold text-slate-500">Parar animações</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${settings.reduceMotion ? 'bg-amber-400 justify-end' : 'bg-slate-200 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </button>

            {/* Fonte Grande */}
            <button 
              onClick={() => toggleSetting('largeFont')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                settings.largeFont ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${settings.largeFont ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:text-emerald-500'}`}>
                  <Type className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${settings.largeFont ? 'text-emerald-700' : 'text-slate-700'}`}>Ampliar Fonte</p>
                  <p className="text-xs font-semibold text-slate-500">Tamanho +20%</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${settings.largeFont ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
