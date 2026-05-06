import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';
import { I18nProvider } from '../contexts/I18nContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '../contexts/ToastContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <AuthProvider>
        <I18nProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="triagem" />
              <Stack.Screen name="resultado" />
              <Stack.Screen name="historico" />
              <Stack.Screen name="ajuda" />
            </Stack>
          </ToastProvider>
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
