"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { CheckCircle2, AlertCircle, Settings, ArrowLeft, BrainCircuit, Printer, Mail, MessageCircle, Copy, Check, Save, LogIn, Eye, Smile, Ear, Info, ChevronLeft, ChevronRight } from "lucide-react";
import Markdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/app/contexts/AuthContext";
import { useI18n } from "@/app/contexts/I18nContext";
import Image from "next/image";
import { generateAndDownloadPDF } from "@/utils/pdfGenerator";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { t } = useI18n();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showToast, setShowToast] = useState(false);
  // Tracks whether we've already auto-saved this report to avoid duplicate saves
  const autoSavedRef = useRef(false);

  useEffect(() => {
    const checkSaved = () => {
      try {
        const localHistory = localStorage.getItem('primeiro_olhar_historico');
        if (localHistory) {
          const historyArray = JSON.parse(localHistory);
          const exists = historyArray.find((item: { job_id: string }) => item.job_id === params.job_id);
          if (exists) setSaved(true);
        }
      } catch (e) {
        console.warn("Local storage access failed", e);
      }
    };
    checkSaved();
  }, [params.job_id]);

  useEffect(() => {
    if (loading) {
      const waitTimer = setTimeout(() => setShowCarousel(true), 5000);
      return () => clearTimeout(waitTimer);
    } else {
      setShowCarousel(false);
    }
  }, [loading]);

  useEffect(() => {
    let slideTimer: NodeJS.Timeout;
    if (showCarousel && loading) {
      slideTimer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % 4);
      }, 12000);
    }
    return () => clearInterval(slideTimer);
  }, [showCarousel, loading]);

  const nextSlide = () => setActiveSlide((p) => (p + 1) % 4);
  const prevSlide = () => setActiveSlide((p) => (p - 1 + 4) % 4);

  const carouselCards = [
    {
      icon: Eye, theme: 'blue',
      title: t('results.carousel.eyeTitle'),
      desc: t('results.carousel.eyeDesc'),
      alert: t('results.carousel.eyeAlert')
    },
    {
      icon: Smile, theme: 'emerald',
      title: t('results.carousel.expTitle'),
      desc: t('results.carousel.expDesc'),
      alert: t('results.carousel.expAlert')
    },
    {
      icon: Ear, theme: 'amber',
      title: t('results.carousel.proTitle'),
      desc: t('results.carousel.proDesc'),
      alert: t('results.carousel.proAlert')
    },
    {
      icon: Info, theme: 'rose',
      title: t('results.carousel.infoTitle'),
      desc: t('results.carousel.infoDesc'),
      alert: null
    }
  ];

  const getThemeClasses = (theme: string) => {
    if (theme === 'emerald') return { bg: 'bg-emerald-50', textTitle: 'text-emerald-900', textIcon: 'text-emerald-500', alertBg: 'bg-emerald-100', alertText: 'text-emerald-800' };
    if (theme === 'amber') return { bg: 'bg-amber-50', textTitle: 'text-amber-900', textIcon: 'text-amber-500', alertBg: 'bg-amber-100', alertText: 'text-amber-800' };
    if (theme === 'rose') return { bg: 'bg-rose-50', textTitle: 'text-rose-900', textIcon: 'text-rose-500', alertBg: 'bg-rose-100', alertText: 'text-rose-800' };
    return { bg: 'bg-blue-50', textTitle: 'text-blue-900', textIcon: 'text-blue-500', alertBg: 'bg-blue-100', alertText: 'text-blue-800' };
  };

  const autoSaveToBackend = async (reportData: unknown) => {
    if (!isAuthenticated || !user?.token || autoSavedRef.current) return;
    autoSavedRef.current = true;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      await axios.post(
        `${apiUrl}/auth/reports`,
        { job_id: params.job_id, report_data: reportData },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      console.warn("Auto-save to backend failed (silent):", err);
      autoSavedRef.current = false;
    }
  };

  const fetchStatus = async () => {
    if (!params.job_id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await axios.get(`${apiUrl}/api/triagem/${params.job_id}?lang=${t('common.locale_code') || 'pt'}`);
      
      if (res.data.status === "done") {
        setData(res.data);
        setLoading(false);
        // Auto-save to local storage
        try {
          const localHistory = localStorage.getItem('primeiro_olhar_historico');
          const historyArray = localHistory ? JSON.parse(localHistory) : [];
          const existsLocally = historyArray.find((item: { job_id: string }) => item.job_id === params.job_id);
          if (!existsLocally) {
            historyArray.push({
              id: Date.now(),
              job_id: params.job_id,
              risk_score: res.data.risk_score?.score || 0,
              risk_level: res.data.risk_score?.level?.toUpperCase() || 'BAIXO',
              child_name: res.data.child_name || '',
              created_at: new Date().toISOString(),
            });
            localStorage.setItem('primeiro_olhar_historico', JSON.stringify(historyArray));
          }
        } catch (e) {
          console.warn("Local storage write failed", e);
        }
        // Auto-save to cloud if authenticated
        autoSaveToBackend(res.data);
      } else if (res.data.status === "error" || res.data.status === "not_found") {
        setData(res.data);
        setError(true);
        setLoading(false);
      } else {
        setTimeout(fetchStatus, 1500);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.job_id]);

  // Separate effect: auto-save to cloud when data is ready AND user is (or becomes) authenticated.
  // Handles the race condition where auth was still loading when fetchStatus ran.
  useEffect(() => {
    if (data && data.status === "done" && isAuthenticated && user?.token && !autoSavedRef.current) {
      autoSaveToBackend(data);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isAuthenticated, user?.token]);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(false);
      setData(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      await axios.post(`${apiUrl}/api/triagem/${params.job_id}/retry`);
      fetchStatus();
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    // Gerar e baixar PDF
    await generateAndDownloadPDF(data, params.job_id as string, t);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = async () => {
    // Gerar e baixar PDF
    await generateAndDownloadPDF(data, params.job_id as string, t);

    const rawLevel = (data.risk_score.level || "").toLowerCase();
    const localizedLevel = 
        (rawLevel.includes("baixo") || rawLevel.includes("low") || rawLevel.includes("leve")) ? t('results.indicatorLeve') :
        (rawLevel.includes("moderado") || rawLevel.includes("moderate") || rawLevel.includes("médio")) ? t('results.indicatorModerado') :
        (rawLevel.includes("alto") || rawLevel.includes("high") || rawLevel.includes("forte") || rawLevel.includes("strong")) ? t('results.indicatorForte') :
        data.risk_score.level;

    const text = t('results.shareWhatsAppTemplate')
      .replace('{level}', localizedLevel)
      .replace('{jobId}', params.job_id as string)
      .replace('{url}', window.location.href);

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = async () => {
    // Gerar e baixar PDF
    await generateAndDownloadPDF(data, params.job_id as string, t);

    const rawLevel = (data.risk_score.level || "").toLowerCase();
    const localizedLevel = 
        (rawLevel.includes("baixo") || rawLevel.includes("low") || rawLevel.includes("leve")) ? t('results.indicatorLeve') :
        (rawLevel.includes("moderado") || rawLevel.includes("moderate") || rawLevel.includes("médio")) ? t('results.indicatorModerado') :
        (rawLevel.includes("alto") || rawLevel.includes("high") || rawLevel.includes("forte") || rawLevel.includes("strong")) ? t('results.indicatorForte') :
        data.risk_score.level;

    const subject = t('results.shareEmailSubject').replace('{level}', localizedLevel);
    const body = t('results.shareEmailBody')
      .replace('{level}', localizedLevel)
      .replace('{jobId}', params.job_id as string)
      .replace('{url}', window.location.href);

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      // 1. Salvar localmente (Sempre)
      const localHistory = localStorage.getItem('primeiro_olhar_historico');
      const historyArray = localHistory ? JSON.parse(localHistory) : [];
      
      const existsLocally = historyArray.find((item: { job_id: string }) => item.job_id === params.job_id);
      if (!existsLocally) {
        historyArray.push({
          id: Date.now(),
          job_id: params.job_id,
          risk_score: data.risk_score?.score || 0,
          risk_level: data.risk_score?.level?.toUpperCase() || 'BAIXO',
          child_name: data.child_name || '',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('primeiro_olhar_historico', JSON.stringify(historyArray));
      }

      // 2. Salvar na nuvem se autenticado
      if (isAuthenticated && user?.token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        await axios.post(`${apiUrl}/auth/reports`, {
          job_id: params.job_id,
          report_data: data
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      
      setSaved(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      console.error("Erro ao salvar relatório:", err);
      if (isAuthenticated && axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        alert("Sua sessão expirou. O relatório foi salvo apenas neste dispositivo.");
      } else {
        // Se falhou na API, pelo menos salvou local.
        setSaved(true); 
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 transition-all duration-500 overflow-hidden">
        {!showCarousel ? (
          <div className="flex flex-col items-center max-w-md w-full animate-fade-in text-sky-900">
            <Settings className="w-16 h-16 animate-spin text-sky-400 mb-6" />
            <h2 className="text-2xl font-light text-center">{t('results.processingTitle')}</h2>
            <p className="text-slate-500 mt-2 text-center text-sm md:text-base">{t('results.processingSubtitle')}</p>
            
            <div className="mt-12 space-y-4 text-sm text-slate-400 w-full px-4">
              <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Pipeline Iniciado...</div>
              <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Video Processor (Gaze & Action)...</div>
              <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Audio Processor (Prosody)...</div>
              <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Risk Engine Modeling...</div>
              <div className="flex items-center animate-pulse"><Settings className="w-4 h-4 mr-2 animate-spin text-sky-400"/> Agentic Gemma 4 Retrieval...</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-xl w-full animate-fade-in">
            <div className="flex flex-col items-center mb-8">
              <Settings className="w-8 h-8 animate-spin text-sky-400 mb-3" />
              <h2 className="text-slate-500 font-medium tracking-wide">{t('results.loadingTitle')}</h2>
            </div>
            
            <div className="relative w-full bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[380px] sm:min-h-[340px] flex items-center justify-center">
               <button onClick={prevSlide} className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 p-1 sm:p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-10">
                 <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
               </button>
               <button onClick={nextSlide} className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 p-1 sm:p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors z-10">
                 <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
               </button>

               <div className="relative w-full h-full flex items-center justify-center">
                  {carouselCards.map((card, idx) => {
                    const theme = getThemeClasses(card.theme);
                    const isVisible = activeSlide === idx;
                    const offset = (idx - activeSlide) * 100;
                    const opacityClass = isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`absolute top-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out w-[80%] sm:w-[70%] mx-auto h-full ${opacityClass}`}
                        style={{ transform: `translateX(${offset}%)` }}
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${theme.bg} flex items-center justify-center mb-4 sm:mb-6`}>
                          <card.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${theme.textIcon}`} />
                        </div>
                        <h3 className={`text-lg sm:text-xl font-extrabold ${theme.textTitle} text-center mb-2 sm:mb-3`}>{card.title}</h3>
                        <p className="text-slate-500 text-center text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">{card.desc}</p>
                        {card.alert && (
                          <div className={`${theme.alertBg} p-3 rounded-xl border border-transparent w-full`}>
                            <p className={`${theme.alertText} text-[11px] sm:text-xs font-semibold text-center leading-relaxed`}>{card.alert}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>

            <div className="flex gap-2 mt-8">
              {carouselCards.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-10 bg-sky-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} 
                  aria-label={`Slide ${i+1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-md text-center">
          <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">{t('history.errorTitle')}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {t('history.errorDesc')}
          </p>
          {data?.error_message && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 font-medium">{data.error_message}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRetry} 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
            >
              {t('common.retry')}
            </button>
            <p className="text-xs text-slate-400 mt-2">Você não precisará preencher o formulário novamente.</p>
          </div>
        </div>
      </div>
    );
  }

  const { risk_score, video_features, audio_features, gemma_report } = data;
  const isHighRisk = risk_score.score >= 0.67;

  const radarData = [
    { subject: t('results.radarVisual'), A: (video_features?.eye_contact_ratio || 0) * 100, fullMark: 100 },
    { subject: t('results.radarExpressivity'), A: video_features?.facial_expressivity === 'low' ? 30 : 90, fullMark: 100 },
    { subject: t('results.radarProsody'), A: (audio_features?.prosody_variation || 0) * 100, fullMark: 100 },
    { subject: t('results.radarSymptoms'), A: (risk_score?.score || 0) * 100, fullMark: 100 },
    { subject: t('results.radarIncidence'), A: (risk_score?.score || 0) * 100, fullMark: 100 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans pb-20 print:bg-white print:p-0">
      
      {/* Visual Centered Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-in fade-in zoom-in duration-300 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center min-w-[320px]">
             <div className="bg-emerald-500 rounded-full p-3 shadow-lg shadow-emerald-500/30">
               <Check className="w-8 h-8 text-white" />
             </div>
             <div>
               <p className="font-bold text-lg mb-1">{t('results.savedSuccess')}</p>
               <p className="text-sm text-slate-300">Você pode acessá-lo depois em Meu Histórico.</p>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
        
        <button onClick={() => router.push('/')} className="text-sky-600 hover:text-sky-800 flex items-center text-sm font-medium mb-8 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.newScreening')}
        </button>

        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 print:mb-6 gap-6">
             
             <div className="flex flex-col items-center justify-center ">
                  <Image 
                    src="/logo_v4.png" 
                    alt="Ícone Primeiro Olhar" 
                    width={40} 
                    height={40} 
                    className="w-10 h-10 object-contain mb-1" 
                    priority
                  />
                  <div className="font-extrabold text-lg tracking-tight text-slate-800 leading-none">
                    Primeiro<span className="text-blue-500">Olhar</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{t('report.pdfTitle')}</span>
             </div>

             <div className="flex-1 border-l border-slate-200 pl-6 md:pl-8">
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  {t('results.radarTitle')}
                </h1>
                {data?.child_name && (
                  <p className="text-xl font-bold text-blue-500 mt-1 capitalize">
                    {data.child_name}
                  </p>
                )}
             </div>
             
             <div className="flex items-center gap-6 md:gap-8 justify-between md:justify-end w-full md:w-auto border-t border-slate-100 pt-4 md:border-t-0 md:pt-0">
                
                <div className="text-right border-l border-slate-200 pl-6 md:pl-8">
                   <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">{t('results.indicatorsLevel')}</p>
                   <div className="flex items-center justify-end">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                           isHighRisk ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"
                       }`}>
                           {(() => {
                               const rawLevel = (risk_score.level || "").toLowerCase();
                               return (rawLevel.includes("baixo") || rawLevel.includes("low") || rawLevel.includes("leve")) ? t('results.indicatorLeve') :
                                      (rawLevel.includes("moderado") || rawLevel.includes("moderate") || rawLevel.includes("médio")) ? t('results.indicatorModerado') :
                                      (rawLevel.includes("alto") || rawLevel.includes("high") || rawLevel.includes("forte") || rawLevel.includes("strong")) ? t('results.indicatorForte') :
                                      risk_score.level;
                           })()}
                       </span>
                   </div>
                </div>


             </div>
        </header>

        <div className="grid md:grid-cols-5 gap-6 print:gap-4 print:block">
           
           {/* Radar Chart */}
           <div className="md:col-span-2 space-y-6 print:break-inside-avoid print:mb-8">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col print:shadow-none print:border-none print:p-0">
                   <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b pb-2">{t('results.radarChartTitle')}</h3>
                   <div className="flex-grow w-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Score" dataKey="A" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>
               </div>
           </div>

           {/* Explainability Engine (Gemma) */}
           <div className="md:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-sky-100 ring-1 ring-sky-50 print:shadow-none print:border-none print:ring-0 print:p-0">
               <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
                   <div className="bg-sky-100 p-2 rounded-lg">
                       <BrainCircuit className="w-6 h-6 text-sky-600" />
                   </div>
                   <div>
                      <h2 className="text-lg font-semibold text-slate-800">{t('results.explicativeTitle')}</h2>
                   </div>
               </div>
               
               <div className="prose prose-slate prose-sky max-w-none text-slate-700 text-justify prose-p:mb-5 prose-p:leading-relaxed prose-strong:font-bold prose-strong:text-slate-900 prose-headings:font-semibold prose-h3:text-sky-800 prose-li:marker:text-sky-400">
                  <Markdown>{gemma_report}</Markdown>
               </div>

               {/* SHARE BAR */}
               <div className="mt-12 pt-6 border-t border-slate-100 print:hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('results.shareTitle')}</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => generateAndDownloadPDF(data, params.job_id as string, t)} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
                    >
                      <Printer className="w-4 h-4" /> {t('results.downloadPDF')}
                    </button>
                    <button 
                      onClick={handleShareEmail} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-sm"
                    >
                      <Mail className="w-4 h-4" /> {t('results.shareEmail')}
                    </button>
                    <button 
                      onClick={handleShareWhatsApp} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> {t('results.shareWhatsApp')}
                    </button>
                    <button 
                      onClick={handleCopyLink} 
                      className={`flex items-center gap-2 border-2 font-semibold py-2.5 px-5 rounded-xl transition-all text-sm ${
                        copied 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t('results.copied') : t('results.copyLink')}
                    </button>
                  </div>
               </div>
           </div>
        </div>

        {/* SAVE REPORT CTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 print:hidden">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <Save className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">{t('results.saveHistory')}</p>
                  <p className="text-sm text-slate-500">{t('results.loggedAs')} {user.name}</p>
                </div>
              </div>
              {saved ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm bg-emerald-50 px-5 py-2.5 rounded-xl">
                  <Check className="w-4 h-4" /> {t('results.savedSuccess')}
                </div>
              ) : (
                <button
                  onClick={handleSaveReport}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? t('results.saving') : t('results.saveReport')}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2.5 rounded-xl">
                  <LogIn className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">{t('results.saveGuestTitle')}</p>
                  <p className="text-sm text-slate-500">{t('results.saveGuestSubtitle')}</p>
                </div>
              </div>
              <GoogleLoginButton 
                onBeforeLogin={() => {
                  localStorage.setItem('pendingReportJobId', String(params.job_id));
                  localStorage.setItem('pendingReportData', JSON.stringify(data));
                }}
                shape="rectangular"
                theme="outline"
              />
            </div>
          )}
        </div>

        {/* DISCLAIMER LEGAL */}
        <div className="mt-8 bg-amber-50/60 border border-amber-200/60 rounded-2xl p-6 print:mt-6 print:border-amber-300">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-amber-700">{t('results.disclaimerTitle')}</span> {t('results.disclaimerDesc')}
          </p>
        </div>

      </div>
    </main>
  );
}
