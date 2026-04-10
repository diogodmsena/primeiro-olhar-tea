"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { History, ArrowLeft, AlertCircle, FileText, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import axios from "axios";

interface ReportEntry {
  id: number;
  job_id: string;
  risk_score: number;
  risk_level: string;
  created_at: string;
}

export default function HistoricoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push("/");
      return;
    }

    const fetchReports = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await axios.get(`${apiUrl}/api/reports`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setReports(res.data.reports || []);
      } catch {
        setError(true);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
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

  const getRiskColor = (level: string) => {
    const l = level.toUpperCase();
    if (l === 'ALTO') return 'bg-red-100 text-red-700 border-red-200';
    if (l === 'MÉDIO') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <button 
          onClick={() => router.push('/')} 
          className="text-sky-600 hover:text-sky-800 flex items-center text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Início
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="bg-blue-100 p-3 rounded-2xl">
            <History className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meus Relatórios</h1>
            <p className="text-slate-500 text-sm font-medium">Histórico de triagens realizadas</p>
          </div>
        </div>

        {loadingReports ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Carregando relatórios...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-semibold">Erro ao carregar relatórios</p>
            <p className="text-sm text-slate-500 mt-1">Tente novamente mais tarde</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum relatório salvo</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Realize uma triagem e salve o resultado para que ele apareça aqui no seu histórico.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
            >
              Iniciar Avaliação
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
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
                      <p className="font-bold text-slate-800 text-sm">Triagem #{report.job_id.slice(0, 8)}...</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{report.risk_score.toFixed(2)}</span>
                      </div>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskColor(report.risk_level)}`}>
                        {report.risk_level}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
