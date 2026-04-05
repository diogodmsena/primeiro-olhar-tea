"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type A11ySettings = {
  highContrast: boolean;
  reduceMotion: boolean;
  largeFont: boolean;
};

type AccessibilityContextType = {
  settings: A11ySettings;
  toggleSetting: (key: keyof A11ySettings) => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>({
    highContrast: false,
    reduceMotion: false,
    largeFont: false,
  });

  useEffect(() => {
    // Load from memory
    const saved = localStorage.getItem("a11y_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Apply classes to HTML
    const html = document.documentElement;
    if (settings.highContrast) html.classList.add("high-contrast");
    else html.classList.remove("high-contrast");
    
    if (settings.reduceMotion) html.classList.add("reduce-motion");
    else html.classList.remove("reduce-motion");

    if (settings.largeFont) html.classList.add("large-font");
    else html.classList.remove("large-font");

    localStorage.setItem("a11y_settings", JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key: keyof A11ySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, toggleSetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useA11y must be used within an AccessibilityProvider");
  }
  return context;
}
