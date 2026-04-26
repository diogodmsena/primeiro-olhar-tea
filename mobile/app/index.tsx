import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';
import { AutismPuzzleSymbol } from '../components/AutismPuzzleSymbol';

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="items-start mt-4 mb-8">
          <View className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
            <Text className="text-blue-700 font-medium text-base">{t('hero.badge')}</Text>
          </View>
          
          <Text className="text-4xl font-extrabold text-slate-800 leading-tight">
            {t('hero.titleStart')}
          </Text>
          <Text className="text-4xl font-extrabold text-blue-500 mb-4 leading-tight">
            {t('hero.titleHighlight')}
          </Text>
          
          <Text className="text-lg text-slate-600 leading-relaxed max-w-sm font-medium">
            {t('hero.subtitle')}
          </Text>
        </View>

        {/* Autism Animation View - Mesma da WEB */}
        <View className="items-center justify-center my-6 scale-90">
          <AutismPuzzleSymbol />
        </View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View className="absolute bottom-10 left-0 right-0 p-6 bg-white/90 border-t border-slate-50 gap-3">
          <TouchableOpacity 
            onPress={() => router.push('/triagem')}
            className="w-full bg-blue-500 rounded-full py-4 items-center flex-row justify-center shadow-lg shadow-blue-500/30"
          >
            <Text className="text-white font-bold text-lg">{t('hero.cta')}</Text>
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => router.push('/historico')}
              className="flex-1 bg-slate-100 rounded-full py-3 items-center flex-row justify-center border border-slate-200"
            >
              <Text className="text-slate-600 font-bold text-base">{t('nav.myHistory')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/ajuda')}
              className="flex-1 bg-slate-100 rounded-full py-3 items-center flex-row justify-center border border-slate-200"
            >
              <Text className="text-slate-600 font-bold text-base">{t('nav.howItWorks')}</Text>
            </TouchableOpacity>
          </View>
      </View>
    </SafeAreaView>
  );
}
