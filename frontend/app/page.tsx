"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, FileVideo, Activity, BrainCircuit, Heart, PlusCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Lúdico Logo construído puramente com CSS e divs (cores do autismo)
const CSSLogo = () => (
  <div className="flex items-center">
    <div className="flex gap-1">
      <div className="w-6 h-6 rounded-full bg-autism-blue opacity-90 shadow-soft"></div>
      <div className="w-6 h-6 rounded-full bg-autism-yellow opacity-90 shadow-soft -ml-2"></div>
      <div className="w-6 h-6 rounded-full bg-autism-red opacity-90 shadow-soft -ml-2"></div>
      <div className="w-6 h-6 rounded-full bg-autism-green opacity-90 shadow-soft -ml-2"></div>
    </div>
    <span className="ml-3 font-extrabold text-2xl tracking-tight text-slate-800">
      Gemma<span className="text-autism-blue">4</span>Good
    </span>
  </div>
);

// Formas Flutuantes de CSS para Hero Section
const FloatingShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-autism-yellow/10 rounded-full blur-3xl animate-float"></div>
    <div className="absolute top-[40%] right-[10%] w-64 h-64 bg-autism-blue/10 rounded-full blur-3xl animate-float-delayed"></div>
    <div className="absolute bottom-[20%] left-[15%] w-48 h-48 bg-autism-green/10 rounded-full blur-3xl animate-float"></div>
    
    {/* Micro formas para decorar */}
    <div className="absolute top-[20%] right-[25%] w-4 h-4 bg-autism-red/40 rounded-full animate-float"></div>
    <div className="absolute top-[50%] left-[10%] w-6 h-6 border-4 border-autism-blue/30 rounded-full animate-float-delayed"></div>
    <div className="absolute bottom-[30%] right-[20%] w-5 h-5 bg-autism-yellow/40 rounded-md rotate-12 animate-float"></div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [concerns, setConcerns] = useState("");
  const [communication, setCommunication] = useState("");
  const [responds, setResponds] = useState("yes");

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
        concerns,
        communication_delays: communication,
        responds_to_name: responds
      };
      
      formData.append("parent_answers", JSON.stringify(parentAnswers));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
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

  return (
    <div className="min-h-screen relative font-sans text-slate-800 selection:bg-autism-yellow/30">
      <FloatingShapes />

      {/* HEADER */}
      <header className="relative z-10 w-full px-6 py-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <CSSLogo />
        <nav className="hidden md:flex gap-8 font-semibold text-slate-600">
          <a href="#" className="hover:text-autism-blue transition-colors">Início</a>
          <a href="#" className="hover:text-autism-blue transition-colors">Como Funciona</a>
          <a href="#" className="hover:text-autism-blue transition-colors">Apoio Familiar</a>
        </nav>
        <button className="hidden md:flex bg-autism-blue text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors shadow-soft hover:shadow-soft-hover">
          Área do Profissional
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24">
        
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-20">
          <div className="w-full lg:w-1/2 space-y-8 relative">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-autism-green/10 text-autism-green font-bold text-sm">
              <Heart className="w-4 h-4" /> Feito com carinho para famílias
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-800 leading-tight">
              Apoio precoce,<br />
              <span className="text-autism-blue">futuro brilhante.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              Nossa plataforma de triagem utiliza inteligência artificial acolhedora para avaliar sinais de neurodivergência de forma leve, acessível e no conforto do seu lar.
            </p>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
            {/* CSS Lúdico Hero Illustration */}
            <div className="relative w-80 h-80 flex items-center justify-center">
               <div className="absolute inset-0 bg-white rounded-t-full rounded-bl-full shadow-soft-hover animate-float"></div>
               <div className="absolute w-64 h-64 rounded-full border-8 border-dashed border-autism-yellow/30 animate-[spin_60s_linear_infinite]"></div>
               <BrainCircuit className="w-24 h-24 text-autism-blue opacity-90" />
               <Heart className="absolute top-12 right-12 w-10 h-10 text-autism-red animate-float-delayed" />
               <Activity className="absolute bottom-16 left-12 w-12 h-12 text-autism-green animate-float" />
            </div>
          </div>
        </section>

        {/* CONTAINER DO FORMULÁRIO */}
        <section className="bg-white rounded-[2.5rem] shadow-soft p-8 md:p-14 max-w-4xl mx-auto border-4 border-slate-50 relative">
          <div className="absolute -top-6 -right-6 w-12 h-12 bg-autism-yellow rounded-full flex items-center justify-center shadow-soft animate-float">
             <PlusCircle className="text-white w-6 h-6" />
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Iniciar Nova Avaliação</h2>
            <p className="text-slate-500 font-medium">Preencha com calma. Nós daremos o primeiro passo juntos.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* FILE UPLOAD CARD */}
            <div className="space-y-4">
              <label className="flex items-center text-lg font-bold text-slate-700">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-autism-blue/20 text-autism-blue mr-3">1</span>
                Vídeo Corto da Criança
              </label>
              <div 
                {...getRootProps()} 
                className={`border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDragActive ? "border-autism-blue bg-autism-blue/5" : "border-slate-200 hover:border-autism-blue/50 hover:bg-slate-50"
                }`}
              >
                <input {...getInputProps()} />
                {videoFile ? (
                  <div className="flex flex-col items-center text-autism-green">
                    <CheckCircle2 className="w-16 h-16 mb-4" />
                    <p className="font-bold text-lg">{videoFile.name}</p>
                    <p className="text-sm mt-2 font-medium">Clique para trocar de arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <UploadCloud className="w-16 h-16 mb-4 text-autism-blue/60" />
                    <p className="font-bold text-lg text-slate-600 text-center">Arraste um vídeo aqui ou clique para selecionar</p>
                    <p className="text-sm mt-2">MP4 ou MOV (10 a 15 segundos recomendados)</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* PARENT TEXT INPUTS */}
            <div className="space-y-8">
              <label className="flex items-center text-lg font-bold text-slate-700">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-autism-green/20 text-autism-green mr-3">2</span>
                Observações Diárias
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block font-bold text-slate-600 text-sm">Quais comportamentos chamaram sua atenção?</label>
                  <textarea 
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    placeholder="Ex: Ele cruza as perninhas e balança muito as mãos..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:border-autism-green/50 focus:bg-white transition-colors"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block font-bold text-slate-600 text-sm">Há atrasos na fala ou comunicação?</label>
                  <textarea 
                    value={communication}
                    onChange={(e) => setCommunication(e.target.value)}
                    placeholder="Ex: Ainda não formula frases completas..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:border-autism-yellow/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl">
                <label className="block font-bold text-slate-600 text-sm mb-4">A criança responde quando é chamada pelo nome?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" value="yes" checked={responds === "yes"} onChange={(e)=>setResponds(e.target.value)} className="w-5 h-5 accent-autism-blue" />
                    <span className="font-semibold text-slate-600 group-hover:text-autism-blue transition-colors">Sim, prontamente</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" value="no" checked={responds === "no"} onChange={(e)=>setResponds(e.target.value)} className="w-5 h-5 accent-autism-red" />
                    <span className="font-semibold text-slate-600 group-hover:text-autism-red transition-colors">Não / Raramente</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-6 flex justify-center">
              <button 
                type="submit" 
                disabled={loading || !videoFile}
                className="w-full md:w-auto bg-autism-blue hover:bg-blue-600 text-white font-extrabold text-xl py-5 px-16 rounded-full disabled:opacity-50 transition-all shadow-soft hover:shadow-soft-hover transform hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Analisando com Carinho...
                  </>
                ) : "Iniciar Avaliação"}
              </button>
            </div>
            
          </form>
        </section>
      </main>

      {/* LUDIC FOOTER */}
      <footer className="w-full pb-10 pt-20 border-t border-slate-200 mt-20 text-center relative overflow-hidden">
         <p className="text-slate-400 font-medium">Gemma4-Good © 2024. Construído para auxiliar e transformar.</p>
         {/* Subtle autism color dots in footer */}
         <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-autism-blue opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-autism-yellow opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-autism-red opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-autism-green opacity-50"></div>
         </div>
      </footer>

    </div>
  );
}
