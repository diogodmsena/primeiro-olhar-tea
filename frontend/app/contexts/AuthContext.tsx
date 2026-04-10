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
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
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
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    // Wait for script to load
    if (document.querySelector('script[src*="accounts.google.com"]')) {
      const check = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).google?.accounts?.id) {
          clearInterval(check);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(check);
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    const handleOpenLogin = () => signIn();
    window.addEventListener('openGoogleLogin', handleOpenLogin);
    return () => window.removeEventListener('openGoogleLogin', handleOpenLogin);
  }, [signIn]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
