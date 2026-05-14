import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultado da Triagem | Primeiro Olhar",
  description: "Relatório detalhado sobre os sinais de autismo identificados pela nossa IA.",
  openGraph: {
    title: "Resultado da Triagem | Primeiro Olhar",
    description: "Relatório detalhado sobre os sinais de autismo identificados pela nossa IA.",
    type: "article",
  },
};

export default function ResultadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
