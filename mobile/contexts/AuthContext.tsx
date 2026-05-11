import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
const AUTH_STORAGE_KEY = '@auth_user';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  /** Session token issued by our backend (JWT) — used for all /api calls */
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

/** Exchange a Google ID token for a backend session token */
async function exchangeGoogleToken(idToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ token: idToken }),
  });
  if (!res.ok) {
    console.warn('[AuthContext] Backend token exchange failed:', res.status);
    return idToken; // Fallback: use Google ID token directly
  }
  const data = await res.json();
  return data.session_token || idToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from AsyncStorage on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('[AuthContext] Failed to restore session:', e);
      }
    };

    if (isExpoGo) {
      console.log("Running in Expo Go: Google Sign-in functionality is mocked.");
      restoreSession().finally(() => setIsLoading(false));
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
          // First try to restore from storage
          await restoreSession();

          try {
            const hasPlay = await GoogleSignin.hasPlayServices();
            if (hasPlay) {
              const userInfo = await GoogleSignin.signInSilently();
              if (userInfo?.data?.user) {
                const u = userInfo.data.user;
                const idToken = userInfo.data.idToken || '';
                // Exchange for backend session token
                const sessionToken = await exchangeGoogleToken(idToken);
                const googleUser: GoogleUser = {
                  email: u.email,
                  name: u.name || 'Usuário',
                  picture: u.photo || '',
                  token: sessionToken,
                  googleId: u.id,
                };
                setUser(googleUser);
                await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
              }
            }
          } catch (_err) {
            // Not signed in — silent fail, will use restored session if any
          } finally {
            setIsLoading(false);
          }
        };
        checkUser();
      } catch (e: any) {
        console.warn('[AuthContext] GoogleSignin.configure failed:', e);
        restoreSession().finally(() => setIsLoading(false));
      }
    } else {
      restoreSession().finally(() => setIsLoading(false));
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
            onPress: async () => {
              const mockUser: GoogleUser = {
                email: 'teste@exemplo.com',
                name: 'Usuário Teste (Expo Go)',
                picture: 'https://ui-avatars.com/api/?name=Teste',
                token: 'mock-token',
                googleId: '123',
              };
              setUser(mockUser);
              await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
            },
          },
        ]
      );
      return;
    }

    try {
      if (!GoogleSignin) throw new Error("Google Sign-in not initialized");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo?.data?.user) {
        const u = userInfo.data.user;
        const idToken = userInfo.data.idToken || '';
        // Exchange for backend session token so our /auth/reports calls work
        const sessionToken = await exchangeGoogleToken(idToken);
        const googleUser: GoogleUser = {
          email: u.email,
          name: u.name || 'Usuário',
          picture: u.photo || '',
          token: sessionToken,
          googleId: u.id,
        };
        setUser(googleUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
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
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
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
