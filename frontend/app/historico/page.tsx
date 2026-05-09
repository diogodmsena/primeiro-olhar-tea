"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { History, ArrowLeft, AlertCircle, FileText, TrendingUp, Calendar, ExternalLink, Trash2, Cloud, HardDrive, Settings } from "lucide-react";
import axios from "axios";

interface ReportEntry {
  id: number;
  job_id: string;
  risk_score: number;
  risk_level: string;
  child_name: string;
  created_at: string;
}

export default function HistoricoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useI18n();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const localHistory = localStorage.getItem('primeiro_olhar_historico');
        let combinedReports: (ReportEntry & { isSynced?: boolean })[] = localHistory ? JSON.parse(localHistory) : [];
        // 2. Carregar da Nuvem se autenticado
        if (isAuthenticated && user?.token) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await axios.get(`${apiUrl}/api/reports`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const cloudReports = res.data.reports || [];
            const cloudJobIds = new Set(cloudReports.map((r: ReportEntry) => r.job_id));

            // Marcar locais como sincronizados se estiverem na nuvem
            combinedReports = combinedReports.map(r => ({
              ...r,
              isSynced: cloudJobIds.has(r.job_id)
            }));

            // Adicionar relatórios que estão apenas na nuvem
            const localJobIds = new Set(combinedReports.map(r => r.job_id));
            cloudReports.forEach((cr: ReportEntry) => {
              if (!localJobIds.has(cr.job_id)) {
                combinedReports.push({ ...cr, isSynced: true });
              }
            });
          } catch (err) {
            console.error("Erro ao carregar relatórios da nuvem:", err);
          }
        } else {
          // Se não estiver logado, todos são considerados "não sincronizados" (locais)
          combinedReports = combinedReports.map(r => ({ ...r, isSynced: false }));
        }

        // Ordenar por data decrescente
        combinedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReports(combinedReports as (ReportEntry & { isSynced: boolean })[]);
      } catch (e) {
        console.error("Erro ao carregar histórico:", e);
        setError(true);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [isAuthenticated, isLoading, user]);

  const handleSyncReports = async () => {
    if (!isAuthenticated || !user?.token) return;
    setSyncing(true);
    
    const unsynced = (reports as (ReportEntry & { isSynced: boolean })[]).filter(r => !r.isSynced);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    let successCount = 0;
    for (const report of unsynced) {
      try {
        // Buscar dados completos do relatório para sincronizar
        const res = await axios.get(`${apiUrl}/api/triagem/${report.job_id}`);
        if (res.data.status === "done") {
          await axios.post(`${apiUrl}/api/reports`, {
            job_id: report.job_id,
            report_data: res.data
          }, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          successCount++;
        }
      } catch (e) {
        console.error(`Falha ao sincronizar job ${report.job_id}:`, e);
      }
    }

    if (successCount > 0) {
      // Recarregar relatórios para atualizar status
      const localHistory = localStorage.getItem('primeiro_olhar_historico');
      const combinedReports: ReportEntry[] = localHistory ? JSON.parse(localHistory) : [];
      
      const res = await axios.get(`${apiUrl}/api/reports`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const cloudReports = res.data.reports || [];
      const cloudJobIds = new Set(cloudReports.map((r: ReportEntry) => r.job_id));

      const updated = combinedReports.map(r => ({ ...r, isSynced: cloudJobIds.has(r.job_id) }));
      const localJobIds = new Set(updated.map(r => r.job_id));
      cloudReports.forEach((cr: ReportEntry) => {
        if (!localJobIds.has(cr.job_id)) {
          updated.push({ ...cr, isSynced: true });
        }
      });
      
      updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReports(updated as (ReportEntry & { isSynced: boolean })[]);
      alert(`${successCount} relatórios sincronizados com sucesso!`);
    } else {
      alert("Nenhum relatório novo para sincronizar ou erro na conexão.");
    }
    
    setSyncing(false);
  };

  const handleDeleteReport = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!confirm(t('history.deleteConfirm') || "Deseja excluir este relatório?")) return;

    try {
      // 1. Remover do Local Storage
      const localHistory = localStorage.getItem('primeiro_olhar_historico');
      if (localHistory) {
        const historyArray = JSON.parse(localHistory);
        const updated = historyArray.filter((r: ReportEntry) => r.job_id !== jobId);
        localStorage.setItem('primeiro_olhar_historico', JSON.stringify(updated));
      }

      // 2. Remover da Nuvem se autenticado
      if (isAuthenticated && user?.token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await axios.delete(`${apiUrl}/api/reports/${jobId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }

      // 3. Atualizar Estado
      setReports(prev => prev.filter(r => r.job_id !== jobId));
    } catch (err) {
      console.error("Erro ao excluir relatório:", err);
      alert("Erro ao excluir. O relatório pode ter sido removido apenas localmente.");
      setReports(prev => prev.filter(r => r.job_id !== jobId));
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getRiskDisplay = (level: string) => {
    const l = (level || "").toLowerCase();
    if (l.includes('alto') || l.includes('high') || l.includes('forte') || l.includes('strong')) {
      return { 
        label: t('results.indicatorForte'), 
        classes: 'bg-red-100 text-red-700 border-red-200' 
      };
    }
    if (l.includes('médio') || l.includes('moderate') || l.includes('moderado')) {
      return { 
        label: t('results.indicatorModerado'), 
        classes: 'bg-amber-100 text-amber-700 border-amber-200' 
      };
    }
    return { 
      label: t('results.indicatorLeve'), // Default para Baixo/Leve
      classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    };
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <button 
          onClick={() => router.push('/')} 
          className="text-sky-600 hover:text-sky-800 flex items-center text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('history.backHome')}
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <History className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('history.title')}</h1>
            <p className="text-slate-500 text-sm font-medium">{t('history.subtitle')}</p>
          </div>
          
          {isAuthenticated && (reports as (ReportEntry & { isSynced?: boolean })[]).some(r => !r.isSynced) && (
             <button
               onClick={handleSyncReports}
               disabled={syncing}
               className="ml-auto flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
             >
               {syncing ? <Settings className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
               {syncing ? "Sincronizar" : "Sincronizar"}
             </button>
          )}
        </div>

        {loadingReports ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">{t('history.loadingReports')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-semibold">{t('history.errorTitle')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('history.errorDesc')}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t('history.emptyTitle')}</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              {t('history.emptyDesc')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
            >
              {t('form.submitButton')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const risk = getRiskDisplay(report.risk_level);
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md hover:border-blue-100 transition-all group cursor-pointer"
                  onClick={() => router.push(`/resultado/${report.job_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-100 group-hover:bg-blue-100 p-3 rounded-xl transition-colors">
                        <FileText className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {report.child_name || `#${report.job_id.slice(0, 8)}...`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.created_at)}
                          </span>
                          <span className="text-slate-200">•</span>
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${(report as ReportEntry & { isSynced?: boolean }).isSynced ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {(report as ReportEntry & { isSynced?: boolean }).isSynced ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                            {(report as ReportEntry & { isSynced?: boolean }).isSynced ? "Sincronizado" : "Local"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right mr-2">
                        <div className="flex items-center gap-2 justify-end">
                          <TrendingUp className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{(report.risk_score * 100).toFixed(0)}%</span>
                        </div>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${risk.classes}`}>
                          {risk.label}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteReport(e, report.job_id)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
