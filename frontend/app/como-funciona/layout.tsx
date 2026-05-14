import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Como Funciona | Primeiro Olhar",
  description: "Entenda como nossa Inteligência Artificial analisa sinais de autismo de forma ética e precisa.",
  openGraph: {
    title: "Como Funciona | Primeiro Olhar",
    description: "Entenda como nossa Inteligência Artificial analisa sinais de autismo de forma ética e precisa.",
    type: "website",
  },
};

export default function ComoFuncionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
