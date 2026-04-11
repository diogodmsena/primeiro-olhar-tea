import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu, Globe } from './LucideIcons';
import { useI18n } from '../contexts/I18nContext';
import { Locale } from '../locales/dictionaries';

export function Header() {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    const next: Locale = locale === 'pt' ? 'en' : locale === 'en' ? 'es' : 'pt';
    setLocale({ locale: next });
  };

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      <View className="flex-row items-center">
        <Text className="text-xl font-bold text-amber-500 mr-1">Primeiro</Text>
        <Text className="text-xl font-bold text-blue-500">Olhar</Text>
      </View>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={toggleLanguage} className="p-2 bg-slate-50 rounded-full border border-slate-100">
          <Globe color="#64748b" size={20} />
        </TouchableOpacity>
        <TouchableOpacity className="p-2">
          <Menu color="#334155" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
