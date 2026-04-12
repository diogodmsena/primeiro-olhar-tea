import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

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
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // MUST BE REPLACED WITH ACTUAL CLIENT ID
      offlineAccess: true,
    });
    
    // Check if user is already signed in
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
  }, []);

  const signIn = async () => {
    try {
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
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Operation is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.log('Some other error happened', error);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
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
