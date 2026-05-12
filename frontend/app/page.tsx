"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, Activity, Heart, PlusCircle, CheckCircle2, Puzzle, ArrowRight, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "./contexts/I18nContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { UserMenu } from "../components/UserMenu";

import Image from "next/image";

// Logo com logo_v4 e texto
const CSSLogo = () => (
  <div className="flex items-center gap-2">
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

// Símbolo do Autismo usando Lucide Puzzle para o Hero Section
const AutismPuzzleSymbol = () => (
  <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Background flutuante */}
      <div className="absolute inset-0 bg-white rounded-[4rem] shadow-soft-hover animate-float"></div>
      <div className="absolute w-64 h-64 rounded-full border-8 border-dashed border-amber-400/20 animate-[spin_60s_linear_infinite]"></div>
      
      {/* Quebra-cabeça Múltiplo (As 4 cores clássicas do autismo) */}
      <div className="grid grid-cols-2 gap-0 relative z-10 animate-float-delayed scale-110">
        <Puzzle className="w-16 h-16 text-blue-500 fill-blue-500/20" />
        <Puzzle className="w-16 h-16 text-amber-400 fill-amber-400/20 rotate-90" />
        <Puzzle className="w-16 h-16 text-rose-500 fill-rose-500/20 -rotate-90" />
        <Puzzle className="w-16 h-16 text-emerald-500 fill-emerald-500/20 rotate-180" />
      </div>

      <Heart className="absolute top-10 right-10 w-10 h-10 text-rose-500 animate-float-delayed" />
      <Activity className="absolute bottom-12 left-10 w-12 h-12 text-emerald-500 animate-float" />
  </div>
);

export default function Home() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<number>(3);
  const [concerns, setConcerns] = useState("");
  const [communication, setCommunication] = useState("");
  const [responds, setResponds] = useState("");
  const [pretendPlay, setPretendPlay] = useState("");
  const [objectLining, setObjectLining] = useState("");

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length > 0) {
      setVideoFile(acceptedFiles[0]);
    } else if (fileRejections.length > 0) {
      alert("Formato de vídeo não aceito. Tente enviar um arquivo .mp4 ou .mov.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    maxFiles: 1 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return alert("Por favor, selecione um vídeo curto da criança.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", videoFile);
      
      const parentAnswers = {
        child_name: childName,
        child_age: childAge,
        concerns,
        communication_delays: communication,
        responds_to_name: responds,
        pretend_play: pretendPlay,
        object_lining: objectLining,
        lang: locale // Passa o idioma atual para o backend
      };
      
      formData.append("parent_answers", JSON.stringify(parentAnswers));
      formData.append("lang", locale); // Fallback como campo direto
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      
      const response = await axios.post(`${apiUrl}/api/triagem`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if(response.data.job_id) {
        router.push(`/resultado/${response.data.job_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar análise. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  // Função para fazer o scroll macio até o formulário de avaliação
  const scrollToForm = () => {
    document.getElementById('avaliacao-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 selection:bg-amber-400/30 bg-slate-50 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="relative z-20 w-full px-6 py-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <CSSLogo />
        <nav className="hidden md:flex gap-8 font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-500 transition-colors">{t('nav.home')}</Link>
          <Link href="/historico" className="hover:text-blue-500 transition-colors">{t('nav.myHistory')}</Link>
          <Link href="/como-funciona" className="hover:text-blue-500 transition-colors">{t('nav.howItWorks')}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <UserMenu />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-24 min-h-[calc(100vh-120px)]">
          <div className="w-full lg:w-1/2 space-y-8 relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-sm shadow-sm">
              <Heart className="w-4 h-4 fill-emerald-600/20" /> {t('hero.badge')}
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-800 leading-tight tracking-tight">
              {t('hero.titleStart')}<br />
              <span className="text-blue-500">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-lg leading-relaxed font-medium">
              {t('hero.subtitle')}
            </p>
            {/* CTA VISÍVEL NO HERO SECTION */}
            <div className="pt-4">
              <button 
                onClick={scrollToForm}
                className="bg-blue-500 text-white hover:bg-blue-600 font-extrabold text-xl py-4 px-10 rounded-full transition-all shadow-soft hover:shadow-soft-hover transform hover:-translate-y-1 flex items-center gap-3"
              >
                {t('hero.cta')} <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative z-10">
            <AutismPuzzleSymbol />
          </div>
        </section>

        {/* CONTAINER DO FORMULÁRIO */}
        <section id="avaliacao-form" className="bg-white rounded-[2.5rem] shadow-soft hover:shadow-soft-hover transition-shadow duration-500 p-8 md:p-14 max-w-4xl mx-auto border border-blue-50 relative mt-16 scroll-mt-24">
          
          <div className="absolute -top-6 top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-300 rounded-full flex items-center justify-center shadow-soft animate-float border-4 border-white">
             <PlusCircle className="text-white w-8 h-8" />
          </div>

          <div className="text-center mb-8 pt-6">
            <h2 className="text-3xl font-black text-slate-800 mb-4">{t('form.headerBadge')}</h2>
            <p className="text-slate-500 font-medium text-lg">{t('form.headerSubtitle')}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* IDENTIFICATION STEP */}
            <div className="space-y-4">
              <label className="flex items-center text-xl font-bold text-slate-700">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-400/10 text-amber-500 mr-4 shadow-sm">1</span>
                {t('form.step1Title')}
              </label>

              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome da Criança */}
                  <div>
                    <label className="block font-bold text-slate-700 text-base">{t('form.childNameLabel')}</label>
                    <div className="mt-4">
                      <input 
                        type="text" 
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="Nome"
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>
                  {/* Slider de Idade */}
                  <div>
                    <label className="block font-bold text-slate-700 text-base">{t('form.childAgeLabel')}</label>
                    <div className="mt-4 bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-center h-[58px]">
                      <div className="flex justify-between items-center text-slate-500 font-bold text-xs mb-2">
                         <span> </span>
                         <span className="text-blue-500 text-lg">{childAge} {childAge === 1 ? t('common.year') : t('common.years')}</span>
                         <span> </span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="6" 
                        step="1"
                        value={childAge}
                        onChange={(e) => setChildAge(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FILE UPLOAD CARD */}
            <div className="space-y-4 mt-8">
              <label className="flex items-center text-xl font-bold text-slate-700">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 mr-4 shadow-sm">2</span>
                {t('form.step2Title')}
              </label>

              {/* ORIENTAÇÃO DE GRAVAÇÃO */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                <p className="font-bold text-blue-700 text-sm mb-2">💡 Dicas para um vídeo eficaz:</p>
                <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Grave a criança em um ambiente tranquilo e bem iluminado</li>
                  <li>Posicione a câmera na altura do rosto, a cerca de 1 metro de distância</li>
                  <li>Chame a criança pelo nome durante a gravação e observe a reação</li>
                  <li>Ideal: até 30 segundos em uma interação natural (brincar, conversar)</li>
                  <li>Evite muitos estímulos ao redor (TV ligada, outras pessoas falando)</li>
                </ul>
              </div>

              <div 
                {...getRootProps()} 
                className={`border-4 border-dashed rounded-3xl py-6 px-10 flex flex-col items-center justify-center transition-all cursor-pointer min-h-[180px] ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                <input {...getInputProps()} />
                {videoFile ? (
                  <div className="flex flex-col items-center text-emerald-500">
                    <CheckCircle2 className="w-14 h-14 mb-3 fill-emerald-500/10" />
                    <p className="font-extrabold text-lg">{videoFile.name}</p>
                    <p className="text-sm mt-2 font-semibold text-slate-500">{t('form.dropzoneSuccessSubtitle')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-14 h-14 mb-3 text-blue-500 opacity-80" />
                    <p className="font-bold text-lg text-slate-700 text-center mb-1">{t('form.dropzoneDefaultTitle')}</p>
                    <p className="font-medium text-slate-400 text-sm">{t('form.dropzoneDefaultSubtitle')}</p>
                  </div>
                )}
              </div>
              
              {/* NOTA DE PRIVACIDADE WEB */}
              <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 mt-4 flex items-start gap-4 shadow-sm shadow-orange-100/50 animate-fade-in">
                <div className="bg-orange-500/10 p-2 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div className="space-y-1">
                   <p className="font-extrabold text-orange-900 text-sm">Privacidade e Segurança Garantida</p>
                   <p className="text-orange-800/80 text-sm font-medium leading-relaxed">
                      {t('form.privacyNote')}
                   </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-8" />

            {/* PARENT TEXT INPUTS */}
            <div className="space-y-8">
              <label className="flex items-center text-xl font-bold text-slate-700">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 mr-4 shadow-sm">3</span>
                {t('form.step3Title')}
              </label>
              
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                <label className="block font-bold text-slate-700 text-base">{t('form.q3Label')}</label>
                <div className="flex gap-8 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" value="yes" checked={responds === "yes"} onChange={(e)=>setResponds(e.target.value)} className="w-6 h-6 accent-blue-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-blue-500 transition-colors">{t('form.q3OptYes')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" value="no" checked={responds === "no"} onChange={(e)=>setResponds(e.target.value)} className="w-6 h-6 accent-rose-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-rose-500 transition-colors">{t('form.q3OptNo')}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                <label className="block font-bold text-slate-700 text-base">{t('form.q4Label')}</label>
                <p className="text-sm text-slate-500 font-medium -mt-2">{t('form.q4Hint')}</p>
                <div className="flex gap-8 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="pretendPlay" value="yes" checked={pretendPlay === "yes"} onChange={(e)=>setPretendPlay(e.target.value)} className="w-6 h-6 accent-blue-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-blue-500 transition-colors">{t('form.optYes')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="pretendPlay" value="no" checked={pretendPlay === "no"} onChange={(e)=>setPretendPlay(e.target.value)} className="w-6 h-6 accent-rose-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-rose-500 transition-colors">{t('form.optNo')}</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                <label className="block font-bold text-slate-700 text-base">{t('form.q5Label')}</label>
                <div className="flex gap-8 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="objectLining" value="yes" checked={objectLining === "yes"} onChange={(e)=>setObjectLining(e.target.value)} className="w-6 h-6 accent-blue-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-blue-500 transition-colors">{t('form.optYes')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="objectLining" value="no" checked={objectLining === "no"} onChange={(e)=>setObjectLining(e.target.value)} className="w-6 h-6 accent-rose-500 cursor-pointer" />
                    <span className="font-bold text-slate-600 group-hover:text-rose-500 transition-colors">{t('form.optNo')}</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block font-bold text-slate-600 text-base">{t('form.q1Label')}</label>
                  <textarea 
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    placeholder={t('form.q1Placeholder')}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 min-h-[140px] focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-700 placeholder-slate-400"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block font-bold text-slate-600 text-base">{t('form.q2Label')}</label>
                  <textarea 
                    value={communication}
                    onChange={(e) => setCommunication(e.target.value)}
                    placeholder={t('form.q2Placeholder')}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 min-h-[140px] focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all font-medium text-slate-700 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* BOTÃO SUBMIT SEMPRE VISÍVEL COM CORES NATIVAS DO TAILWIND */}
            <div className="pt-10 flex justify-center">
              <button 
                type="submit" 
                disabled={loading || !videoFile}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-2xl py-6 px-16 rounded-[2rem] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-hover transform hover:-translate-y-1 flex items-center justify-center gap-4"
              >
                {loading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('form.submitLoading')}
                  </>
                ) : (
                  <>
                    {t('form.submitButton')} <ArrowRight className="w-7 h-7" />
                  </>
                )}
              </button>
            </div>
            
          </form>
        </section>
      </main>

      {/* LUDIC FOOTER */}
      <footer className="w-full pb-10 pt-20 border-t border-slate-200 mt-20 text-center relative overflow-hidden bg-white">
         <p className="text-slate-500 font-bold">{t('footer.text', { year: String(new Date().getFullYear()) })}</p>
         <div className="flex justify-center gap-3 mt-6">
            <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400 opacity-60"></div>
            <div className="w-3 h-3 rounded-full bg-rose-500 opacity-60"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-60"></div>
         </div>
      </footer>

    </div>
  );
}
