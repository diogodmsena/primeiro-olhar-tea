import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, History, ChevronDown } from './LucideIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export function UserMenu() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (isLoading) return <View className="w-10 h-10" />;

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (e) {
      console.log('Error signing in', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (e) {
      console.log('Error signing out', e);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <TouchableOpacity 
        onPress={handleSignIn}
        className="bg-emerald-500 px-4 py-1.5 rounded-full"
      >
        <Text className="font-bold text-white">Entrar</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="flex-row items-center bg-white border-2 border-slate-200 pl-1.5 pr-2 py-1.5 rounded-full"
      >
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={{ width: 28, height: 28, borderRadius: 14 }} />
        ) : (
          <View className="w-7 h-7 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white text-xs font-bold">{user.name.charAt(0)}</Text>
          </View>
        )}
        <Text className="text-slate-700 ml-1 font-bold text-sm max-w-[80px]" numberOfLines={1}>
          {user.name.split(' ')[0]}
        </Text>
        <ChevronDown color="#94a3b8" size={14} style={{ marginLeft: 2, transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>

      <Modal visible={open} transparent={true} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity 
          className="flex-1 bg-black/10 justify-start items-end pt-16 pr-4"
          activeOpacity={1} 
          onPressOut={() => setOpen(false)}
        >
          <View className="bg-white rounded-2xl shadow-lg border border-slate-100 py-2 w-56">
            <View className="px-4 py-3 border-b border-slate-100">
              <Text className="font-bold text-sm text-slate-800" numberOfLines={1}>{user.name}</Text>
              <Text className="text-xs text-slate-500" numberOfLines={1}>{user.email}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setOpen(false);
                router.push('/historico');
              }}
              className="flex-row items-center px-4 py-3"
            >
              <History color="#3b82f6" size={16} />
              <Text className="text-sm text-slate-700 font-medium ml-3">Meus Relatórios</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSignOut}
              className="flex-row items-center px-4 py-3"
            >
              <LogOut color="#ef4444" size={16} />
              <Text className="text-sm text-red-600 font-medium ml-3">Sair</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
