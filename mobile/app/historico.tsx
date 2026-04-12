import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { ArrowLeft, Clock, FileText } from '../components/LucideIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReportEntry {
  id: number;
  job_id: string;
  risk_score: number;
  risk_level: string;
  child_name?: string;
  created_at: string;
}

export default function HistoricoScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@historico_relatorios');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          // Ordenar do mais recente para o mais antigo
          parsedHistory.sort((a: ReportEntry, b: ReportEntry) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setReports(parsedHistory);
        }
      } catch (e) {
        console.error("Unable to load history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <View className="flex-1 bg-slate-50">
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.push('/')} className="flex-row items-center mb-6">
          <ArrowLeft color="#64748b" size={20} />
          <Text className="text-slate-500 font-bold ml-2">Voltar</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-extrabold text-slate-800 mb-6">Meu Histórico</Text>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <View className="gap-4">
            {reports.length === 0 ? (
              <View className="bg-white p-8 rounded-3xl border border-slate-100 items-center justify-center">
                <Text className="text-slate-400 font-bold">Nenhuma avaliação salva encontrada.</Text>
              </View>
            ) : (
              reports.map((report) => (
                <TouchableOpacity 
                   key={report.id} 
                   onPress={() => router.push(`/resultado?job_id=${report.job_id}`)}
                   className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100 flex-row justify-between items-center"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-4">
                       <FileText color="#3b82f6" size={20} />
                    </View>
                    <View>
                      <Text className="font-bold text-slate-800 text-base">
                        Triagem {report.child_name || `#${report.job_id.slice(0, 8)}...`}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Clock color="#cbd5e1" size={14} style={{ marginRight: 4 }} />
                        <Text className="text-slate-400 text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className={`px-3 py-1 rounded-full ${report.risk_level === 'ALTO' ? 'bg-rose-100' : report.risk_level === 'MODERADO' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    <Text className={`text-xs font-bold ${report.risk_level === 'ALTO' ? 'text-rose-700' : report.risk_level === 'MODERADO' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {report.risk_level}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
