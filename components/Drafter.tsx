import React, { useState } from 'react';
import { PenTool, Download, Copy, RefreshCw, ShieldAlert, FileSignature, Gavel, Users, Zap, FileText, Home, FileKey, Shield, Briefcase, Coins, Scale, HelpCircle, Eye, X, Printer, Sparkles } from 'lucide-react';
import { draftLegalDocument } from '../services/gemini';
import { User } from 'firebase/auth';
import { ChatMessage, NotificationType, DraftingState } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export const Drafter: React.FC<{
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  user: User | null;
  userData?: any;
  onUpgrade?: (plan?: 'draft_basic' | 'draft_custom') => void;
  onAuthRequired?: () => void;
}> = ({ state, setState, notify, user, userData, onUpgrade, onAuthRequired }) => {
  const { prompt, generatedDoc } = state;
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const setPrompt = (p: string) => setState(prev => ({ ...prev, prompt: p }));
  const setGeneratedDoc = (d: string) => setState(prev => ({ ...prev, generatedDoc: d }));

  const draftingModels = [
    { 
      title: "Contrato Individual", 
      icon: <Users size={14} />, 
      prompt: "Contrato individual de trabajo por tiempo indeterminado con cláusulas de periodo de prueba, jornada legal, salario y prestaciones de ley conforme a la LFT." 
    },
    { 
      title: "Rescisión Justificada", 
      icon: <ShieldAlert size={14} />, 
      prompt: "Aviso de rescisión de la relación laboral sin responsabilidad para el patrón, detallando las causales del artículo 47 de la LFT y hechos específicos." 
    },
    { 
      title: "Convenio Finiquito", 
      icon: <Coins size={14} />, 
      prompt: "Convenio de terminación de la relación laboral por mutuo consentimiento, incluyendo desglose de finiquito (partes proporcionales) y liberación de obligaciones." 
    },
    { 
      title: "Demanda Laboral", 
      icon: <Gavel size={14} />, 
      prompt: "Escrito inicial de demanda laboral por despido injustificado, reclamando indemnización constitucional, salarios vencidos y prestaciones adeudadas." 
    },
    { 
      title: "Reglamento Interior", 
      icon: <FileSignature size={14} />, 
      prompt: "Proyecto de Reglamento Interior de Trabajo que cumpla con los requisitos de la LFT, incluyendo disposiciones de disciplina, higiene y seguridad." 
    },
    { 
      title: "Contrato Colectivo", 
      icon: <Briefcase size={14} />, 
      prompt: "Cláusulas fundamentales para un Contrato Colectivo de Trabajo, incluyendo tabuladores salariales, capacitación y cuotas sindicales." 
    },
    { 
      title: "Carta Renuncia", 
      icon: <FileText size={14} />, 
      prompt: "Carta de renuncia voluntaria con ratificación de no adeudo por parte de la empresa y manifestación de haber recibido todas las prestaciones." 
    }
  ];

  const handleDraft = async () => {
    if (!user) {
      notify("Debe iniciar sesión para proyectar instrumentos.", "warning", "Acceso Restringido");
      if (onAuthRequired) onAuthRequired();
      return;
    }

    if (!prompt.trim()) return;
    setIsDrafting(true);
    try {
      notify("Proyectando instrumento jurídico...", "info");
      const idToken = await user.getIdToken();
      const doc = await draftLegalDocument(prompt, idToken);
      setGeneratedDoc(doc);
      notify("Instrumento proyectado exitosamente", "success");
    } catch (error) {
      console.error("Drafting Error:", error);
      const errorMessage = error instanceof Error ? error.message : "";

      if (errorMessage.includes("Límite") || errorMessage.includes("Saldo")) {
        notify("Créditos insuficientes. Adquiera un pase para continuar.", "warning", "Acceso Restringido");
        if (onUpgrade) onUpgrade('draft_basic');
      } else if (errorMessage.includes("API key")) {
        notify("Error de autenticación. Verifique su API Key.", "error");
      } else if (errorMessage.includes("expirado")) {
        notify("Su licencia ha expirado. Por favor, renueve su suscripción.", "error");
        if (onUpgrade) onUpgrade('draft_basic');
      } else {
        notify("Error en la proyección. Intente con instrucciones más breves.", "error");
      }
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    notify("Texto copiado", "success");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDoc], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `LexLaboral_Instrumento_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    notify("Descarga iniciada", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 no-print">
      <div className="p-10 pb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-serif font-bold text-legal-900 tracking-tight">Ingeniería Jurídica</h2>
            <div className="relative group/help">
              <HelpCircle size={20} className="text-slate-400 cursor-help hover:text-legal-gold transition-colors mt-1" />
              <div className="absolute left-0 top-full mt-2 w-80 p-5 bg-white border border-slate-200 shadow-2xl rounded-[1.5rem] opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none">
                <p className="text-[11px] font-bold text-legal-950 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Guía de Redacción</p>
                <ul className="space-y-3 text-[12px] leading-relaxed text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-legal-gold font-bold">•</span>
                    <span><b>Plantillas Base:</b> Utilice los botones superiores para cargar estructuras comunes.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-legal-gold font-bold">•</span>
                    <span><b>Personalización:</b> Detalle partes, objeto y condiciones especiales en el panel de instrucciones.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-legal-gold font-bold">•</span>
                    <span><b>Proyección Formal:</b> El sistema genera el instrumento con estructura de cláusulas, proemio y firmas.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {(!userData?.isPremium || (userData?.expiresAt && new Date(userData.expiresAt) < new Date())) && (
               <button 
                 onClick={() => onUpgrade && onUpgrade()}
                 className="bg-legal-gold/10 text-legal-gold hover:bg-legal-gold/20 px-4 py-2 rounded-xl border border-legal-gold/20 flex items-center gap-2 shadow-sm transition-all active:scale-95 group"
               >
                 <Sparkles size={14} className="group-hover:animate-pulse" />
                 <span className="text-[11px] font-bold uppercase tracking-wider">Adquirir Créditos</span>
               </button>
             )}
          </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 max-w-5xl">
            {draftingModels.map((m, i) => (
                <button 
                    key={i} 
                    onClick={() => setPrompt(m.prompt)}
                    className={`flex items-center space-x-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold transition-all shadow-sm ${prompt === m.prompt ? 'border-legal-gold text-legal-gold ring-2 ring-legal-gold/10' : 'border-slate-200 text-slate-600 hover:border-legal-gold hover:text-legal-gold'}`}
                >
                    {m.icon} <span>{m.title}</span>
                </button>
            ))}
        </div>


      <div className="flex-1 flex flex-col lg:flex-row p-8 lg:p-12 pt-2 gap-8 overflow-hidden">
        <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Instrucciones de Redacción</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describa el objeto del contrato o el instrumento jurídico a redactar..."
            className="flex-1 w-full p-5 rounded-2xl border border-slate-200 outline-none text-sm bg-slate-50 mb-6 focus:border-legal-gold focus:ring-4 ring-legal-gold/5 transition-all resize-none leading-relaxed"
          />
          <button
            onClick={handleDraft}
            disabled={isDrafting || !prompt}
            className="w-full py-5 bg-legal-900 text-legal-gold rounded-2xl font-bold hover:bg-legal-800 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 active:scale-95 shadow-xl shadow-legal-900/20"
          >
             {isDrafting ? <RefreshCw className="animate-spin" size={20}/> : <PenTool size={20} />}
             <span>{isDrafting ? 'Proyectando...' : 'Generar Instrumento Completo'}</span>
          </button>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-[2rem] shadow-2xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 flex gap-3 z-10">
            {generatedDoc && (
              <>
                <button onClick={() => setIsPreviewOpen(true)} className="p-3 bg-white/90 border border-slate-200 text-slate-500 hover:text-legal-gold rounded-xl transition-all shadow-sm active:scale-95" title="Vista Previa"><Eye size={20} /></button>
                <button onClick={handleCopy} className="p-3 bg-white/90 border border-slate-200 text-slate-500 hover:text-legal-gold rounded-xl transition-all shadow-sm active:scale-95" title="Copiar al portapapeles"><Copy size={20} /></button>
                <button onClick={handlePrint} className="p-3 bg-white/90 border border-slate-200 text-slate-500 hover:text-legal-gold rounded-xl transition-all shadow-sm active:scale-95" title="Impresión Profesional"><Printer size={20} /></button>
                <button onClick={handleDownload} className="p-3 bg-white/90 border border-slate-200 text-slate-500 hover:text-legal-gold rounded-xl transition-all shadow-sm active:scale-95" title="Descargar documento"><Download size={20} /></button>
              </>
            )}
          </div>
          
          <div className="flex-1 p-12 overflow-y-auto font-serif text-[15px] leading-relaxed text-slate-800 scrollbar-thin">
            {isDrafting ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">Redactando Cláusulas...</p>
              </div>
            ) : generatedDoc ? (
              <div className="max-w-3xl mx-auto animate-in fade-in duration-700 markdown-body">
                <ReactMarkdown>{generatedDoc}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                <FileText size={64} className="mb-6" />
                <h3 className="text-xl font-serif font-bold text-slate-700">Proyecto de Redacción</h3>
                <p className="max-w-sm text-center text-sm mt-2">Seleccione una plantilla o ingrese instrucciones para visualizar el instrumento integral.</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                    <h3 className="text-xl font-serif font-bold text-legal-950">Vista Previa del Instrumento</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revisión técnica antes de exportación</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-legal-950"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-16 bg-slate-200/30">
                <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[20mm] min-h-[297mm] rounded-sm border border-slate-200 markdown-body font-serif text-[14px] leading-relaxed text-slate-900">
                  <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                </div>
              </div>

              <div className="p-6 sm:px-10 bg-white border-t border-slate-200 flex justify-end gap-4">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    handleCopy();
                    setIsPreviewOpen(false);
                  }}
                  className="px-8 py-4 bg-legal-950 text-legal-gold rounded-2xl font-bold shadow-xl shadow-legal-950/20 hover:bg-legal-900 transition-all flex items-center gap-2"
                >
                  <Copy size={18} />
                  <span>Copiar y Cerrar</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Print Only Content */}
      <div className="hidden print:block legal-document-print">
        <div className="legal-header">
          <div className="flex items-center gap-3">
            <Scale size={32} color="#d4af37" />
            <div className="font-serif font-bold text-2xl">LexLaboral</div>
          </div>
          <div className="text-right text-[10pt] uppercase tracking-widest font-bold">
            Instrumento Jurídico Proyectado<br/>
            {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{generatedDoc}</ReactMarkdown>
        </div>
        <div className="legal-footer">
          Este documento ha sido proyectado mediante el motor de ingeniería jurídica LexLaboral.<br/>
          La validez legal de este instrumento depende de su revisión y firma por profesionales autorizados.
        </div>
      </div>
    </div>
  );
};
