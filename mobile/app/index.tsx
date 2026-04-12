import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { useI18n } from '../contexts/I18nContext';

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  
  // React Native Animated Puzzle Mock
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [{ rotateZ: spin }, { scale: scale }],
  };

  return (
    <View className="flex-1 bg-white">
      <Header />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <View className="items-start mt-4 mb-8">
          <View className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
            <Text className="text-blue-700 font-medium text-xs">{t('hero.badge')}</Text>
          </View>
          
          <Text className="text-4xl font-extrabold text-slate-800 leading-tight">
            {t('hero.titleStart')}
          </Text>
          <Text className="text-4xl font-extrabold text-emerald-500 mb-4 leading-tight">
            {t('hero.titleHighlight')}
          </Text>
          
          <Text className="text-base text-slate-500 leading-relaxed max-w-sm">
            {t('hero.subtitle')}
          </Text>
        </View>

        {/* Puzzle Animation View */}
        <View className="items-center justify-center my-6">
          <Animated.View 
            style={[animatedStyle]} 
            className="w-64 h-64 bg-slate-50 rounded-full flex items-center justify-center border-4 border-slate-100 shadow-xl shadow-slate-200"
          >
            {/* Visual representation of puzzle pieces */}
            <View className="w-20 h-20 bg-amber-400 absolute top-8 left-12 rounded-2xl opacity-80" />
            <View className="w-20 h-20 bg-rose-500 absolute top-8 right-12 rounded-2xl opacity-80" />
            <View className="w-20 h-20 bg-blue-500 absolute bottom-12 left-16 rounded-2xl opacity-80" />
            <View className="w-20 h-20 bg-emerald-500 absolute bottom-12 right-16 rounded-2xl opacity-80" />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 border-t border-slate-50 gap-3">
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
              <Text className="text-slate-600 font-bold text-base">Meu Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/como-funciona')}
              className="flex-1 bg-slate-100 rounded-full py-3 items-center flex-row justify-center border border-slate-200"
            >
              <Text className="text-slate-600 font-bold text-base">Como Funciona</Text>
            </TouchableOpacity>
          </View>
      </View>
    </View>
  );
}
