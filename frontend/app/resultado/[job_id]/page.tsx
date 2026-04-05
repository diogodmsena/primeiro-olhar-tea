"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { CheckCircle2, AlertCircle, FileText, Settings, ArrowLeft, BrainCircuit } from "lucide-react";
import Markdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.job_id) return;
    
    // Polling mechanism
    const fetchStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await axios.get(`${apiUrl}/api/triagem/${params.job_id}`);
        
        if (res.data.status === "done") {
          setData(res.data);
          setLoading(false);
        } else if (res.data.status === "error" || res.data.status === "not_found") {
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
    
    fetchStatus();
  }, [params.job_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-sky-900 bg-slate-50">
        <Settings className="w-16 h-16 animate-spin text-sky-400 mb-6" />
        <h2 className="text-2xl font-light">Processamento Multimodal em Andamento</h2>
        <p className="text-slate-500 mt-2">Gemma 4 Native Function Calling atuando sobre visuais e áudio...</p>
        
        <div className="mt-12 space-y-4 text-sm text-slate-400 max-w-sm w-full">
          <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Pipeline Iniciado...</div>
          <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Video Processor (Gaze & Action)...</div>
          <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Audio Processor (Prosody)...</div>
          <div className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Risk Engine Modeling...</div>
          <div className="flex items-center animate-pulse"><Settings className="w-4 h-4 mr-2 animate-spin text-sky-400"/> Agentic Gemma 4 Retrieval...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 bg-red-50">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl">Erro ao processar a triagem no Gemma</h2>
        <button onClick={() => router.push('/')} className="mt-6 text-sky-600 underline">Voltar</button>
      </div>
    );
  }

  const { risk_score, video_features, audio_features, gemma_report } = data;
  const isHighRisk = risk_score.score >= 0.67;

  const radarData = [
    { subject: 'Contato Visual', A: video_features?.eye_contact_ratio * 100, fullMark: 100 },
    { subject: 'Expressividade', A: video_features?.facial_expressivity === 'low' ? 30 : 90, fullMark: 100 },
    { subject: 'Prosódia', A: audio_features?.prosody_variation * 100, fullMark: 100 },
    { subject: 'Sintomas Narrados', A: risk_score.score * 100, fullMark: 100 },
    { subject: 'Alerta Risco', A: risk_score.score * 100, fullMark: 100 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans pb-20 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
        
        {/* LOGO EXCLUSIVA PARA IMPRESSÃO */}
        <div className="hidden print:flex items-center gap-2 mb-2 border-b pb-4 border-slate-200">
          <div className="font-extrabold text-3xl tracking-tight text-slate-800">
            Primeiro<span className="text-blue-500">Olhar</span>
          </div>
          <span className="ml-auto text-sm text-slate-500 font-bold">Relatório Especializado</span>
        </div>

        <button onClick={() => router.push('/')} className="text-sky-600 hover:text-sky-800 flex items-center text-sm font-medium mb-8 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4 mr-1" /> Nova Triagem
        </button>

        <header className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0 print:mb-6">
             <div>
                <h1 className="text-2xl font-semibold text-slate-800">Resultado da Triagem</h1>
                <p className="text-slate-500 mt-1 flex items-center"><FileText className="w-4 h-4 mr-1" /> ID: {params.job_id} | Modelo: Gemma 4</p>
             </div>
             
             <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Score de Risco Frio</p>
                <div className="flex items-center justify-end">
                    <span className="text-3xl font-light text-slate-700 mr-3">{risk_score.score.toFixed(2)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isHighRisk ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"
                    }`}>
                        {risk_score.level}
                    </span>
                </div>
             </div>
        </header>

        <div className="grid md:grid-cols-5 gap-6 print:gap-4 print:block">
           
           {/* Radar Chart */}
           <div className="md:col-span-2 space-y-6 print:break-inside-avoid print:mb-8">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col print:shadow-none print:border-none print:p-0">
                   <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b pb-2">Distribuição Multimodal (Radar)</h3>
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
                      <h2 className="text-lg font-semibold text-slate-800">Relatório Explicativo Humano</h2>
                      <p className="text-xs text-sky-600 font-medium">Powered by Gemma 4 Agentic Analytics</p>
                   </div>
               </div>
               
               <div className="prose prose-slate prose-sky max-w-none text-slate-700 prose-headings:font-medium prose-h3:text-sky-800 prose-li:marker:text-sky-400">
                  <Markdown>{gemma_report}</Markdown>
               </div>

               <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end gap-4 print:hidden">
                   <button className="bg-white border border-slate-200 text-slate-600 font-medium py-2 px-6 rounded-lg hover:bg-slate-50 transition-colors">
                       Revisar Features Brutas
                   </button>
                   <button onClick={() => window.print()} className="bg-sky-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-sky-700 shadow-md shadow-sky-200 transition-all">
                       Compartilhar Relatório Físico
                   </button>
               </div>
           </div>
        </div>

      </div>
    </main>
  );
}
