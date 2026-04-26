import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useI18n } from '../contexts/I18nContext';
import { Header } from '../components/Header';
import { Video, FileText, Sparkles, AlertCircle, ArrowLeft, ArrowRight } from '../components/LucideIcons';

export default function ComoFuncionaScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const steps = [
    {
      icon: <Video color="#2563eb" size={24} />,
      color: "bg-blue-100",
      number: "01",
      title: t('how.step1Title') || "Grave um Vídeo",
      description: t('how.step1Desc') || "Faça um vídeo curto (1-3 min) da criança brincando ou interagindo em um ambiente natural.",
      tip: t('how.step1Tip') || "Chame a criança pelo nome durante a gravação para testarmos o contato."
    },
    {
      icon: <FileText color="#d97706" size={24} />,
      color: "bg-amber-100",
      number: "02",
      title: t('how.step2Title') || "Responda a Perguntas",
      description: t('how.step2Desc') || "Preencha um questionário rápido baseado em observações cotidianas.",
      tip: t('how.step2Tip') || "Seja honesto e descreva o comportamento mais frequente, não as exceções."
    },
    {
      icon: <Sparkles color="#059669" size={24} />,
      color: "bg-emerald-100",
      number: "03",
      title: t('how.step3Title') || "Análise com IA",
      description: t('how.step3Desc') || "Nossos modelos analisam padrões visuais, prosódia e comportamento.",
      tip: t('how.step3Tip') || "A análise dura menos de 2 minutos para processar de forma segura."
    },
    {
      icon: <AlertCircle color="#e11d48" size={24} />,
      color: "bg-rose-100",
      number: "04",
      title: t('how.step4Title') || "Receba o Relatório",
      description: t('how.step4Desc') || "Obtenha um laudo indicativo de risco para facilitar a consulta com neuropediatra.",
      tip: t('how.step4Tip') || "Este relatório pode ser compartilhado diretamente com o médico especialista via link ou PDF."
    }
  ];

  const faqs = [
    {
      q: t('how.faq1Q') || "O aplicativo faz o diagnóstico?",
      a: t('how.faq1A') || "Não. O Primeiro Olhar realiza uma triagem preditiva. O diagnóstico final deve ser sempre realizado por um médico especialista (Neuropediatra ou Psiquiatra Infantil)."
    },
    {
      q: t('how.faq2Q') || "Meus dados estão seguros?",
      a: t('how.faq2A') || "Sim. Todos os vídeos enviados são processados por nossa IA em ambiente seguro, sem salvar os arquivos."
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <Header />
      
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <TouchableOpacity onPress={() => router.push('/')} className="flex-row items-center mb-6">
          <ArrowLeft color="#64748b" size={20} />
          <Text className="text-slate-500 font-bold ml-2 text-base">{t('how.back') || "Início"}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View className="items-center py-6 mb-4">
          <View className="bg-blue-100 px-4 py-1.5 rounded-full mb-4">
            <Text className="text-blue-600 font-bold text-sm">{t('how.badge') || "GUIA PASSO A PASSO"}</Text>
          </View>
          <Text className="text-3xl font-black text-slate-800 text-center mb-3">
            {t('how.titleStart') || "Como o "}<Text className="text-blue-500">{t('how.titleHighlight') || "PrimeiroOlhar"}</Text>{t('how.titleEnd') || " funciona?"}
          </Text>
          <Text className="text-lg text-slate-500 font-medium text-center">
            {t('how.subtitle') || "Entenda as etapas da triagem multimodal autista."}
          </Text>
        </View>

        {/* Steps */}
        <View className="gap-6">
          {steps.map((step, i) => (
            <View key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm shadow-slate-100">
              <View className="flex-row">
                <View className={`${step.color} w-12 h-12 rounded-2xl items-center justify-center mr-4`}>
                  {step.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-slate-400 tracking-widest mb-1">PASSO {step.number}</Text>
                  <Text className="text-xl font-bold text-slate-800 mb-2">{step.title}</Text>
                  <Text className="text-slate-500 font-medium text-base leading-6 mb-4">{step.description}</Text>
                  
                  <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 flex-row">
                    <Text className="text-sm font-bold text-blue-500 mr-2">💡</Text>
                    <Text className="text-sm text-slate-500 font-medium flex-1">{step.tip}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View className="mt-10 mb-8">
          <Text className="text-2xl font-bold text-slate-800 text-center mb-6">{t('how.faqTitle') || "Dúvidas Frequentes"}</Text>
          <View className="gap-4">
            {faqs.map((faq, i) => (
              <View key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm shadow-slate-100">
                <Text className="font-bold text-slate-700 text-lg mb-2">{faq.q}</Text>
                <Text className="text-slate-500 font-medium text-base leading-6">{faq.a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View className="bg-blue-50 rounded-3xl p-8 border border-blue-100 items-center">
          <Text className="text-xl font-bold text-slate-800 mb-2 text-center">{t('how.ctaTitle') || "Pronto para iniciar?"}</Text>
          <Text className="text-slate-500 font-medium text-center text-base mb-6">{t('how.ctaDesc') || "A triagem leva menos de 5 minutos."}</Text>
          <TouchableOpacity
            onPress={() => router.push('/triagem')}
            className="bg-blue-500 px-8 py-3.5 rounded-full flex-row items-center shadow-lg shadow-blue-500/30"
          >
            <Text className="text-white font-bold mr-2 text-lg">{t('how.ctaButton') || "Começar Triagem"}</Text>
            <ArrowRight color="#ffffff" size={18} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
