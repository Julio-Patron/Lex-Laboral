import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalyzedDocumentHistory, NotificationType, AnalyzedFile } from '../types';
import { streamLegalChat } from '../services/gemini';
import { Zap, Loader2, Briefcase, Gavel, Users, Sparkles, HelpCircle, ExternalLink, Upload, FileText, X, LayoutDashboard, ShieldCheck, Scale } from 'lucide-react';
import { User } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatInterface: React.FC<{
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  analysisHistory?: AnalyzedDocumentHistory[];
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  user: User | null;
  onAuthRequired?: () => void;
}> = ({ messages, setMessages, analysisHistory = [], notify, user, onAuthRequired }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<AnalyzedFile[]>([]);
  const [focusMode, setFocusMode] = useState<'standard' | 'individual' | 'collective' | 'procedural'>('standard');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = async () => {
    if (!user) {
      notify("Debe iniciar sesión para usar el asistente.", "warning", "Acceso Restringido");
      if (onAuthRequired) onAuthRequired();
      return;
    }

    if ((!input.trim() && files.length === 0) || isLoading) return;
    if (files.length > 0 && !privacyAccepted) {
        notify("Debe aceptar el Aviso de Privacidad para analizar documentos", "warning", "Consentimiento Requerido");
        return;
    }
    
    setIsLoading(true);
    
    // Crear el mensaje del usuario. Si hay archivos, adjuntamos el primero (simplificado para la UI)
    const userMsg: ChatMessage = { 
        role: 'user', 
        text: input || "Solicito auditoría del documento adjunto.",
        attachment: files.length > 0 ? {
            type: 'file',
            mimeType: files[0].mimeType,
            data: files[0].fileBase64,
            name: files[0].fileName
        } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setFiles([]); // Limpiar archivos después de enviar
    setPrivacyAccepted(false);

    try {
      notify("Procesando consulta jurídica...", "info");
      setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);

      const idToken = user ? await user.getIdToken() : '';
      
      // Llamada al servicio (Asegúrate de que streamLegalChat soporte attachments)
      const result = await streamLegalChat(
        [...messages, userMsg], // Enviamos el historial + el nuevo mensaje
        currentInput, 
        true, 
        idToken,
        focusMode, 
        analysisHistory
      );
      const fullResponse = (result.response as any).text();
      
      setMessages(prev => {
        const newArr = [...prev];
        const lastMsg = newArr[newArr.length - 1];
        if (lastMsg.role === 'model') {
          lastMsg.text = fullResponse;
          lastMsg.isThinking = false;
        }
        return newArr;
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "";
      if (errorMsg.includes("429")) notify("Límite de frecuencia alcanzado.", "warning", "Servidor Saturado");
      else notify("Error técnico en la comunicación.", "error", "Fallo de Red");
      setMessages(prev => prev.filter(m => !m.isThinking || m.text !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Separar los mensajes en los que ya ocurrieron y el "nuevo" que se va a enviar
  const pastMessages = messages.filter(m => m.text !== 'Sistema Lex Laboral activo. Estoy a su disposición para brindarle asesoría técnica estratégica en materia de Derecho Laboral Mexicano, Seguridad Social y Relaciones Colectivas. ¿En qué puedo asistirle en esta sesión?');

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 no-print">
      <div className="max-w-6xl mx-auto p-8 md:p-12">
        {/* Encabezado Formal (Extraído de DocumentAnalyzer) */}
        <header className="mb-12 flex flex-wrap justify-between items-end gap-6 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-white rounded-2xl shadow-premium border border-slate-100">
               <LayoutDashboard className="text-legal-gold" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-serif font-bold text-legal-950 tracking-tight">Consulta y Análisis Jurídico</h2>
              </div>
              <p className="text-slate-500 text-sm mt-1 font-medium italic">Diagnóstico exhaustivo, análisis documental y orientación normativa en materia laboral.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200/50 shadow-sm">
            {[
              { id: 'standard', label: 'General', icon: <Sparkles size={14} /> },
              { id: 'individual', label: 'Individual', icon: <Briefcase size={14} /> },
              { id: 'collective', label: 'Colectivo', icon: <Users size={14} /> },
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setFocusMode(mode.id as any)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${focusMode === mode.id ? 'bg-slate-100 text-legal-950 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {mode.icon} <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Historial de Dictámenes (Resultados Anteriores) */}
        {pastMessages.length > 0 ? (
          <div className="space-y-8 mb-12">
            {pastMessages.map((msg, idx) => (
              <div key={idx} className="animate-fade-in-up">
                 {msg.role === 'user' ? (
                     <div className="bg-slate-100 p-5 rounded-t-2xl border-b border-slate-200/60 font-medium text-[13px] text-slate-700 flex items-start gap-3">
                         <div className="p-1.5 bg-slate-200 rounded-lg shrink-0 mt-0.5"><Briefcase size={14} className="text-slate-600"/></div>
                         <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Consulta Solicitada:</span>
                            {msg.text}
                            {msg.attachment && (
                                <div className="mt-2 text-xs text-legal-600 font-bold bg-white px-3 py-1.5 rounded-lg inline-flex items-center gap-2 border border-slate-200">
                                    <FileText size={14}/> Documento Adjunto: {msg.attachment.name}
                                </div>
                            )}
                         </div>
                     </div>
                 ) : (
                    <div className="bg-white p-8 rounded-b-2xl shadow-premium border border-slate-200/60 text-[14px] leading-relaxed text-slate-800">
                        {msg.isThinking ? (
                          <div className="flex items-center gap-3 text-legal-gold">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="font-serif italic text-base">Generando Dictamen Técnico...</span>
                          </div>
                        ) : (
                            <div className="prose prose-slate max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-serif font-bold text-legal-950 mt-6 mb-3 pb-2 border-b border-slate-200" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-serif font-bold text-legal-950 mt-5 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold text-legal-900 mt-4 mb-1.5" {...props} />,
                                p: ({node, ...props}) => <p className="text-[14px] leading-relaxed text-slate-700 mb-3" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-legal-950" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-slate-600" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4" {...props} />,
                                li: ({node, ...props}) => <li className="text-[14px] text-slate-700 leading-relaxed" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-legal-gold/50 pl-4 py-2 my-4 bg-legal-gold/5 rounded-r-xl italic text-slate-600 text-[13px]" {...props} />,
                                code: ({node, inline, ...props}: any) => inline
                                  ? <code className="bg-slate-100 text-legal-900 px-1.5 py-0.5 rounded text-[12px] font-mono" {...props} />
                                  : <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[12px] overflow-x-auto my-4 font-mono"><code {...props} /></pre>,
                                table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-[13px] border-collapse" {...props} /></div>,
                                thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                                th: ({node, ...props}) => <th className="text-left px-4 py-2.5 font-bold text-legal-950 border border-slate-200 text-[12px] uppercase tracking-wide" {...props} />,
                                td: ({node, ...props}) => <td className="px-4 py-2.5 border border-slate-200 text-slate-700" {...props} />,
                                tr: ({node, ...props}) => <tr className="even:bg-slate-50" {...props} />,
                                a: ({node, ...props}) => <a className="text-legal-gold hover:text-legal-gold/80 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                                hr: ({node, ...props}) => <hr className="border-slate-200 my-6" {...props} />,
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                            </div>
                        )}
                    </div>
                 )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { icon: <Briefcase className="text-legal-gold" size={18} />, text: "¿Cómo se calcula mi finiquito?" },
              { icon: <Scale className="text-legal-gold" size={18} />, text: "¿Cuáles son mis días de vacaciones?" },
              { icon: <Gavel className="text-legal-gold" size={18} />, text: "Analizar irregularidades en contrato." }
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s.text)}
                className="bg-white border border-slate-200 p-6 rounded-[2rem] text-left hover:border-legal-gold/40 hover:shadow-lg transition-all group"
              >
                <div className="mb-4 p-3 bg-slate-50 rounded-2xl w-fit group-hover:bg-legal-gold/5 transition-colors">{s.icon}</div>
                <p className="text-[13px] font-bold text-legal-950 leading-relaxed">{s.text}</p>
              </button>
            ))}
          </div>
        )}

        {/* Nueva Consulta / Carga de Documentos (Zona Activa) */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-premium">
          <h3 className="text-[12px] font-bold text-legal-950 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Nueva Solicitud Técnica</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Carga de Archivos */}
            <div className="lg:col-span-5">
               <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center relative hover:border-legal-gold/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center">
                  <input type="file" onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="p-4 bg-white rounded-2xl w-fit mx-auto mb-4 shadow-sm">
                     <Upload className="text-legal-gold" size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-legal-950 mb-1">Añadir Expediente</h4>
                  <p className="text-[11px] text-slate-500">Documento PDF o Imagen (Opcional)</p>
                  
                  {files.length > 0 && (
                      <div className="mt-6 w-full relative z-20">
                         {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-[11px] text-left shadow-sm">
                            <span className="truncate max-w-[150px] font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={14} className="text-slate-400"/> {f.fileName}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i))}} className="text-slate-300 hover:text-red-500 p-1"><X size={14}/></button>
                          </div>
                        ))}
                      </div>
                  )}
               </div>
            </div>

            {/* Instrucción y Envío */}
            <div className="lg:col-span-7 space-y-5 flex flex-col">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describa el contexto laboral, formule su consulta específica o indique las instrucciones para analizar el documento adjunto..."
                className="w-full flex-1 min-h-[140px] p-6 bg-slate-50 border border-slate-200 rounded-3xl text-[14px] outline-none focus:ring-4 ring-legal-gold/5 focus:border-legal-gold transition-all shadow-inner-soft leading-relaxed resize-none"
              />
              
              {files.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <input
                      type="checkbox"
                      id="privacy-consent"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-legal-gold cursor-pointer"
                    />
                    <label htmlFor="privacy-consent" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer select-none">
                      Confirmo que el documento no contiene datos sensibles. Autorizo el análisis automatizado.
                    </label>
                  </div>
              )}

              <button 
                onClick={handleSend} 
                disabled={isLoading || (!input.trim() && files.length === 0) || (files.length > 0 && !privacyAccepted)}
                className="w-full py-5 bg-legal-950 text-legal-gold rounded-2xl font-bold shadow-xl shadow-legal-950/20 hover:bg-legal-900 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Evaluando...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Ejecutar Análisis Técnico</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
