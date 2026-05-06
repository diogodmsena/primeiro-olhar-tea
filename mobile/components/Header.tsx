import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useI18n } from '../contexts/I18nContext';
import { Locale } from '../locales/dictionaries';
import { UserMenu } from './UserMenu';

export function Header() {
  const { locale, setLocale } = useI18n();

  const toggleLanguage = () => {
    const next: Locale = locale === 'pt' ? 'en' : locale === 'en' ? 'es' : 'pt';
    setLocale({ locale: next });
  };

  const getFlag = (currentLocale: string) => {
    switch (currentLocale) {
      case 'pt': return '🇧🇷';
      case 'en': return '🇺🇸';
      case 'es': return '🇪🇸';
      default: return '📍';
    }
  };

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-blue-200 border-b border-slate-100">
      <View className="flex-row items-center">
        <Image 
          source={require('../assets/images/logo_v4.png')} 
          style={{ width: 60, height:60, marginRight: 8 }}
          resizeMode="contain"
        />
        <View>
          <Text className="text-2xl font-black text-amber-500 -mb-2">Primeiro</Text>
          <Text className="text-2xl font-black text-blue-500">Olhar</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={toggleLanguage} className="p-2 bg-blue-100 rounded-full border border-slate-100 items-center justify-center min-w-[40px]">
          <Text className="text-xl">{getFlag(locale)}</Text>
        </TouchableOpacity>
        <UserMenu />
      </View>
    </View>
  );
}
