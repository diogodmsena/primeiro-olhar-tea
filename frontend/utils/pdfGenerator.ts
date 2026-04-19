import html2pdf from 'html2pdf.js';

interface TriagemData {
  child_name?: string;
  risk_score?: {
    level?: string;
    score?: number;
  };
  video_features?: {
    eye_contact_ratio?: number;
    facial_expressivity?: string;
  };
  audio_features?: {
    prosody_variation?: number;
  };
  gemma_report?: string;
}

function parseSimpleMarkdown(text: string | undefined): string {
  if (!text) return '';
  // Basic markdown to HTML conversion for the PDF 
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

export const generateAndDownloadPDF = async (data: TriagemData, jobId: string | string[] | undefined): Promise<void> => {
  if (!data) return;
  
  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()} ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
  
  const rawLevel = data.risk_score?.level || 'Indefinido';
  const riskScoreLevel = rawLevel === "Risco Baixo" ? "Indicadores Leves" : 
                        rawLevel === "Risco Moderado" ? "Indicadores Moderados" : 
                        rawLevel === "Risco Alto" ? "Indicadores Fortes" : 
                        rawLevel;
  const riskScoreValue = Math.round((data.risk_score?.score || 0) * 100);
  
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; color: #334155; }
        </style>
      </head>
      <body>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items: center;">
            <img src="/logo_v4.png" style="width: 32px; height: 32px; margin-right: 8px;" />
            <span style="font-size: 24px; font-weight: 900; color: #f59e0b; margin-right: 4px;">Primeiro</span>
            <span style="font-size: 24px; font-weight: 900; color: #3b82f6;">Olhar</span>
          </div>
          <span style="font-size: 13px; color: #64748b; font-weight: 500;">${formattedDate}</span>
        </div>
        
        <h1 style="color: #1e40af; text-align: center; margin-bottom: 20px; font-size: 28px; font-weight: bold;">Avaliação Preliminar</h1>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
        
        <h2 style="margin-top: 0;">Criança: ${data.child_name || 'Não especificado'}</h2>
        <h3>Nível de Indicadores: <span style="color: #ef4444;">${riskScoreLevel} (${riskScoreValue}%)</span></h3>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
          <h4 style="margin-top: 0; margin-bottom: 15px; color: #475569;">Dimensões Analisadas</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Contato Visual:</strong> ${Math.round((data.video_features?.eye_contact_ratio || 0) * 100)}/100</li>
            <li style="margin-bottom: 8px;"><strong>Expressividade:</strong> ${data.video_features?.facial_expressivity === 'low' ? '30' : data.video_features?.facial_expressivity === 'high' ? '90' : '70'}/100</li>
            <li><strong>Prosódia / Auditivo:</strong> ${Math.round((data.audio_features?.prosody_variation || 0) * 100)}/100</li>
          </ul>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 5px 0;">Contato visual: Mede a atenção direcionada no olhar durante as interações.</p>
            <p style="margin: 0 0 5px 0;">Expressividade: Analisa reações afetivas ligadas à interações sociais no vídeo.</p>
            <p style="margin: 0;">Prosódia: Avalia a entonação na reposta auditiva e chamados vocais.</p>
          </div>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; margin-top: 20px; border-radius: 8px; line-height: 1.6; text-align: justify; font-size: 14px;">
          ${parseSimpleMarkdown(data.gemma_report)}
        </div>

        <div style="margin-top: 40px; font-size: 12px; color: #64748b; padding-top: 15px; background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; text-align: justify;">
          <strong style="color: #b45309; display: block; margin-bottom: 8px; font-size: 14px;">⚠ Aviso Importante</strong>
          Este relatório é gerado por um sistema de inteligência artificial com finalidade exclusivamente orientativa e educacional. Os resultados apresentados <strong>não constituem diagnóstico clínico</strong> e não substituem, em nenhuma hipótese, a avaliação presencial realizada por profissionais de saúde qualificados.
        </div>
      </body>
    </html>
  `;

  const opt = {
    margin:       10,
    filename:     `Triagem_Autismo_${jobId}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  
  await html2pdf().from(container).set(opt).save();
};
