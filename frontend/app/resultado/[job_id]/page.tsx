"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { CheckCircle2, AlertCircle, FileText, Settings, ArrowLeft, BrainCircuit, Printer, Mail, MessageCircle, Copy, Check, Save, LogIn } from "lucide-react";
import Markdown from 'react-markdown';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/app/contexts/AuthContext";
import Image from "next/image";

export default function ResultadoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStatus = async () => {
    if (!params.job_id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.get(`${apiUrl}/api/triagem/${params.job_id}`);
      
      if (res.data.status === "done") {
        setData(res.data);
        setLoading(false);
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

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(false);
      setData(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await axios.post(`${apiUrl}/api/triagem/${params.job_id}/retry`);
      fetchStatus();
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
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

  const handleShareWhatsApp = () => {
    const text = `📋 *Relatório de Triagem - Primeiro Olhar*\n\n` +
      `🔬 Score de Risco: ${data.risk_score.score.toFixed(2)} (${data.risk_score.level})\n` +
      `🆔 ID: ${params.job_id}\n\n` +
      `Acesse o relatório completo:\n${window.location.href}\n\n` +
      `⚠ Este relatório é orientativo e não substitui avaliação profissional.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Relatório de Triagem - Primeiro Olhar (${data.risk_score.level})`;
    const body = `Olá,\n\n` +
      `Segue o relatório de triagem gerado pela plataforma Primeiro Olhar.\n\n` +
      `Score de Risco: ${data.risk_score.score.toFixed(2)} (${data.risk_score.level})\n` +
      `ID da Triagem: ${params.job_id}\n\n` +
      `Link do relatório: ${window.location.href}\n\n` +
      `⚠ Aviso: Este relatório é gerado por inteligência artificial com finalidade orientativa. ` +
      `Não constitui diagnóstico clínico e não substitui a avaliação por profissionais de saúde qualificados.\n\n` +
      `— Primeiro Olhar`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSaveReport = async () => {
    if (!isAuthenticated || !user) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await axios.post(`${apiUrl}/api/reports`, {
        job_id: params.job_id,
        report_data: data
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSaved(true);
    } catch (err) {
      console.error("Erro ao salvar relatório:", err);
      alert("Não foi possível salvar o relatório. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-md text-center">
          <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Não foi possível gerar o relatório</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            O serviço de análise está temporariamente indisponível. Isso pode ocorrer por alta demanda nos servidores. 
            Por favor, aguarde alguns minutos e tente novamente.
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
              Tentar Novamente
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
    { subject: 'Contato Visual', A: video_features?.eye_contact_ratio * 100, fullMark: 100 },
    { subject: 'Expressividade', A: video_features?.facial_expressivity === 'low' ? 30 : 90, fullMark: 100 },
    { subject: 'Prosódia', A: audio_features?.prosody_variation * 100, fullMark: 100 },
    { subject: 'Sintomas Narrados', A: risk_score.score * 100, fullMark: 100 },
    { subject: 'Alerta Risco', A: risk_score.score * 100, fullMark: 100 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans pb-20 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
        
        {/* LOGO COM SÍMBOLO PARA IMPRESSÃO */}
        <div className="hidden print:flex items-center gap-2 mb-2 border-b pb-4 border-slate-200">
          <Image 
            src="/logo_v4.png" 
            alt="Ícone Primeiro Olhar" 
            width={40} 
            height={40} 
            className="w-10 h-10 object-contain" 
            priority
          />
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
               
               <div className="prose prose-slate prose-sky max-w-none text-slate-700 text-justify prose-p:mb-5 prose-p:leading-relaxed prose-strong:font-bold prose-strong:text-slate-900 prose-headings:font-semibold prose-h3:text-sky-800 prose-li:marker:text-sky-400">
                  <Markdown>{gemma_report}</Markdown>
               </div>

               {/* SHARE BAR */}
               <div className="mt-12 pt-6 border-t border-slate-100 print:hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Compartilhar Relatório</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => window.print()} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
                    >
                      <Printer className="w-4 h-4" /> Imprimir / PDF
                    </button>
                    <button 
                      onClick={handleShareEmail} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-sm"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button 
                      onClick={handleShareWhatsApp} 
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all text-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
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
                      {copied ? 'Copiado!' : 'Copiar Link'}
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
                  <p className="font-bold text-slate-700">Salvar no seu histórico</p>
                  <p className="text-sm text-slate-500">Logado como {user.name}</p>
                </div>
              </div>
              {saved ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm bg-emerald-50 px-5 py-2.5 rounded-xl">
                  <Check className="w-4 h-4" /> Relatório salvo!
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
                  {saving ? 'Salvando...' : 'Salvar Relatório'}
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
                  <p className="font-bold text-slate-700">Deseja guardar este relatório?</p>
                  <p className="text-sm text-slate-500">Faça login com Google para salvar no seu histórico</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('pendingReportJobId', String(params.job_id));
                  localStorage.setItem('pendingReportData', JSON.stringify(data));
                  const event = new CustomEvent('openGoogleLogin');
                  window.dispatchEvent(event);
                }}
                className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </button>
            </div>
          )}
        </div>

        {/* DISCLAIMER LEGAL */}
        <div className="mt-8 bg-amber-50/60 border border-amber-200/60 rounded-2xl p-6 print:mt-6 print:border-amber-300">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-amber-700">⚠ Aviso Importante:</span> Este relatório é gerado por um sistema de inteligência artificial com finalidade exclusivamente orientativa e educacional. 
            Os resultados apresentados <strong>não constituem diagnóstico clínico</strong> e não substituem, em nenhuma hipótese, a avaliação presencial realizada por profissionais de saúde 
            qualificados (neuropediatras, psicólogos, fonoaudiólogos ou psiquiatras). A plataforma Primeiro Olhar destina-se a auxiliar na identificação precoce de sinais que possam justificar 
            o encaminhamento para avaliação especializada. Nenhuma decisão clínica, terapêutica ou educacional deve ser tomada com base unicamente neste relatório. 
            Em caso de dúvida sobre o desenvolvimento da criança, procure orientação médica profissional.
          </p>
        </div>

      </div>
    </main>
  );
}
