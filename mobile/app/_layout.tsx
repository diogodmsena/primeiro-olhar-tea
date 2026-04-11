import { Stack } from 'expo-router';
import '../global.css';
import { I18nProvider } from '../contexts/I18nContext';
import { AuthProvider } from '../contexts/AuthContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <I18nProvider>
          <SafeAreaView className="flex-1 bg-white">
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
            </Stack>
          </SafeAreaView>
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
