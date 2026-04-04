"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, FileVideo, Activity, BrainCircuit } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [concerns, setConcerns] = useState("");
  const [communication, setCommunication] = useState("");
  const [responds, setResponds] = useState("yes");

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (acceptedFiles.length > 0) {
      setVideoFile(acceptedFiles[0]);
    } else if (fileRejections.length > 0) {
      alert("Formato de vídeo não aceito. Tente enviar um arquivo .mp4 ou .mov comum.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    maxFiles: 1 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return alert("Por favor, selecione um vídeo de 10-15s.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", videoFile);
      
      const parentAnswers = {
        concerns,
        communication_delays: communication,
        responds_to_name: responds
      };
      
      formData.append("parent_answers", JSON.stringify(parentAnswers));
      
      // Default to localhost for local hackathon env if ENV not set
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const response = await axios.post(`${apiUrl}/api/triagem`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if(response.data.job_id) {
        // Redirect to resultado parsing page
        router.push(`/resultado/${response.data.job_id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar análise. Verifique se o backend está online.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 text-slate-800 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex items-center space-x-3 mb-10 border-b pb-6">
          <BrainCircuit className="w-10 h-10 text-sky-600" />
          <div>
            <h1 className="text-3xl font-light tracking-tight">Gemma-4-Good</h1>
            <p className="text-sky-700 text-sm font-medium">Plataforma Multimodal de Triagem Precoce</p>
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-slate-700 p-8">
          <h2 className="text-xl font-medium mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-sky-600" />
            Nova Triagem
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Media Column */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">1. Vídeo da Criança</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragActive ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  {videoFile ? (
                    <div className="text-center">
                      <FileVideo className="w-12 h-12 mx-auto text-sky-600 mb-3" />
                      <p className="text-sm font-medium">{videoFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 space-y-2">
                      <UploadCloud className="w-12 h-12 mx-auto text-slate-300" />
                      <p className="text-sm font-medium">Arraste um vídeo de 10-15s aqui</p>
                      <p className="text-xs">Requerido: .mp4, .mov (Criança de frente)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Column */}
              <div className="space-y-4">
                 <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider">2. Observações Parentais</label>
                 
                 <div className="space-y-3 mt-4">
                   <div>
                     <label className="text-sm block mb-1">Quais comportamentos preocuparam?</label>
                     <input 
                       required value={concerns} onChange={(e)=>setConcerns(e.target.value)}
                       placeholder="Ex: Não mantém contato visual..."
                       className="w-full border-slate-200 rounded-lg shadow-sm focus:border-sky-500 focus:ring-sky-500 bg-slate-50 text-sm px-4 py-2" />
                   </div>
                   
                   <div>
                     <label className="text-sm block mb-1">Há atrasos na comunicação?</label>
                     <input 
                       required value={communication} onChange={(e)=>setCommunication(e.target.value)}
                       placeholder="Ex: Ainda não fala palavras inteiras"
                       className="w-full border-slate-200 rounded-lg shadow-sm focus:border-sky-500 focus:ring-sky-500 bg-slate-50 text-sm px-4 py-2" />
                   </div>

                   <div>
                     <label className="text-sm block mb-1">A criança responde quando chamada pelo nome?</label>
                     <select 
                       value={responds} onChange={(e) => setResponds(e.target.value)}
                       className="w-full border-slate-200 rounded-lg shadow-sm focus:border-sky-500 focus:ring-sky-500 bg-slate-50 text-sm px-4 py-2">
                       <option value="always">Sempre</option>
                       <option value="sometimes">Às vezes</option>
                       <option value="never">Raramente / Nunca</option>
                     </select>
                   </div>
                 </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading || !videoFile}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-md shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando Multimodal...
                  </>
                ) : "Iniciar Triagem IA"}
              </button>
            </div>
          </form>
        </section>
        
        <footer className="text-center text-xs text-slate-400">
             Sistema de MVP Hackathon. Não substitui um diagnóstico clínico oficial.
        </footer>
      </div>
    </main>
  );
}
