"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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
  isLoading: true,
  isGoogleReady: false,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Primary: env var (baked at compile time)
// Fallback: meta tag injected by layout.tsx (readable at runtime)
const getGoogleClientId = (): string => {
  const fromEnv = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  if (fromEnv) return fromEnv;
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="google-client-id"]');
    return (meta?.getAttribute("content") || "").trim();
  }
  return "";
};

function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    const idToken = response.credential;
    const payload = decodeJwtPayload(idToken);
    if (!payload) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });
      const data = await res.json();
      
      const googleUser: GoogleUser = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        token: data.session_token || idToken,
        googleId: payload.sub,
      };

      setUser(googleUser);
      localStorage.setItem("auth_user", JSON.stringify(googleUser));

      // Check for pending report to save
      const pendingJobId = localStorage.getItem("pendingReportJobId");
      const pendingData = localStorage.getItem("pendingReportData");
      if (pendingJobId && pendingData) {
        try {
          await fetch(`${apiUrl}/api/reports`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session_token || idToken}`,
            },
            body: JSON.stringify({
              job_id: pendingJobId,
              report_data: JSON.parse(pendingData),
            }),
          });
        } catch (e) {
          console.error("Failed to save pending report:", e);
        }
        localStorage.removeItem("pendingReportJobId");
        localStorage.removeItem("pendingReportData");
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Fallback: use decoded JWT directly
      const googleUser: GoogleUser = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        token: idToken,
        googleId: payload.sub,
      };
      setUser(googleUser);
      localStorage.setItem("auth_user", JSON.stringify(googleUser));
    }
  }, []);

  const signIn = useCallback(() => {
    const google = window.google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
    const google = window.google;
    if (google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
  }, []);

  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Read client_id at runtime (env var or meta tag fallback)
    const clientId = getGoogleClientId();
    if (!clientId) {
      console.error('[AuthContext] Google client_id not found. Check NEXT_PUBLIC_GOOGLE_CLIENT_ID env var.');
      return;
    }

    let isInitialized = false;

    const initGoogle = () => {
      const google = window.google;
      if (google?.accounts?.id && !isInitialized) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isInitialized = true;
          setIsGoogleReady(true);
        } catch (err) {
          console.error('[AuthContext] google.accounts.id.initialize() failed:', err);
        }
      }
    };

    const check = setInterval(() => {
      const google = window.google;
      if (google?.accounts?.id && !isInitialized) {
        clearInterval(check);
        initGoogle();
      }
    }, 100);

    const safetyTimeout = setTimeout(() => clearInterval(check), 15000);

    return () => {
      clearInterval(check);
      clearTimeout(safetyTimeout);
    };
  }, [handleCredentialResponse]);

  useEffect(() => {
    const handleOpenLogin = () => signIn();
    window.addEventListener('openGoogleLogin', handleOpenLogin);
    return () => window.removeEventListener('openGoogleLogin', handleOpenLogin);
  }, [signIn]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isGoogleReady, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
