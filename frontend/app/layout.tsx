import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

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
      <body className={`${nunito.variable} font-sans antialiased bg-soft-bg text-slate-800`}>
        {children}
      </body>
    </html>
  );
}
