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

export const generateAndDownloadPDF = async (data: TriagemData, jobId: string | string[] | undefined, t: (key: string) => string): Promise<void> => {
  if (!data) return;
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString() + ' ' + today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const rawLevel = (data.risk_score?.level || "").toLowerCase();
  const riskScoreLevel = 
        (rawLevel.includes("baixo") || rawLevel.includes("low") || rawLevel.includes("leve")) ? t('results.indicatorLeve') :
        (rawLevel.includes("moderado") || rawLevel.includes("moderate") || rawLevel.includes("médio")) ? t('results.indicatorModerado') :
        (rawLevel.includes("alto") || rawLevel.includes("high") || rawLevel.includes("forte") || rawLevel.includes("strong")) ? t('results.indicatorForte') :
        rawLevel || t('report.unspecified');
  // const riskScoreValue = Math.round((data.risk_score?.score || 0) * 100);
  
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
            <span style="font-size: 24px; font-weight: 900; color: #1e293b;">Primeiro</span>
            <span style="font-size: 24px; font-weight: 900; color: #3b82f6;">Olhar</span>
          </div>
          <span style="font-size: 13px; color: #64748b; font-weight: 500;">${formattedDate}</span>
        </div>
        
        <h1 style="color: #1e40af; text-align: center; margin-bottom: 20px; font-size: 28px; font-weight: bold;">${t('report.pdfTitle')}</h1>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
        
        <h2 style="margin-top: 0;">${t('report.childName')}: ${data.child_name || t('report.unspecified')}</h2>
        <h3>${t('results.indicatorsLevel')}: <span style="color: #ef4444;">${riskScoreLevel}</span></h3>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
          <h4 style="margin-top: 0; margin-bottom: 15px; color: #475569;">${t('report.dimensionsTitle')}</h4>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 5px 0;"><strong>${t('results.radarVisual')}:</strong> ${t('report.dimEyeContent')}</p>
            <p style="margin: 0 0 5px 0;"><strong>${t('results.radarExpressivity')}:</strong> ${t('report.dimExpContent')}</p>
            <p style="margin: 0;"><strong>${t('results.radarProsody')}:</strong> ${t('report.dimProContent')}</p>
          </div>
        </div>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; margin-top: 20px; border-radius: 8px; line-height: 1.6; text-align: justify; font-size: 14px;">
          ${parseSimpleMarkdown(data.gemma_report)}
        </div>

        <div style="margin-top: 40px; font-size: 12px; color: #64748b; padding-top: 15px; background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; text-align: justify;">
          <strong style="color: #b45309; display: block; margin-bottom: 8px; font-size: 14px;">${t('results.disclaimerTitle')}</strong>
          ${t('results.disclaimerDesc')}
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
