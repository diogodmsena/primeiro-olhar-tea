import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Importação dinâmica para evitar que o Babel tente resolver o módulo nativo se não for necessário
// No entanto, em React Native, imports de topo são mais comuns.
// Vamos tentar importar e capturar erro ou apenas ignorar se isExpoGo.
let GoogleSignin: any = null;
let statusCodes: any = null;

if (!isExpoGo) {
  try {
    const GoogleAuth = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleAuth.GoogleSignin;
    statusCodes = GoogleAuth.statusCodes;
  } catch (e) {
    console.warn("Google Sign-in module not found even in native build.");
  }
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  token: string;
  googleId: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isExpoGo) {
      console.log("Running in Expo Go: Google Sign-in functionality is mocked.");
      setIsLoading(false);
      return;
    }

    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
          androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
          offlineAccess: true,
        });

        const checkUser = async () => {
          try {
            const hasSignIn = await GoogleSignin.hasPlayServices();
            if (hasSignIn) {
              const userInfo = await GoogleSignin.signInSilently();
              if (userInfo && userInfo.data?.user) {
                 const u = userInfo.data.user;
                 setUser({
                   email: u.email,
                   name: u.name || 'Usuário',
                   picture: u.photo || '',
                   token: userInfo.data.idToken || '',
                   googleId: u.id
                 });
              }
            }
          } catch (error) {
             // Silently fail if not signed in
          } finally {
            setIsLoading(false);
          }
        };
        checkUser();
      } catch (e: any) {
        console.warn('[AuthContext] GoogleSignin.configure failed:', e);
        Alert.alert('Erro no Google Login', 'Google Sign-in não conseguiu inicializar. O app está sem o arquivo google-services e SHA-1 corretos na build nativa.');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = async () => {
    if (isExpoGo) {
      Alert.alert(
        "Ambiente Expo Go",
        "O Login com Google real exige um 'Development Build'. Deseja usar o login de teste?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Login de Teste", 
            onPress: () => {
              setUser({
                email: 'teste@exemplo.com',
                name: 'Usuário Teste (Expo Go)',
                picture: 'https://ui-avatars.com/api/?name=Teste',
                token: 'mock-token',
                googleId: '123'
              });
            }
          }
        ]
      );
      return;
    }

    try {
      if (!GoogleSignin) throw new Error("Google Sign-in not initialized");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo && userInfo.data?.user) {
         const u = userInfo.data.user;
         setUser({
           email: u.email,
           name: u.name || 'Usuário',
           picture: u.photo || '',
           token: userInfo.data.idToken || '',
           googleId: u.id
         });
      }
    } catch (error: any) {
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else {
        console.log('Sign in error', error);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!isExpoGo && GoogleSignin) {
        await GoogleSignin.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
