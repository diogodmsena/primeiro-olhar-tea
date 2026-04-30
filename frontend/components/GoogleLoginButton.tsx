"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "../app/contexts/AuthContext";

interface GoogleLoginButtonProps {
  onBeforeLogin?: () => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  theme?: "outline" | "filled_blue" | "filled_black";
}

export function GoogleLoginButton({ 
  onBeforeLogin, 
  text = "signin_with", 
  shape = "rectangular",
  theme = "outline" 
}: GoogleLoginButtonProps) {
  const { isLoading, isGoogleReady } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const renderGoogleBtn = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      if (google?.accounts?.id && googleButtonRef.current && isGoogleReady) {
        if (onBeforeLogin) {
          onBeforeLogin();
        }
        
        google.accounts.id.renderButton(googleButtonRef.current, {
           theme,
           size: "large",
           shape,
           text
        });
        clearInterval(interval);
      }
    };

    if (isGoogleReady && !isLoading) {
      renderGoogleBtn();
      interval = setInterval(renderGoogleBtn, 500);
    }
    
    return () => clearInterval(interval);
  }, [isLoading, isGoogleReady, onBeforeLogin, theme, shape, text]);

  if (isLoading) return null;

  return (
    <div className="flex items-center justify-center overflow-hidden rounded-xl transition-shadow">
      <div ref={googleButtonRef}></div>
    </div>
  );
}
