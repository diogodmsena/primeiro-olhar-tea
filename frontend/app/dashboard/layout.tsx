import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Primeiro Olhar",
  description: "Painel de controle para monitoramento e gestão de triagens.",
  openGraph: {
    title: "Dashboard | Primeiro Olhar",
    description: "Painel de controle para monitoramento e gestão de triagens.",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
