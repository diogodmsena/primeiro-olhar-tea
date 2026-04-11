import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  isGoogleReady: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isGoogleReady: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);

  const signIn = () => {
    // Simulated SignIn for Mobile MVP phase
    setUser({
      email: "familia@teste.com",
      name: "Usuário Mobile",
      picture: "https://via.placeholder.com/150",
      token: "mock-token",
      googleId: "123"
    });
  };

  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: false, isGoogleReady: true, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
