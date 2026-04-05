"use client";

import { Search, ArrowLeft, MoreVertical, LayoutGrid, Users, FileText, Settings, HeartPulse, Activity } from "lucide-react";
import Link from "next/link";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useState } from "react";

// Mock data
const MOCK_PATIENTS = [
  { id: "1", name: "Lucas Pereira", age: "4 anos", riskScore: 0.82, riskLevel: "ALTO", date: "2024-04-01", status: "Avaliando" },
  { id: "2", name: "Sofia Gomes", age: "3 anos", riskScore: 0.25, riskLevel: "BAIXO", date: "2024-04-03", status: "Concluído" },
  { id: "3", name: "Mateus Silva", age: "5 anos", riskScore: 0.68, riskLevel: "ALTO", date: "2024-04-04", status: "Avaliando" },
  { id: "4", name: "Ana Júlia", age: "2 anos", riskScore: 0.45, riskLevel: "MÉDIO", date: "2024-04-04", status: "Laudado" },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");

  const getRiskColor = (level: string) => {
    switch (level) {
      case "ALTO": return "bg-rose-100 text-rose-700 border-rose-200";
      case "MÉDIO": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getAvatarColor = (name: string) => {
    const char = name.charCodeAt(0);
    const colors = ["bg-blue-500", "bg-amber-400", "bg-rose-500", "bg-emerald-500"];
    return colors[char % colors.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      {/* Sidebar B2B */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm rounded-tl-lg"></div>
              <div className="w-3 h-3 bg-amber-400 rounded-sm rounded-tr-lg"></div>
              <div className="w-3 h-3 bg-rose-500 rounded-sm rounded-bl-lg"></div>
              <div className="w-3 h-3 bg-emerald-500 rounded-sm rounded-br-lg"></div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800">
              Primeiro<span className="text-blue-500">Olhar</span>
            </span>
          </div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-2 block">Clínica Mode</span>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-sky-50 text-sky-700 rounded-xl font-bold">
            <LayoutGrid className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-semibold transition-colors">
            <Users className="w-5 h-5" /> Pacientes
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-semibold transition-colors">
            <FileText className="w-5 h-5" /> Relatórios
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl font-semibold transition-colors">
            <Settings className="w-5 h-5" /> Ajustes
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-blue-600 rounded-xl font-semibold transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Sair do Painel
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Visão Geral</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Acompanhe as avaliações da sua clínica.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar paciente..." 
                className="pl-10 pr-4 py-2 border-2 border-slate-100 rounded-full bg-slate-50 focus:bg-white focus:border-blue-300 focus:outline-none transition-all w-64 text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <LanguageSelector />
          </div>
        </header>

        <div className="p-8 overflow-y-auto flex-1">
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Avaliados</p>
                <h3 className="text-4xl font-black text-slate-800">124</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
              <div>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Risco Alto Detectado</p>
                 <h3 className="text-4xl font-black text-rose-600">18</h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
              <div>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Análises Pendentes</p>
                 <h3 className="text-4xl font-black text-amber-500">3</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Listagem */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Triagens Recentes</h2>
              <button className="text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors">Ver todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Idade</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Score IA</th>
                    <th className="px-6 py-4">Nível Risco</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_PATIENTS.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(patient.name)}`}>
                            {patient.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{patient.name}</p>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">ID: #0A8{patient.id}XF</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{patient.age}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm font-medium">{patient.date}</td>
                      <td className="px-6 py-4 text-slate-800 font-bold">{patient.riskScore.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(patient.riskLevel)}`}>
                          {patient.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:bg-white hover:text-blue-500 hover:shadow-sm rounded-full transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
