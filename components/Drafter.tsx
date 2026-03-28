
import React, { useState, useCallback } from 'react';
import { PenTool, Download, Copy, RefreshCw, ShieldAlert, FileSignature, Gavel, Users, Zap, FileText, FileKey, Shield, Briefcase, Coins, Scale, HelpCircle, Eye, X, Printer, Sparkles, Send } from 'lucide-react';
import { draftLegalDocument } from '../services/gemini';
import { NotificationType, DraftingState } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface DrafterProps {
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  onUpgrade?: (plan?: 'draft_basic' | 'draft_custom') => void;
}

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, onUpgrade }) => {
  const { prompt, generatedDoc } = state;
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  const setPrompt = useCallback((p: string) => setState(prev => ({ ...prev, prompt: p })), []);
  const setGeneratedDoc = useCallback((d: string) => setState(prev => ({ ...prev, generatedDoc: d })), []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(state.generatedDoc);
    notify("Texto copiado", "success");
  }, [state.generatedDoc, notify]);

  const handleDownload = () => {
    const file = new Blob([state.generatedDoc], {type: 'text/plain'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `LexLaboral_Instrumento_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    notify("Descarga iniciada", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  const draftingModels = [
    { 
      id: 'contrato',
      title: "Contrato Individual", 
      icon: <Users size={18} />, 
      prompt: "Contrato individual de trabajo por tiempo indeterminado con cláusulas de periodo de prueba, jornada legal, salario y prestaciones de ley conforme a la LFT." 
    },
    { 
      id: 'rescisión',
      title: "Rescisión Justificada", 
      icon: <ShieldAlert size={18} />, 
      prompt: "Aviso de rescisión de la relación laboral sin responsabilidad para el patrón, detallando las causales del artículo 47 de la LFT y hechos específicos." 
    },
    { 
      id: 'convenio',
      title: "Convenio Finiquito", 
      icon: <Coins size={18} />, 
      prompt: "Convenio de terminación de la relación laboral por mutuo consentimiento, incluyendo desglose de finiquito (partes proporcionales) y liberación de obligaciones." 
    },
    { 
      id: 'demanda',
      title: "Demanda Laboral", 
      icon: <Gavel size={18} />, 
      prompt: "Escrito inicial de demanda laboral por despido injustificado, reclamando indemnización constitucional, salarios vencidos y prestaciones adeudadas." 
    }
  ];

  const handleDraft = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsDrafting(true);
    try {
      notify("Proyectando instrumento jurídico...", "info");
      const doc = await draftLegalDocument(prompt, customInstructions);
      setGeneratedDoc(doc);
      notify("Instrumento proyectado exitosamente", "success");
    } catch (error) {
      console.error("Drafting Error:", error);
      notify("Error en la proyección. Intente de nuevo.", "error");
    } finally {
      setIsDrafting(false);
    }
  }, [prompt, customInstructions, notify, setGeneratedDoc]);

  return (
    <div className="h-full flex flex-col bg-slate-50 no-print animate-fade-in">
      {/* Header Section */}
      <div className="p-8 lg:p-12 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-legal-950 rounded-lg shadow-lg">
                <PenTool size={20} className="text-legal-gold" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Redactor Documental</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">
              Cree instrumentos jurídicos profesionales, contratos y convenios laborales con inteligencia artificial adaptada a la LFT.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => onUpgrade && onUpgrade()}
               className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-2 shadow-sm transition-all active:scale-95 group"
             >
               <Sparkles size={16} className="text-legal-gold group-hover:animate-pulse" />
               <span className="text-xs font-bold uppercase tracking-wider">Ver Precios</span>
             </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {draftingModels.map((m) => (
                <button 
                    key={m.id} 
                    onClick={() => setPrompt(m.prompt)}
                    className={`flex flex-col items-start p-5 rounded-[1.5rem] border transition-all duration-300 ${prompt === m.prompt ? 'bg-legal-950 border-legal-950 text-white shadow-xl shadow-legal-950/20' : 'bg-white border-slate-200 text-slate-600 hover:border-legal-gold hover:shadow-lg'}`}
                >
                    <div className={`p-2 rounded-xl mb-3 ${prompt === m.prompt ? 'bg-white/10 text-legal-gold' : 'bg-slate-50 text-slate-400 group-hover:text-legal-gold'}`}>
                      {m.icon}
                    </div>
                    <span className="text-xs font-bold tracking-tight">{m.title}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 lg:px-12 pb-12 gap-8 overflow-hidden">
        {/* Editor Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Jurídica / Requerimientos</label>
              <HelpCircle size={14} className="text-slate-300 cursor-help" />
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Contrato individual de trabajo para un gerente de ventas, con salario de $25,000 mensuales..."
              className="flex-1 w-full p-6 rounded-2xl border border-slate-100 outline-none text-sm bg-slate-50 mb-6 focus:bg-white focus:border-legal-gold focus:ring-4 ring-legal-gold/5 transition-all resize-none leading-relaxed"
            />

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Instrucciones Adicionales</label>
                <input 
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Incluir cláusula de no competencia por 1 año"
                  className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-xs focus:bg-white focus:border-legal-gold outline-none transition-all"
                />
              </div>

              <button
                onClick={handleDraft}
                disabled={isDrafting || !prompt}
                className="w-full py-5 bg-legal-950 text-legal-gold rounded-2xl font-bold hover:bg-legal-900 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 active:scale-95 shadow-xl shadow-legal-900/20"
              >
                 {isDrafting ? <RefreshCw className="animate-spin" size={20}/> : <Send size={20} />}
                 <span>{isDrafting ? 'Generando...' : 'Generar Documento'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-[2rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          <div className="bg-slate-50/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-slate-200 z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editor de Instrumentos</span>
            </div>
            
            {generatedDoc && (
              <div className="flex gap-2">
                <button onClick={() => setIsPreviewOpen(true)} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-white rounded-xl transition-all shadow-sm" title="Vista Previa"><Eye size={18} /></button>
                <button onClick={handleCopy} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-white rounded-xl transition-all shadow-sm" title="Copiar"><Copy size={18} /></button>
                <button onClick={handlePrint} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-white rounded-xl transition-all shadow-sm" title="Imprimir"><Printer size={18} /></button>
                <button onClick={handleDownload} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-white rounded-xl transition-all shadow-sm text-blue-600" title="Descargar"><Download size={18} /></button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-10 lg:p-16 overflow-y-auto font-serif text-[15px] leading-relaxed text-slate-800 scrollbar-thin bg-white">
            {isDrafting ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse text-[10px] uppercase tracking-widest">Ensamblando cláusulas jurídicas...</p>
              </div>
            ) : generatedDoc ? (
              <div className="max-w-3xl mx-auto animate-in fade-in duration-700 markdown-body prose prose-slate prose-sm md:prose-base">
                <ReactMarkdown>{generatedDoc}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                <div className="p-8 bg-slate-50 rounded-[3rem] mb-6">
                  <FileText size={64} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-700">Proyecto en Blanco</h3>
                <p className="max-w-xs text-center text-xs mt-3 leading-relaxed">
                  Utilice una plantilla predeterminada o describa su requerimiento en el panel izquierdo para generar el instrumento integral.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-legal-950/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-100 w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <div className="p-6 sm:px-10 flex items-center justify-between bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-legal-950 rounded-2xl">
                    <Eye className="text-legal-gold" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-legal-950">Vista Previa Profesional</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maquetación según estándares legales</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-legal-950"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-16 bg-slate-200/30 no-scrollbar">
                <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[25mm] min-h-[297mm] rounded-sm border border-slate-200 markdown-body font-serif text-[14px] leading-relaxed text-slate-900">
                  <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                </div>
              </div>

              <div className="p-6 sm:px-10 bg-white border-t border-slate-200 flex justify-end gap-4">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    handleCopy();
                    setIsPreviewOpen(false);
                  }}
                  className="px-8 py-4 bg-legal-950 text-legal-gold rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-legal-950/20 hover:bg-legal-900 transition-all flex items-center gap-2"
                >
                  <Copy size={16} />
                  <span>Copiar y Cerrar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .markdown-body { font-size: 12pt !important; line-height: 1.6 !important; }
        }
      `}</style>
    </div>
  );
});
