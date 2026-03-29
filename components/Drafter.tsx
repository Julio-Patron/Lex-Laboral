import React, { useState, useCallback, useEffect } from 'react';
import { PenTool, Download, Copy, RefreshCw, ShieldAlert, Gavel, Users, Coins, Sparkles, Send, Eye, X, Printer, FileText, ChevronRight, Briefcase, User, AlignLeft, Scale, Clock, UserMinus, AlertTriangle, Book } from 'lucide-react';
import { draftLegalDocument } from '../services/gemini';
import { NotificationType, DraftingState } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

interface DrafterProps {
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  onUpgrade?: (plan?: 'draft_basic' | 'draft_custom') => void;
  onAuthRequired?: () => void;
}

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, onUpgrade, onAuthRequired }) => {
  const { prompt, generatedDoc } = state;
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user, credits, refreshCredits } = useAuth();
  
  // Structured Form State
  const [selectedTemplate, setSelectedTemplate] = useState('contrato');
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const draftingModels = [
    { 
      id: 'contrato',
      title: "Contrato Indeterminado", 
      icon: <Users size={20} />, 
      basePrompt: "Contrato individual de trabajo por tiempo indeterminado conforme a la LFT."
    },
    { 
      id: 'contrato_determinado',
      title: "Contrato Temporal", 
      icon: <Clock size={20} />, 
      basePrompt: "Contrato individual de trabajo por tiempo u obra determinada conforme a la LFT."
    },
    { 
      id: 'rescisión',
      title: "Aviso de Rescisión", 
      icon: <ShieldAlert size={20} />, 
      basePrompt: "Aviso de rescisión de la relación laboral sin responsabilidad para el patrón, artículo 47 LFT." 
    },
    { 
      id: 'renuncia',
      title: "Carta Renuncia", 
      icon: <UserMinus size={20} />, 
      basePrompt: "Carta de renuncia voluntaria al empleo y ratificación de no adeudo de prestaciones."
    },
    { 
      id: 'convenio',
      title: "Convenio Finiquito", 
      icon: <Coins size={20} />, 
      basePrompt: "Convenio de terminación de la relación laboral por mutuo consentimiento con desglose de finiquito." 
    },
    { 
      id: 'acta_admin',
      title: "Acta Administrativa", 
      icon: <AlertTriangle size={20} />, 
      basePrompt: "Acta administrativa laboral por incumplimiento de obligaciones o faltas al reglamento interior."
    },
    { 
      id: 'reglamento',
      title: "Reglamento Interior", 
      icon: <Book size={20} />, 
      basePrompt: "Reglamento Interior de Trabajo básico con normas de disciplina, horarios y medidas de seguridad."
    },
    { 
      id: 'demanda',
      title: "Demanda (Despido)", 
      icon: <Gavel size={20} />, 
      basePrompt: "Escrito inicial de demanda laboral por despido injustificado (indemnización, salarios caídos)." 
    }
  ];

  const setGeneratedDoc = useCallback((d: string) => setState(prev => ({ ...prev, generatedDoc: d })), [setState]);

  // Sync internal form to the main prompt state seamlessly
  useEffect(() => {
    const template = draftingModels.find(m => m.id === selectedTemplate);
    let assembledPrompt = template ? template.basePrompt : prompt;
    
    if (employeeName) assembledPrompt += `\nTrabajador/Actor: ${employeeName}`;
    if (position) assembledPrompt += `\nPuesto/Cargo: ${position}`;
    if (details) assembledPrompt += `\nHechos y Detalles Específicos:\n${details}`;
    
    setState(prev => ({ ...prev, prompt: assembledPrompt }));
  }, [selectedTemplate, employeeName, position, details]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(state.generatedDoc);
    notify("Texto copiado", "success");
  }, [state.generatedDoc, notify]);

  const handleDownload = () => {
    const file = new Blob([state.generatedDoc], {type: 'text/plain'});
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = `LexLaboral_Instrumento_${selectedTemplate}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    notify("Descarga iniciada", "success");
  };

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDraft = useCallback(async () => {
    if (!prompt.trim()) return;

    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    // Check credits
    if (credits.draft_basic_balance <= 0 && credits.audits_balance <= 0) {
      if (onUpgrade) onUpgrade('draft_basic');
      return;
    }

    setIsDrafting(true);
    try {
      notify("Procesando inteligencia jurídica...", "info", "Generador Activo");
      const doc = await draftLegalDocument(prompt, customInstructions);
      await refreshCredits(); // Sync credits post-draft if backend updated
      setGeneratedDoc(doc);
      notify("Instrumento ensamblado exitosamente", "success", "Listo");
    } catch (error) {
      console.error("Drafting Error:", error);
      notify("Error en la proyección. Asegúrese de tener créditos o saldo disponible.", "error");
    } finally {
      setIsDrafting(false);
    }
  }, [prompt, customInstructions, notify, setGeneratedDoc, user, credits, onAuthRequired, onUpgrade, refreshCredits]);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] no-print animate-fade-in font-sans relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-legal-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Header Section */}
      <div className="pt-8 px-8 lg:px-12 pb-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-legal-950 to-slate-900 rounded-2xl shadow-xl shadow-legal-950/20">
                <Scale size={24} className="text-legal-gold" />
              </div>
              <h2 className="text-4xl font-serif font-extrabold text-slate-900 tracking-tight">Generador de Documentos</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-xl font-medium">
              Redacción automatizada de instrumentos jurídicos laborales con IA de alta precisión. Estructuras apegadas a la Ley Federal del Trabajo.
            </p>
          </div>
          
          <button 
            onClick={() => onUpgrade && onUpgrade()}
            className="group relative overflow-hidden bg-white hover:bg-slate-50 text-legal-950 px-8 py-4 rounded-[1.5rem] border border-slate-200 shadow-sm transition-all active:scale-[0.98] flex items-center gap-3"
          >
            <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:animate-shine" />
            <Sparkles size={18} className="text-legal-gold group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Planes y Créditos</span>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Template Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {draftingModels.map((m) => (
                <button 
                    key={m.id} 
                    onClick={() => setSelectedTemplate(m.id)}
                    className={`relative overflow-hidden flex items-center gap-3 p-3 lg:px-4 rounded-2xl transition-all duration-300 border ${
                      selectedTemplate === m.id 
                      ? 'bg-legal-950 border-legal-950 text-white shadow-lg shadow-legal-950/20 scale-[1.02]' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-legal-gold/50 hover:shadow-md'
                    }`}
                >
                    <div className={`p-2 rounded-xl transition-colors shrink-0 ${selectedTemplate === m.id ? 'bg-white/10 text-legal-gold' : 'bg-slate-50 text-slate-400 group-hover:text-legal-gold'}`}>
                      {m.icon}
                    </div>
                    <span className="text-xs font-bold tracking-tight text-left leading-tight">{m.title}</span>
                    
                    {selectedTemplate === m.id && (
                      <div className="absolute right-0 top-0 w-16 h-16 bg-white/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 lg:px-12 pb-12 gap-8 overflow-hidden relative z-10">
        
        {/* Editor Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 flex flex-col flex-1 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <AlignLeft size={16} className="text-legal-gold" /> Contexto del Caso
              </h3>
            </div>
            
            <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar pr-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nombre del Trabajador / Actor</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Ej. Juan Pérez García" 
                    className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-legal-gold focus:ring-4 focus:ring-legal-gold/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Puesto o Cargo</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ej. Gerente Comercial" 
                    className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-legal-gold focus:ring-4 focus:ring-legal-gold/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Hechos y Detalles Específicos</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describa el salario, fechas clave, causales específicas o prestaciones reclamadas..." 
                  className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-legal-gold focus:ring-4 focus:ring-legal-gold/10 outline-none transition-all resize-none h-32 leading-relaxed"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Ajustes & Cláusulas Extra (Opcional)</label>
                <input 
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Incluir cláusula de confidencialidad estricta"
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white text-xs focus:border-legal-gold outline-none shadow-sm transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleDraft}
              disabled={isDrafting}
              className="mt-6 w-full py-5 bg-gradient-to-r from-legal-950 to-slate-900 text-legal-gold rounded-[1.5rem] font-bold shadow-2xl shadow-legal-950/20 hover:shadow-legal-950/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:active:scale-100 group relative overflow-hidden"
            >
               <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               {isDrafting ? <RefreshCw className="animate-spin text-white" size={20}/> : <Send size={20} className="text-legal-gold group-hover:translate-x-1 transition-transform" />}
               <span className="text-white tracking-wide">{isDrafting ? 'Ensamblando...' : 'Generar Instrumento'}</span>
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          <div className="bg-slate-50/90 backdrop-blur-xl px-10 py-5 flex items-center justify-between border-b border-slate-200 z-10">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                 <div className="w-3 h-3 bg-emerald-500 rounded-full absolute animate-ping opacity-75" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Previsualización del Documento</span>
            </div>
            
            {generatedDoc && (
              <div className="flex gap-2">
                <button onClick={() => setIsPreviewOpen(true)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2"><Eye size={16} /> <span className="hidden sm:inline">Ampliar</span></button>
                <div className="w-px h-8 bg-slate-200 mx-1 self-center" />
                <button onClick={handleCopy} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-slate-100 rounded-xl transition-all" title="Copiar"><Copy size={18} /></button>
                <button onClick={handlePrint} className="p-2.5 text-slate-500 hover:text-legal-950 hover:bg-slate-100 rounded-xl transition-all" title="Imprimir"><Printer size={18} /></button>
                <button onClick={handleDownload} className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all" title="Descargar DOC"><Download size={18} /></button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-10 lg:p-16 overflow-y-auto font-serif text-[15px] leading-relaxed text-slate-800 scrollbar-thin bg-[#FAFAFA] relative">
            {isDrafting ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-20">
                <div className="w-20 h-20 relative flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-legal-gold border-t-transparent rounded-full animate-spin" />
                  <Scale size={24} className="text-legal-950 animate-pulse" />
                </div>
                <h4 className="mt-6 text-lg font-serif font-bold text-legal-950">Aplicando Lógica Jurídica</h4>
                <p className="text-slate-400 font-medium text-xs uppercase tracking-widest mt-2">Dando formato y estructura...</p>
              </div>
            ) : generatedDoc ? (
              <div className="max-w-[210mm] mx-auto animate-in fade-in duration-700 my-8">
                 <div className="bg-white p-[20mm] shadow-xl border border-slate-200 rounded-sm min-h-[297mm]">
                   <div className="markdown-body prose prose-slate prose-sm md:prose-base max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-justify prose-p:leading-[1.8]">
                     <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                   </div>
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <div className="p-10 bg-slate-100 rounded-[3rem] mb-6 shadow-inner">
                  <FileText size={72} className="text-slate-300" strokeWidth={1} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-600">Lienzo en Blanco</h3>
                <p className="max-w-sm text-center text-sm mt-3 leading-relaxed font-sans">
                  El documento proyectado aparecerá aquí con formato oficial, listo para ser revisado, copiado o impreso.
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-legal-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-slate-100 w-full max-w-5xl h-full max-h-[95vh] rounded-[2.5rem] shadow-2xl shadow-black/50 flex flex-col overflow-hidden border border-white/10"
            >
              <div className="px-8 py-5 flex items-center justify-between bg-white border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-legal-950 rounded-2xl shadow-md">
                    <Eye className="text-legal-gold" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-slate-900">Vista Profesional</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Formato de Impresión (A4)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-legal-950"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-[#F1F5F9] no-scrollbar">
                <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[25mm] min-h-[297mm] rounded-sm border border-slate-200">
                  <div className="markdown-body prose prose-slate prose-sm md:prose-base max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-justify prose-p:leading-[1.8]">
                    <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-white border-t border-slate-200 flex justify-end gap-4 items-center">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Regresar
                </button>
                <div className="w-px h-8 bg-slate-200" />
                <button 
                  onClick={() => {
                    handleCopy();
                    setIsPreviewOpen(false);
                  }}
                  className="px-8 py-4 bg-legal-950 text-legal-gold rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-legal-950/20 hover:bg-slate-900 hover:shadow-legal-950/40 transition-all flex items-center gap-2"
                >
                  <Copy size={18} />
                  <span>Copiar Contenido</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .markdown-body { font-size: 12pt !important; line-height: 1.8 !important; color: black !important; }
          @page { margin: 2.5cm; }
        }
      `}</style>
    </div>
  );
});
