"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Video, FileText, Brain, ShieldCheck, ArrowRight } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { LanguageSelector } from "../../components/LanguageSelector";
import { UserMenu } from "../../components/UserMenu";

import Image from "next/image";

const CSSLogo = () => (
  <div className="flex items-center gap-2 cursor-pointer" onClick={() => {}}>
    <Image 
      src="/logo_v4.png" 
      alt="Ícone Primeiro Olhar" 
      width={40} 
      height={40} 
      className="w-8 h-8 md:w-10 md:h-10 object-contain animate-float" 
      priority
    />
    <span className="font-extrabold text-3xl tracking-tight text-slate-800">
      Primeiro<span className="text-blue-500">Olhar</span>
    </span>
  </div>
);

export default function ComoFuncionaPage() {
  const router = useRouter();
  const { t } = useI18n();

  const steps = [
    {
      icon: Video,
      color: "bg-blue-100 text-blue-600",
      number: "01",
      title: t('how.step1Title'),
      description: t('how.step1Desc'),
      tip: t('how.step1Tip')
    },
    {
      icon: FileText,
      color: "bg-amber-100 text-amber-600",
      number: "02",
      title: t('how.step2Title'),
      description: t('how.step2Desc'),
      tip: t('how.step2Tip')
    },
    {
      icon: Brain,
      color: "bg-emerald-100 text-emerald-600",
      number: "03",
      title: t('how.step3Title'),
      description: t('how.step3Desc'),
      tip: t('how.step3Tip')
    },
    {
      icon: ShieldCheck,
      color: "bg-rose-100 text-rose-600",
      number: "04",
      title: t('how.step4Title'),
      description: t('how.step4Desc'),
      tip: t('how.step4Tip')
    }
  ];
  
  const faqs = [
    {
      q: t('how.faq1Q'),
      a: t('how.faq1A')
    },
    {
      q: t('how.faq2Q'),
      a: t('how.faq2A')
    },
    {
      q: t('how.faq3Q'),
      a: t('how.faq3A')
    },
    {
      q: t('how.faq4Q'),
      a: t('how.faq4A')
    },
    {
      q: t('how.faq5Q'),
      a: t('how.faq5A')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="w-full px-6 py-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div onClick={() => router.push('/')} className="cursor-pointer">
          <CSSLogo />
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/')} 
            className="text-slate-500 hover:text-blue-500 hidden md:flex items-center text-sm font-semibold transition-colors px-4 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('how.back')}
          </button>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20">
        <div className="md:hidden flex justify-start mb-6">
          <button 
            onClick={() => router.push('/')} 
            className="text-slate-500 hover:text-blue-500 flex items-center text-sm font-semibold transition-colors px-4 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('how.back')}
          </button>
        </div>

        {/* Hero */}
        <section className="text-center py-12">
          <div className="inline-block bg-blue-100 text-blue-600 font-bold text-sm px-6 py-3 rounded-full mb-6">
            {t('how.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-5 leading-tight">
            {t('how.titleStart')}<span className="text-blue-500">{t('how.titleHighlight')}</span>{t('how.titleEnd')}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-prose mx-auto leading-relaxed">
            {t('how.subtitle')}
          </p>
        </section>

        {/* Steps */}
        <section className="space-y-8 mt-4">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-6">
                <div className={`${step.color} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-slate-300 tracking-widest uppercase">{t('how.stepPrefix')} {step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{step.description}</p>
                  <div className="mt-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <p className="text-sm text-slate-500"><span className="font-bold text-blue-500">{t('how.tipPrefix')}</span> {step.tip}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Technology Section */}
        <section className="mt-16">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">🧠 {t('how.techTitle')}</h2>
              <p className="text-slate-300 leading-relaxed mb-6 font-medium">
                O Primeiro Olhar {t('how.techDesc')}
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                  <p className="text-sm font-bold text-blue-300 mb-1">👁️ {t('how.visionTitle')}</p>
                  <p className="text-xs text-slate-400">{t('how.visionDesc')}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                  <p className="text-sm font-bold text-amber-300 mb-1">🎵 {t('how.audioTitle')}</p>
                  <p className="text-xs text-slate-400">{t('how.audioDesc')}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                  <p className="text-sm font-bold text-emerald-300 mb-1">📝 {t('how.textTitle')}</p>
                  <p className="text-xs text-slate-400">{t('how.textDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">{t('how.faqTitle')}</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-slate-700 hover:text-blue-500 transition-colors list-none">
                  <span>{faq.q}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 -mt-2">
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="bg-blue-50 rounded-3xl p-10 border border-blue-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('how.ctaTitle')}</h2>
            <p className="text-slate-500 font-medium mb-6">{t('how.ctaDesc')}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-lg py-4 px-10 rounded-full transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-3 mx-auto"
            >
              {t('how.ctaButton')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
