import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Histórico | Primeiro Olhar",
  description: "Acesse e gerencie suas triagens anteriores de forma segura.",
  openGraph: {
    title: "Meu Histórico | Primeiro Olhar",
    description: "Acesse e gerencie suas triagens anteriores de forma segura.",
    type: "website",
  },
};

export default function HistoricoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
