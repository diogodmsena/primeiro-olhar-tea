import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { I18nProvider } from "./contexts/I18nContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AccessibilityWidget } from "../components/AccessibilityWidget";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Primeiro Olhar | Triagem Precoce do Autismo",
  description: "Plataforma amigável e acessível para triagem precoce de sinais de autismo utilizando Inteligência Artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
      <meta name="google-client-id" content={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "59789656454-lpr0b9vr7o1j8bteicvdlaohpblbf0ks.apps.googleusercontent.com"} />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "59789656454-lpr0b9vr7o1j8bteicvdlaohpblbf0ks.apps.googleusercontent.com"}
        />
      </head>
      <body className={`${nunito.variable} font-sans antialiased bg-soft-bg text-slate-800`}>
        <I18nProvider>
          <AccessibilityProvider>
            <AuthProvider>
              {children}
              <AccessibilityWidget />
            </AuthProvider>
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
