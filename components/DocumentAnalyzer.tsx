import React, { useState } from 'react';
// Added missing Loader2 import from lucide-react
import { Upload, FileText, AlertTriangle, ShieldCheck, Gavel, X, Zap, FileSearch, Scale, Landmark, Coins, Download, LayoutDashboard, Loader2, HelpCircle, Briefcase, Users, Shield, Printer } from 'lucide-react';
import { analyzeLegalDocument } from '../services/gemini';
import { User } from 'firebase/auth';
import { AnalysisResult, AnalyzedDocumentHistory, AnalyzedFile, NotificationType, DocumentAnalysisState } from '../types';

interface PillarCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  color: string;
  gradient: string;
}

const PillarCard: React.FC<PillarCardProps> = ({ title, icon, content, color, gradient }) => (
  <div className={`p-6 rounded-2xl border ${color} bg-white shadow-sm flex flex-col space-y-4 transition-all hover:shadow-md group relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] -mr-10 -mt-10 rounded-full group-hover:scale-110 transition-transform`} />
    <div className="flex items-center space-x-2 font-bold text-[11px] uppercase tracking-widest border-b border-slate-100 pb-3">
      <span className="p-1.5 rounded-lg bg-slate-50">{icon}</span>
      <span className="text-slate-700">{title}</span>
    </div>
    <p className="text-[13px] leading-relaxed text-slate-600 font-serif italic line-clamp-4">{content}</p>
  </div>
);

export const DocumentAnalyzer: React.FC<{
  state: DocumentAnalysisState;
  setState: React.Dispatch<React.SetStateAction<DocumentAnalysisState>>;
  onAddAnalysis: (item: AnalyzedDocumentHistory) => void;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  user: User | null;
}> = ({ state, setState, onAddAnalysis, notify, user }) => {
  const { files, result, customInstruction } = state;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const setFiles = (f: AnalyzedFile[] | ((prev: AnalyzedFile[]) => AnalyzedFile[])) => 
    setState(prev => ({ ...prev, files: typeof f === 'function' ? f(prev.files) : f }));
  
  const setResult = (r: AnalysisResult | null) => 
    setState(prev => ({ ...prev, result: r }));

  const setCustomInstruction = (i: string) => 
    setState(prev => ({ ...prev, customInstruction: i }));

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    if (!privacyAccepted) {
      notify("Debe aceptar el Aviso de Privacidad para continuar", "warning", "Consentimiento Requerido");
      return;
    }
    setIsAnalyzing(true);
    try {
      if (!user) {
        notify("Debe iniciar sesión para realizar auditorías", "error");
        return;
      }
      notify("Iniciando auditoría documental...", "info");
      const filesPayload = files.map(f => ({ base64: f.fileBase64, mimeType: f.mimeType, name: f.fileName }));
      const response = await analyzeLegalDocument(filesPayload, customInstruction, user.uid);
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: AnalysisResult = JSON.parse(cleanJson);
      setResult(parsed);
      onAddAnalysis({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        result: parsed,
        files: [...files],
        customInstruction
      });
      notify("Auditoría finalizada con éxito", "success");
    } catch (err: any) {
      console.error("Analysis Error:", err);
      let errorMsg = "Error en la auditoría. Verifique que los archivos sean legibles.";
      
      if (err.message?.includes("Límite")) {
        errorMsg = "Ha alcanzado el límite de auditorías de su licencia. Consulte los términos del servicio.";
      } else if (err.message?.includes("API key")) {
        errorMsg = "Error de autenticación. Verifique su API Key.";
      } else if (err.message?.includes("expirado")) {
        errorMsg = "Su licencia ha expirado. Por favor, renueve su suscripción.";
      }
      
      notify(errorMsg, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processFiles = (newFiles: File[]) => {
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => [...prev, {
          fileName: file.name,
          mimeType: file.type,
          fileBase64: (reader.result as string).split(',')[1],
          previewUrl: null
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExport = () => {
    if (!result) return;
    const content = `DICTAMEN DE AUDITORÍA LABORAL - LEXLABORAL
Fecha: ${new Date().toLocaleDateString()}
Puntuación de Riesgo: ${result.riskScore}/10

RESUMEN EJECUTIVO:
${result.summary}

PILAR INDIVIDUAL (LFT):
${result.pillars.individual}

PILAR COLECTIVO:
${result.pillars.colectivo}

PILAR SEGURIDAD SOCIAL:
${result.pillars.seguridad_social}

HALLAZGOS ESPECÍFICOS:
${result.risks.map((r, i) => `${i+1}. ${r}`).join('\n')}

RECOMENDACIÓN FINAL:
${result.recommendation}

---
Generado por LexLaboral. Privacidad Total: No se conservan copias de este análisis.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dictamen_Auditoria_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Dictamen exportado correctamente", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-y-auto p-8 md:p-12 bg-slate-50/50 no-print">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-wrap justify-between items-end gap-6 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-white rounded-2xl shadow-premium border border-slate-100">
               <LayoutDashboard className="text-legal-gold" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-serif font-bold text-legal-950 tracking-tight">Auditoría Jurídica Integral</h2>
                <div className="relative group/help">
                  <HelpCircle size={18} className="text-slate-400 cursor-help hover:text-legal-gold transition-colors mt-1" />
                  <div className="absolute left-0 top-full mt-2 w-80 p-5 bg-white border border-slate-200 shadow-2xl rounded-[1.5rem] opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none">
                    <p className="text-[11px] font-bold text-legal-950 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Módulo de Auditoría</p>
                    <ul className="space-y-3 text-[12px] leading-relaxed text-slate-600">
                      <li className="flex gap-2">
                        <span className="text-legal-gold font-bold">1.</span>
                        <span><b>Carga Documental:</b> Admite PDFs e imágenes de contratos, recibos de nómina o expedientes laborales.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-legal-gold font-bold">2.</span>
                        <span><b>Análisis de 3 Pilares:</b> Evaluación cruzada en materia Individual (LFT), Colectiva y Seguridad Social.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-legal-gold font-bold">3.</span>
                        <span><b>Dictamen Técnico:</b> Genera un puntaje de riesgo y recomendaciones preventivas exportables.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-1 font-medium italic">Diagnóstico exhaustivo y detección de contingencias legales.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                <ShieldCheck size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Modo Privado</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center relative hover:border-legal-gold/50 transition-all group shadow-sm hover:shadow-md cursor-pointer">
              <div className="p-5 bg-slate-50 rounded-2xl w-fit mx-auto mb-5 group-hover:bg-legal-gold/10 transition-colors">
                 <Upload className="text-slate-400 group-hover:text-legal-gold transition-colors" size={28} />
              </div>
              <h3 className="text-sm font-bold text-legal-950 mb-1">Cargar Documentos</h3>
              <p className="text-[11px] text-slate-400 font-medium">Suelte archivos PDF o imágenes aquí</p>
              <input type="file" multiple onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2 animate-fade-in-up">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Expediente Preparado ({files.length})</p>
                  <div className="max-h-56 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl text-[12px] shadow-sm hover:border-legal-gold/30 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-50 rounded-lg"><FileText size={16} className="text-slate-400" /></div>
                            <span className="truncate max-w-[150px] font-semibold text-slate-700">{f.fileName}</span>
                        </div>
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors p-1"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-premium space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Foco de la Auditoría</label>
                <textarea 
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="Ej: Análisis de cláusulas de exclusividad y penalizaciones..."
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] outline-none h-32 focus:ring-4 ring-legal-gold/5 focus:border-legal-gold transition-all shadow-inner-soft leading-relaxed"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-legal-gold bg-white border-slate-300 rounded focus:ring-legal-gold cursor-pointer"
                />
                <label htmlFor="privacy-consent" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer select-none">
                  <span className="font-bold text-slate-800">Consentimiento de Privacidad:</span> Confirmo que he ofuscado datos sensibles (RFC, nombres, salarios) de los documentos. Autorizo el análisis automatizado conforme a la <a href="#" className="text-legal-gold hover:underline">Política de Privacidad</a>, entendiendo que no se almacenan copias ni se entrenan modelos con esta información.
                </label>
              </div>

              <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || files.length === 0 || !privacyAccepted}
                className="w-full py-5 bg-legal-950 text-legal-gold rounded-2xl font-bold shadow-xl shadow-legal-950/20 hover:bg-legal-900 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Ejecutando Diagnóstico...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Iniciar Auditoría Experta</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-premium border border-slate-200/50 p-12 min-h-[600px] relative overflow-hidden flex flex-col">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                <div className="p-8 bg-slate-50 rounded-full mb-8 shadow-inner-soft">
                  <FileSearch size={72} className="opacity-20 text-legal-950" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-800">Módulo de Auditoría</h3>
                <p className="max-w-xs text-center text-sm font-medium text-slate-400 mt-3 leading-relaxed">
                  Cargue los documentos de su expediente para generar un dictamen técnico de riesgos integral.
                </p>
              </div>
            ) : (
              <div className="space-y-10 animate-fade-in-up flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-2">Índice de Exposición Legal</span>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-6xl font-serif font-bold tracking-tighter ${result.riskScore > 7 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {result.riskScore}<span className="text-2xl text-slate-300">/10</span>
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${result.riskScore > 7 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        Riesgo {result.riskScore > 7 ? 'Alto' : 'Controlado'}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-legal-950 rounded-3xl flex items-center justify-center shadow-2xl shadow-legal-950/20">
                    <ShieldCheck className="text-legal-gold" size={40} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <PillarCard title="Individual" icon={<Briefcase size={18}/>} content={result.pillars.individual} color="border-blue-100/50" gradient="from-blue-600 to-indigo-600" />
                  <PillarCard title="Colectivo" icon={<Users size={18}/>} content={result.pillars.colectivo} color="border-amber-100/50" gradient="from-amber-600 to-orange-600" />
                  <PillarCard title="Seguridad Social" icon={<Shield size={18}/>} content={result.pillars.seguridad_social} color="border-purple-100/50" gradient="from-purple-600 to-fuchsia-600" />
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200/40 shadow-inner-soft flex-1">
                  <h4 className="text-[11px] font-bold text-legal-950 uppercase mb-6 flex items-center gap-2.5 tracking-[0.2em]">
                    <AlertTriangle size={18} className="text-red-500" /> Hallazgos Críticos Identificados
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.risks.map((r, i) => (
                      <li key={i} className="text-[13px] text-slate-700 flex items-start gap-4 bg-white/60 p-5 rounded-2xl border border-white transition-all hover:bg-white hover:shadow-sm">
                        <span className="w-6 h-6 rounded-lg bg-legal-950 text-legal-gold text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          {i+1}
                        </span> 
                        <span className="font-medium leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-10 flex gap-5">
                   <button 
                    onClick={handleExport}
                    className="flex-1 bg-gradient-to-br from-legal-gold to-legal-goldhover text-legal-950 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-legal-gold/20 hover:brightness-105 transition-all active:scale-[0.98]"
                   >
                     <Download size={22} /> Exportar Dictamen Técnico (.txt)
                   </button>
                   <button 
                    onClick={handlePrint}
                    className="px-8 border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all hover:text-slate-600 active:scale-95"
                    title="Imprimir Dictamen"
                   >
                     <Printer size={22} />
                   </button>
                   <button 
                    onClick={() => {setResult(null); setFiles([]); notify("Sesión de auditoría finalizada", "info");}}
                    className="px-8 border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all hover:text-slate-600 active:scale-95"
                    title="Nueva Auditoría"
                   >
                     <Zap size={22} />
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Print Only Content */}
      {result && (
        <div className="hidden print:block legal-document-print">
          <div className="legal-header">
            <div className="flex items-center gap-3">
              <Scale size={32} color="#d4af37" />
              <div className="font-serif font-bold text-2xl">LexLaboral</div>
            </div>
            <div className="text-right text-[10pt] uppercase tracking-widest font-bold">
              Dictamen de Auditoría Jurídica<br/>
              {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <h1 className="text-3xl font-serif font-bold mb-6">Dictamen Técnico de Riesgos</h1>
          
          <div className="mb-8 p-6 bg-slate-50 border-l-4 border-legal-gold">
            <h2 className="text-xl font-bold mb-2">Resumen Ejecutivo</h2>
            <p>{result.summary}</p>
            <div className="mt-4 font-bold">Puntuación de Riesgo: {result.riskScore}/10</div>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <section>
              <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-3">Pilar Individual (LFT)</h3>
              <p>{result.pillars.individual}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-3">Pilar Colectivo</h3>
              <p>{result.pillars.colectivo}</p>
            </section>
            <section>
              <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-3">Seguridad Social</h3>
              <p>{result.pillars.seguridad_social}</p>
            </section>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-3">Hallazgos Críticos</h3>
            <ul className="list-disc pl-5 space-y-2">
              {result.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-3">Recomendación Final</h3>
            <p className="italic">{result.recommendation}</p>
          </section>

          <div className="legal-footer">
            Este dictamen ha sido generado mediante el motor de auditoría jurídica LexLaboral.<br/>
            Privacidad Total: No se conservan copias de este análisis en nuestros servidores.
          </div>
        </div>
      )}
    </div>
  );
};