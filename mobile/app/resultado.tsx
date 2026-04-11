import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';
import { FileText, ArrowLeft, Loader2, Sparkles } from '../components/LucideIcons';
import axios from 'axios';

export default function ResultadoScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { job_id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!job_id) return;

    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await axios.get(`${apiUrl}/api/triagem/${job_id}`);
        
        if (response.data?.status === 'done') {
          setData(response.data);
          setLoading(false);
          clearInterval(intervalId);
        } else if (response.data?.status === 'error') {
          setLoading(false);
          clearInterval(intervalId);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);

    return () => clearInterval(intervalId);
  }, [job_id]);

  if (loading || !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <Header />
        <View className="flex-1 items-center justify-center p-6">
           <ActivityIndicator size="large" color="#3b82f6" />
           <Text className="text-xl font-bold text-slate-700 mt-6 text-center">Processando Análise Multimodal</Text>
           <Text className="text-slate-500 text-center mt-2 max-w-xs cursor-pulse">A inteligência artificial está avaliando as reações visuais e sonoras com segurança...</Text>
        </View>
      </View>
    );
  }

  const scoreMap = {
    'BAIXO': { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Risco Baixo' },
    'MODERADO': { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Risco Moderado' },
    'ALTO': { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Risco Alto' }
  };
  const level = data.risk_score?.level?.toUpperCase() || 'BAIXO';
  const displayScore = scoreMap[level as keyof typeof scoreMap] || { color: 'text-slate-500', bg: 'bg-slate-500', label: data.risk_score?.level || 'Indefinido' };
  const scoreValue = data.risk_score?.score ? Math.round(data.risk_score.score * 100) : 0;

  return (
    <View className="flex-1 bg-white">
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <TouchableOpacity onPress={() => router.push('/')} className="flex-row items-center mb-6">
          <ArrowLeft color="#64748b" size={20} />
          <Text className="text-slate-500 font-bold ml-2">Voltar ao Início</Text>
        </TouchableOpacity>

        <View className="bg-slate-50 border border-slate-100 p-6 rounded-3xl mb-8 items-center shadow-lg shadow-slate-100">
           <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Sparkles className="text-blue-500" size={32} />
           </View>
           <Text className="text-2xl font-bold text-slate-800 text-center">Resultado Disponível</Text>
           {data.child_name && (
             <Text className="text-lg font-bold text-blue-500 mt-1">{data.child_name}</Text>
           )}
           <Text className="text-slate-500 text-center mt-2 text-sm max-w-[250px]">Lembre-se, este é um relatório de triagem para apoio profissional, não um diagnóstico clínico definitivo.</Text>
        </View>

        {/* Nível de Risco Geral */}
        <View className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6 shadow-sm shadow-slate-200">
           <Text className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">Score de Risco Global</Text>
           <View className="flex-row items-end mb-4">
              <Text className={`text-5xl font-black ${displayScore.color}`}>{scoreValue}%</Text>
              <Text className="text-slate-400 font-bold mb-2 ml-2 tracking-wide">{displayScore.label}</Text>
           </View>
           
           <View className="h-4 bg-slate-100 rounded-full w-full overflow-hidden flex-row">
             <View className={`h-full ${displayScore.bg} rounded-full`} style={{ width: `${scoreValue}%` }} />
           </View>
        </View>

        {/* Avaliação em Barras */}
        <View className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6 shadow-sm shadow-slate-200">
           <Text className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">Dimensões Analisadas</Text>

           <View className="mb-4">
             <View className="flex-row justify-between mb-1"><Text className="font-bold text-slate-700">Contato Visual</Text><Text className="text-blue-500 font-bold">{Math.round((data.video_features?.eye_contact_ratio || 0) * 100)}/100</Text></View>
             <View className="h-3 bg-slate-100 rounded-full w-full"><View className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.video_features?.eye_contact_ratio || 0) * 100}%` }} /></View>
           </View>
           <View className="mb-4">
             <View className="flex-row justify-between mb-1"><Text className="font-bold text-slate-700">Expressividade Facial</Text><Text className="text-emerald-500 font-bold">Score</Text></View>
             <View className="h-3 bg-slate-100 rounded-full w-full"><View className="h-full bg-emerald-500 rounded-full" style={{ width: `70%` }} /></View>
           </View>
           <View className="mb-2">
             <View className="flex-row justify-between mb-1"><Text className="font-bold text-slate-700">Contato Auditivo / Prosódia</Text><Text className="text-amber-500 font-bold">{Math.round((data.audio_features?.prosody_variation || 0) * 100)}/100</Text></View>
             <View className="h-3 bg-slate-100 rounded-full w-full"><View className="h-full bg-amber-500 rounded-full" style={{ width: `${(data.audio_features?.prosody_variation || 0) * 100}%` }} /></View>
           </View>
        </View>

        {/* Parecer do Gemma em Markdown */}
        <View className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
           <View className="flex-row items-center mb-4 border-b border-blue-100 pb-4">
             <FileText color="#3b82f6" size={24} />
             <Text className="text-blue-800 font-bold ml-2 text-lg">Laudo do Especialista AI</Text>
           </View>
           <Markdown style={{ 
               body: { color: '#334155', fontSize: 15, lineHeight: 24 },
               heading2: { color: '#1e40af', fontSize: 18, marginBottom: 8, marginTop: 12 },
               strong: { color: '#1e3a8a' },
               list_item: { marginBottom: 6 }
             }}>
             {data.gemma_report || "O laudo formatado não foi gerado nesta execução."}
           </Markdown>
        </View>

      </ScrollView>
    </View>
  );
}
