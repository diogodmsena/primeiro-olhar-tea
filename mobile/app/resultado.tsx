import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share, Alert, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';
import { BrainCircuit, ArrowLeft, Loader2, Sparkles, Share as ShareIcon, Save, Eye, Smile, Ear, Info } from '../components/LucideIcons';
import { LOGO_BASE64 } from '../components/LogoBase64';
import { RadarChart } from '../components/RadarChart';
// axios removido — usando fetch nativo para evitar bloqueio do Cloudflare
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay,
  FadeInDown,
  FadeOutDown
} from 'react-native-reanimated';
import { CheckCircle, XCircle, AlertTriangle } from '../components/LucideIcons';

export default function ResultadoScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { job_id, history } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user, signIn, isAuthenticated } = useAuth();
  const [showCarousel, setShowCarousel] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');
  const { showToast } = useToast();
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
        setActiveSlide((prev) => {
          const next = (prev + 1) % 4;
          scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
          return next;
        });
      }, 12000);
    }
    return () => clearInterval(slideTimer);
  }, [showCarousel, loading, width]);

  const handleScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveSlide(index);
  };

  useEffect(() => {
    if (!job_id) return;

    let intervalId: NodeJS.Timeout;

    const autoSyncToBackend = async (reportData: any, jobIdStr: string) => {
      if (!isAuthenticated || !user?.token) return;
      try {
        const apiURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        await fetch(`${apiURL}/auth/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({ job_id: jobIdStr, report_data: reportData }),
        });
      } catch (err) {
        console.warn('[Resultado] Auto cloud sync failed (silent):', err);
      }
    };

    const fetchStatus = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        const response = await fetch(`${apiUrl}/api/triagem/${job_id}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('[Resultado] HTTP error:', response.status);
          return;
        }

        const responseData = await response.json();

        if (responseData?.status === 'done') {
          setData(responseData);
          setLoading(false);
          clearInterval(intervalId);

          // Auto-save to local AsyncStorage
          const jobIdStr = typeof job_id === 'string' ? job_id : job_id[0];
          try {
            const savedHistory = await AsyncStorage.getItem('@historico_relatorios');
            const historyArray = savedHistory ? JSON.parse(savedHistory) : [];
            const exists = historyArray.find((item: any) => item.job_id === jobIdStr);
            if (!exists) {
              historyArray.push({
                id: Date.now(),
                job_id: jobIdStr,
                risk_score: responseData.risk_score?.score || 0,
                risk_level: responseData.risk_score?.level?.toUpperCase() || 'BAIXO',
                child_name: responseData.child_name || '',
                created_at: new Date().toISOString(),
              });
              await AsyncStorage.setItem('@historico_relatorios', JSON.stringify(historyArray));
              // Auto-sync to cloud if logged in
              autoSyncToBackend(responseData, jobIdStr);
            } else {
              setIsSaved(true);
            }
          } catch (e) {
            console.warn('Failed to auto-save history', e);
          }
        } else if (responseData?.status === 'error') {
          setLoading(false);
          setErrorMsg(responseData.error_message || 'Erro durante o processamento da triagem.');
          clearInterval(intervalId);
        } else if (responseData?.status === 'not_found') {
          setLoading(false);
          setErrorMsg('Este relatório não está mais disponível na nuvem ou expirou.');
          clearInterval(intervalId);
        }
      } catch (e) {
        console.error('[Resultado] fetch error:', e);
        setLoading(false);
        setErrorMsg('Erro de conexão ao buscar relatório.');
        clearInterval(intervalId);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);

    // Check if already saved
    const checkIsSaved = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@historico_relatorios');
        if (savedHistory) {
          const historyArray = JSON.parse(savedHistory);
          const exists = historyArray.find((item: any) => item.job_id === job_id);
          if (exists) setIsSaved(true);
        }
      } catch (e) {
        console.warn('Failed to check history', e);
      }
    };
    checkIsSaved();

    return () => clearInterval(intervalId);
  }, [job_id, isAuthenticated, user?.token]);

  const saveReport = async () => {
    if (!data) return;

    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired') || 'Login com Google',
        t('auth.loginToSave') || 'Deseja fazer login para salvar este relatório em sua conta? Você também pode salvar anonimamente apenas neste dispositivo.',
        [
          {
            text: t('common.cancel') || 'Cancelar',
            style: 'cancel',
          },
          {
            text: t('auth.saveAnonymously') || 'Salvar sem Login',
            onPress: () => performSave(null)
          },
          {
            text: t('auth.login') || 'Login com Google',
            onPress: async () => {
              try {
                await signIn();
                // After successful sign in, the user state will be updated.
                // We'll call performSave in a separate effect or just check user here
                // Since signIn is async and updates state, we might need to wait or use the returned value if AuthContext allowed it.
                // AuthContext doesn't return the user, but we can wait for the state update or just perform save with null if it fails.
                performSave('google-auth'); 
              } catch (e) {
                // If login fails, allow anonymous save
                performSave(null);
              }
            }
          }
        ]
      );
    } else {
      performSave(user?.googleId || 'google-auth');
    }
  };

  const performSave = async (userId: string | null) => {
    setSaving(true);
    try {
      const savedHistory = await AsyncStorage.getItem('@historico_relatorios');
      let historyArray = savedHistory ? JSON.parse(savedHistory) : [];
      
      const exists = historyArray.find((item: any) => item.job_id === job_id);
      if (!exists) {
        historyArray.push({
          id: Date.now(),
          job_id: typeof job_id === 'string' ? job_id : job_id[0],
          risk_score: data.risk_score?.score || 0,
          risk_level: data.risk_score?.level?.toUpperCase() || 'BAIXO',
          child_name: data.child_name || '',
          created_at: new Date().toISOString(),
          user_id: userId
        });
        await AsyncStorage.setItem('@historico_relatorios', JSON.stringify(historyArray));

        // Sync with backend if logged in
        if (isAuthenticated && user?.token) {
          try {
            const apiURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${apiURL}/auth/reports`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
              },
              body: JSON.stringify({
                job_id: typeof job_id === 'string' ? job_id : job_id[0],
                report_data: data
              })
            });
            
            if (!response.ok) {
              console.warn("Backend sync failed", await response.text());
            }
          } catch (err) {
            console.warn("Cloud sync error", err);
          }
        }
        
        showToast(t('report.successSaved') || 'Relatório salvo no seu histórico!', 'success');
        setIsSaved(true);
      } else {
        showToast(t('report.alreadySaved') || 'Este relatório já foi salvo.', 'warning');
        setIsSaved(true);
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar relatório.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const shareReport = async () => {
    if (!data) return;
    try {
      const { printToFileAsync } = require('expo-print');
      const { shareAsync } = require('expo-sharing');
      
      let logoBase64 = LOGO_BASE64;
      
      let localizedReport = data.gemma_report || '';
      
      if (locale && locale !== 'pt') {
        setTranslating(true);
        try {
          const apiURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
          const translateRes = await fetch(`${apiURL}/api/triagem/${job_id}/translate`, {
            method: 'POST',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ target_lang: locale }),
          });
          const translateData = translateRes.ok ? await translateRes.json() : null;
          if (translateData?.translated_report) {
            localizedReport = translateData.translated_report;
          }
        } catch (e) {
          console.warn("Translation failed", e);
        } finally {
          setTranslating(false);
        }
      }

      const parseMarkdown = (text: string) => {
        if (!text) return '';
        let parsed = text
          .replace(/^### (.*$)/gim, '<h3 style="color: #1e3a8a; margin-top: 12px; margin-bottom: 6px; font-size: 16px;">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 style="color: #1e40af; margin-top: 16px; margin-bottom: 8px; font-size: 18px;">$1</h2>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^\s*[\-\*]\s+(.*)$/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');
        return parsed.replace(/\n(?!(<li|<h|<u))/g, '<br/>');
      };
      const dateObj = data.created_at ? new Date(data.created_at) : new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;

      const htmlContent = `
        <html>
          <head>
            <style>
              @page { margin: 20mm; }
              body { font-family: Arial, sans-serif; padding: 0; margin: 0; color: #334155; }
            </style>
          </head>
          <body>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center;">
                ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width: 32px; height: 32px; margin-right: 8px;" />` : ''}
                <span style="font-size: 24px; font-weight: 900; color: #1e293b; margin-right: 4px;">Primeiro</span>
                <span style="font-size: 24px; font-weight: 900; color: #3b82f6;">Olhar</span>
              </div>
              <span style="font-size: 13px; color: #64748b; font-weight: 500;">${formattedDate}</span>
            </div>
            
            <h1 style="color: #1e40af; text-align: center; margin-bottom: 20px;">${t('report.evaluationTitle') || 'Avaliação preliminar'}</h1>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
            
            <h2 style="margin-top: 0;">${t('report.childName') || 'Criança'}: ${data.child_name || t('auth.unnamed')}</h2>
            <h3>${t('report.riskScore')}: <span style="color: #ef4444;">${data.risk_score?.level || t('report.undefined')}</span></h3>
            
            <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="margin-top: 0; margin-bottom: 15px; color: #475569;">${t('report.dimensions')}</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>${t('report.eyeContact')}:</strong></li>
                <li style="margin-bottom: 8px;"><strong>${t('report.facialExp')}:</strong></li>
                <li><strong>${t('report.auditory')}:</strong></li>
              </ul>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5;">
                <p style="margin: 0 0 5px 0;">${t('report.dimHelpEye')}</p>
                <p style="margin: 0 0 5px 0;">${t('report.dimHelpExp')}</p>
                <p style="margin: 0;">${t('report.dimHelpAud')}</p>
              </div>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; margin-top: 20px; border-radius: 8px; line-height: 1.6; text-align: justify;">
              ${parseMarkdown(localizedReport) || t('report.noReport')}
            </div>

            <div style="margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; text-align: justify;">
              <strong style="color: #b45309; display: block; margin-bottom: 8px; font-size: 14px;">${t('report.warningTitle')}</strong>
              ${t('report.warningText1')} <strong>${t('report.warningTextBold')}</strong> ${t('report.warningText2')}
            </div>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({ html: htmlContent });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error: any) {
      Alert.alert('Erro ao compartilhar', error.message);
    }
  };

  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
        <Header />
        <View className="flex-1 items-center justify-center p-6">
           <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
           <Text className="text-xl font-bold text-slate-700 text-center">Ops! Algo deu errado.</Text>
           <Text className="text-slate-500 text-center mt-2 max-w-xs">{errorMsg}</Text>
           <TouchableOpacity onPress={() => router.replace('/historico')} className="mt-8 bg-slate-200 px-6 py-3 rounded-full">
             <Text className="font-bold text-slate-700">Voltar ao Histórico</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !data) {
    const isFromHistory = history === 'true';
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
        <Header />
        {!showCarousel || isFromHistory ? (
          <View className="flex-1 items-center justify-center p-6">
             <ActivityIndicator size="large" color="#3b82f6" />
             <Text className="text-xl font-bold text-slate-700 mt-6 text-center">
               {isFromHistory ? 'Carregando relatório' : (t('report.processing') || 'Processando')}
             </Text>
             <Text className="text-slate-500 text-center mt-2 max-w-xs cursor-pulse">
               {isFromHistory ? 'Conectando à nuvem...' : (t('report.processingSubtitle') || 'Avaliando IA...')}
             </Text>
          </View>
        ) : (
          <View className="flex-1">
             <View className="items-center mt-20 mb-8">
               <ActivityIndicator size="large" color="#3b82f6" style={{ transform: [{ scale: 1.5 }] }} />
               <Text className="text-blue-600 font-black mt-8 text-xl text-center px-8">
                 {t('report.processing') || 'Processando'}
               </Text>
             </View>
             
             <ScrollView 
                ref={scrollViewRef}
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                className="flex-1"
             >
                {/* Slide 1: Eye Contact */}
                <View style={{ width }} className="items-center justify-center p-6">
                   <View className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-slate-200 w-full itmes-center">
                      <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6 align-self-center self-center">
                         <Eye color="#3b82f6" size={32} />
                      </View>
                      <Text className="text-xl font-extrabold text-blue-900 text-center mb-4">{t('report.carEyeTitle')}</Text>
                      <Text className="text-slate-600 text-center text-base mb-6 leading-relaxed">{t('report.carEyeDesc')}</Text>
                      <View className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <Text className="text-blue-800 text-sm font-medium text-center">{t('report.carEyeAlert')}</Text>
                      </View>
                   </View>
                </View>

                {/* Slide 2: Expressivity */}
                <View style={{ width }} className="items-center justify-center p-6">
                   <View className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-slate-200 w-full itmes-center">
                      <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-6 self-center">
                         <Smile color="#10b981" size={32} />
                      </View>
                      <Text className="text-xl font-extrabold text-emerald-900 text-center mb-4">{t('report.carExpTitle')}</Text>
                      <Text className="text-slate-600 text-center text-base mb-6 leading-relaxed">{t('report.carExpDesc')}</Text>
                      <View className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                         <Text className="text-emerald-800 text-sm font-medium text-center">{t('report.carExpAlert')}</Text>
                      </View>
                   </View>
                </View>

                {/* Slide 3: Prosody */}
                <View style={{ width }} className="items-center justify-center p-6">
                   <View className="bg-white p-8 rounded-3xl border border-amber-100 shadow-xl shadow-slate-200 w-full itmes-center">
                      <View className="w-16 h-16 rounded-full bg-amber-50 items-center justify-center mb-6 self-center">
                         <Ear color="#f59e0b" size={32} />
                      </View>
                      <Text className="text-xl font-extrabold text-amber-900 text-center mb-4">{t('report.carAudTitle')}</Text>
                      <Text className="text-slate-600 text-center text-base mb-6 leading-relaxed">{t('report.carAudDesc')}</Text>
                      <View className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                         <Text className="text-amber-800 text-sm font-medium text-center">{t('report.carAudAlert')}</Text>
                      </View>
                   </View>
                </View>

                {/* Slide 4: Disclaimer */}
                <View style={{ width }} className="items-center justify-center p-6">
                   <View className="bg-white p-8 rounded-3xl border border-rose-100 shadow-xl shadow-slate-200 w-full itmes-center">
                      <View className="w-16 h-16 rounded-full bg-rose-50 items-center justify-center mb-6 self-center">
                         <Info color="#f43f5e" size={32} />
                      </View>
                      <Text className="text-xl font-extrabold text-rose-900 text-center mb-4">{t('report.carDiscTitle')}</Text>
                      <Text className="text-slate-600 text-center text-base leading-relaxed">{t('report.carDiscDesc')}</Text>
                   </View>
                </View>

             </ScrollView>

             {/* Pagination Dots */}
             <View className="flex-row justify-center pb-12 gap-2">
               {[0, 1, 2, 3].map((i) => (
                 <View 
                   key={i} 
                   className={`h-2 rounded-full ${activeSlide === i ? 'w-6 bg-blue-500' : 'w-2 bg-slate-300'}`} 
                 />
               ))}
             </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const scoreMap = {
    'BAIXO': { color: 'text-emerald-500', bg: 'bg-emerald-500', label: t('report.riskLow') || 'Risco Baixo' },
    'MODERADO': { color: 'text-amber-500', bg: 'bg-amber-500', label: t('report.riskModerate') || 'Risco Moderado' },
    'ALTO': { color: 'text-rose-500', bg: 'bg-rose-500', label: t('report.riskHigh') || 'Risco Alto' }
  };
  const level = data.risk_score?.level?.toUpperCase() || 'BAIXO';
  const displayScore = scoreMap[level as keyof typeof scoreMap] || { color: 'text-slate-500', bg: 'bg-slate-500', label: data.risk_score?.level || t('report.undefined') };
  const scoreValue = data.risk_score?.score ? Math.round(data.risk_score.score * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.push('/')} className="flex-row items-center">
            <ArrowLeft color="#64748b" size={20} />
            <Text className="text-slate-500 font-bold ml-2">{t('nav.home') || 'Início'}</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            {!isSaved && (
              <TouchableOpacity onPress={saveReport} disabled={saving} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full flex-row items-center">
                <Save color="#3b82f6" size={16} />
                <Text className="text-blue-600 font-bold ml-2 text-sm">{saving ? t('report.saving') : t('report.save')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={shareReport} disabled={translating} className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full flex-row items-center">
              {translating ? <ActivityIndicator size="small" color="#64748b" /> : <ShareIcon color="#64748b" size={16} />}
              <Text className="text-slate-600 font-bold ml-2 text-sm">{translating ? '...' : (t('report.share') || 'Compartilhar')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-slate-50 border border-slate-100 p-6 rounded-3xl mb-8 items-center shadow-lg shadow-slate-100">
           <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Sparkles color="#3b82f6" size={32} />
           </View>
           <Text className="text-2xl font-bold text-slate-800 text-center">{t('report.resultAvailable') || 'Resultado Disponível'}</Text>
           {data.child_name && (
             <Text className="text-lg font-bold text-blue-500 mt-1">{data.child_name}</Text>
           )}
           <Text className="text-slate-500 text-center mt-2 text-lg max-w-[350px]">{t('report.resultDisclaimer')}</Text>
        </View>

        {/* Nível de Risco Geral */}
        <View className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6 shadow-sm shadow-slate-200">
           <Text className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">{t('report.riskScore')}</Text>
           <View className="flex-row items-end mb-4">
              <Text className={`text-3xl font-black ${displayScore.color}`}>{displayScore.label}</Text>
           </View>
           
           <View className="h-4 bg-slate-100 rounded-full w-full overflow-hidden flex-row">
             <View className={`h-full ${displayScore.bg} rounded-full`} style={{ width: `${scoreValue}%` }} />
           </View>
        </View>

        {/* Visualização de Gráfico Radial (Radar) */}
        <View className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6 shadow-sm shadow-slate-200 items-center">
           <Text className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider self-start">{t('report.radarChartTitle') || 'Perfil Multimodal'}</Text>
           
           <RadarChart 
             size={width - 80}
             data={[
               { label: t('report.eyeContact') || 'Olhar', value: (data.video_features?.eye_contact_ratio || 0) * 100 },
               { label: t('report.facialExp') || 'Expressão', value: data.video_features?.facial_expressivity === 'low' ? 30 : 90 },
               { label: t('report.auditory') || 'Áudio', value: (data.audio_features?.prosody_variation || 0) * 100 },
               { label: 'Risco', value: (data.risk_score?.score || 0) * 100 },
               { label: 'Incidência', value: (data.risk_score?.score || 0) * 100 },
             ]}
           />

           <View className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm shadow-slate-100 w-full">
             <Text className="text-sm text-slate-500 mb-2 leading-tight">• {t('report.dimHelpEye')}</Text>
             <Text className="text-sm text-slate-500 mb-2 leading-tight">• {t('report.dimHelpExp')}</Text>
             <Text className="text-sm text-slate-500 leading-tight">• {t('report.dimHelpAud')}</Text>
           </View>
        </View>

        {/* Avaliação em Barras (Detalhada) */}
        <View className="bg-white border-2 border-slate-100 p-6 rounded-3xl mb-6 shadow-sm shadow-slate-200">
           <Text className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">{t('report.dimensions')}</Text>

           <View className="mb-4">
             <View className="flex-row justify-between mb-1">
               <Text className="font-bold text-slate-700">{t('report.eyeContact')}</Text>
               <Text className="text-slate-400 text-xs font-bold">{Math.round((data.video_features?.eye_contact_ratio || 0) * 100)}%</Text>
             </View>
             <View className="h-3 bg-slate-100 rounded-full w-full overflow-hidden">
               <Animated.View 
                 entering={FadeInDown.delay(200).duration(1000)}
                 className="h-full bg-blue-500 rounded-full" 
                 style={{ width: `${(data.video_features?.eye_contact_ratio || 0) * 100}%` }} 
               />
             </View>
           </View>

           <View className="mb-4">
             <View className="flex-row justify-between mb-1">
               <Text className="font-bold text-slate-700">{t('report.facialExp')}</Text>
               <Text className="text-slate-400 text-xs font-bold">{data.video_features?.facial_expressivity === 'low' ? '30%' : '90%'}</Text>
             </View>
             <View className="h-3 bg-slate-100 rounded-full w-full overflow-hidden">
               <Animated.View 
                 entering={FadeInDown.delay(400).duration(1000)}
                 className="h-full bg-emerald-500 rounded-full" 
                 style={{ width: data.video_features?.facial_expressivity === 'low' ? '30%' : data.video_features?.facial_expressivity === 'high' ? '90%' : '70%' }} 
               />
             </View>
           </View>

           <View className="mb-2">
             <View className="flex-row justify-between mb-1">
               <Text className="font-bold text-slate-700">{t('report.auditory')}</Text>
               <Text className="text-slate-400 text-xs font-bold">{Math.round((data.audio_features?.prosody_variation || 0) * 100)}%</Text>
             </View>
             <View className="h-3 bg-slate-100 rounded-full w-full overflow-hidden">
               <Animated.View 
                 entering={FadeInDown.delay(600).duration(1000)}
                 className="h-full bg-amber-500 rounded-full" 
                 style={{ width: `${(data.audio_features?.prosody_variation || 0) * 100}%` }} 
               />
             </View>
           </View>
        </View>

        {/* Parecer do Gemma em Markdown */}
        <View className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
           <View className="flex-row items-center mb-4 border-b border-blue-100 pb-4">
             <BrainCircuit color="#3b82f6" size={24} />
             <Text className="text-blue-800 font-bold ml-2 text-lg">{t('report.aiReportTitle')}</Text>
           </View>
            <Markdown style={{ 
                body: { color: '#334155', fontSize: 17, lineHeight: 26 },
                heading2: { color: '#1e40af', fontSize: 20, marginBottom: 10, marginTop: 14 },
                strong: { color: '#1e3a8a' },
                list_item: { marginBottom: 8 }
              }}>
              {data.gemma_report || t('report.noReport')}
            </Markdown>
        </View>

        {/* DISCLAIMER LEGAL */}
        <View className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <Text className="text-amber-700 font-bold text-sm mb-2">{t('report.warningTitle')}</Text>
          <Text style={{ fontSize: 18, lineHeight: 26 }} className="text-slate-500">
            {t('report.warningText1')}
            <Text className="font-bold text-slate-600">{t('report.warningTextBold')}</Text> 
            {t('report.warningText2')}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
