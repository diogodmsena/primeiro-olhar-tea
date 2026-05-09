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
  theme = "outline",
}: GoogleLoginButtonProps) {
  const { isLoading, isGoogleReady } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isGoogleReady || isLoading) return;

    let attempts = 0;
    const tryRender = () => {
      const google = window.google;
      if (google?.accounts?.id && googleButtonRef.current) {
        // Wrap the click to call onBeforeLogin before the popup
        if (onBeforeLogin) {
          const originalCallback = google.accounts.id.initialize;
          void originalCallback; // suppress unused warning
          // Override the container click to inject our callback
          googleButtonRef.current.addEventListener(
            "click",
            () => { onBeforeLogin(); },
            { once: true, capture: true }
          );
        }
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme,
          size: "large",
          shape,
          text,
        });
        return;
      }
      attempts++;
      if (attempts < 20) {
        setTimeout(tryRender, 300);
      }
    };

    tryRender();
  }, [isLoading, isGoogleReady, onBeforeLogin, theme, shape, text]);

  if (isLoading) return null;

  return (
    <div className="flex items-center justify-center overflow-hidden rounded-xl transition-shadow">
      <div ref={googleButtonRef} />
    </div>
  );
}
