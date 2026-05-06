import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { ArrowLeft, Clock, FileText, Trash } from '../components/LucideIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@historico_relatorios');
        let localReports = savedHistory ? JSON.parse(savedHistory) : [];
        
        if (isAuthenticated && user?.token) {
          try {
            const apiURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${apiURL}/api/reports`, {
              headers: {
                'Authorization': `Bearer ${user.token}`
              }
            });
            if (response.ok) {
              const cloudData = await response.json();
              const cloudReports = cloudData.reports || [];
              
              const combined = [...localReports];
              cloudReports.forEach((cr: any) => {
                if (!combined.find(lr => lr.job_id === cr.job_id)) {
                  combined.push(cr);
                }
              });
              localReports = combined;
            }
          } catch (err) {
            console.warn("Cloud fetch failed", err);
          }
        }

        localReports.sort((a: ReportEntry, b: ReportEntry) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReports(localReports);
      } catch (e) {
        console.error("Unable to load history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [isAuthenticated, user?.token]);

  const deleteReport = async (id: number) => {
    Alert.alert(
      t('common.confirm') || 'Confirmar',
      t('history.deleteConfirm') || 'Deseja excluir este relatório do histórico?',
      [
        { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
        { 
          text: t('common.delete') || 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
               const updatedReports = reports.filter(r => r.id !== id);
               setReports(updatedReports);
               await AsyncStorage.setItem('@historico_relatorios', JSON.stringify(updatedReports));
               showToast('Relatório excluído com sucesso!', 'success');
            } catch (e) {
              console.error("Error deleting report", e);
              Alert.alert('Erro', 'Falha ao excluir.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.push('/')} className="flex-row items-center mb-6">
          <ArrowLeft color="#64748b" size={20} />
          <Text className="text-slate-500 font-bold ml-2">{t('nav.back')}</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-extrabold text-slate-800 mb-6">{t('history.title')}</Text>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <View className="gap-4">
            {reports.length === 0 ? (
              <View className="bg-white p-8 rounded-3xl border border-slate-100 items-center justify-center">
                <Text className="text-slate-400 font-bold">{t('history.emptyState')}</Text>
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
                        {t('history.triagemPrefix')}{report.child_name || `#${report.job_id.slice(0, 8)}...`}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Clock color="#cbd5e1" size={14} style={{ marginRight: 4 }} />
                        <Text className="text-slate-400 text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-3">
                    <View className={`px-3 py-1 rounded-full ${report.risk_level === 'ALTO' ? 'bg-rose-100' : report.risk_level === 'MODERADO' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                      <Text className={`text-xs font-bold ${report.risk_level === 'ALTO' ? 'text-rose-700' : report.risk_level === 'MODERADO' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {report.risk_level === 'ALTO' ? t('report.riskHigh') : report.risk_level === 'MODERADO' ? t('report.riskModerate') : t('report.riskLow')}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteReport(report.id);
                      }}
                      className="p-2 bg-slate-100 rounded-full"
                    >
                      <Trash color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
