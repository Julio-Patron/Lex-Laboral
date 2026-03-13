
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalyzedDocumentHistory, NotificationType } from '../types';
import { streamLegalChat } from '../services/gemini';
import { Send, Loader2, Briefcase, Gavel, Users, Sparkles, HelpCircle, ExternalLink } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

export const ChatInterface: React.FC<{
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  analysisHistory?: AnalyzedDocumentHistory[];
  notify: (m: string, t?: NotificationType, tit?: string) => void;
}> = ({ messages, setMessages, analysisHistory = [], notify }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusMode, setFocusMode] = useState<'standard' | 'individual' | 'collective' | 'procedural'>('standard');
  const [groundingSources, setGroundingSources] = useState<{title: string, uri: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    setIsLoading(true);
    setGroundingSources([]);
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      notify("Procesando consulta jurídica...", "info");
      
      setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);

      const result = await streamLegalChat(messages, userMessage, true, focusMode, analysisHistory);
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
    } catch (error: any) {
      const errorMsg = error?.message || "";
      if (errorMsg.includes("429")) notify("Límite de frecuencia alcanzado.", "warning", "Servidor Saturado");
      else if (errorMsg.includes("SAFETY")) notify("Consulta bloqueada por política de seguridad.", "info", "Aviso de Contenido");
      else notify("Error técnico en la comunicación.", "error", "Fallo de Red");
      
      setMessages(prev => prev.filter(m => !m.isThinking || m.text !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="glass-panel border-b border-slate-200/60 px-8 py-6 flex flex-wrap justify-between items-center z-20 gap-4 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-legal-950 rounded-2xl flex items-center justify-center shadow-xl shadow-legal-950/10 border border-white/10">
            <Sparkles className="text-legal-gold" size={22} />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-serif font-bold text-legal-950 tracking-tight">Asesoría Legal</h2>
            <div className="relative group/help">
              <HelpCircle size={16} className="text-slate-300 cursor-help hover:text-legal-gold transition-colors" />
              <div className="absolute left-0 top-full mt-3 w-80 p-5 bg-white border border-slate-200 shadow-2xl rounded-3xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none border-t-4 border-t-legal-gold">
                <p className="text-[11px] font-bold text-legal-950 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Protocolo de Asesoría Laboral</p>
                <ul className="space-y-3 text-[12px] leading-relaxed text-slate-600">
                  <li className="flex gap-3"><span className="text-legal-gold font-bold">I.</span><span>Orientación normativa en materia de LFT, Seguridad Social y Derecho Procesal.</span></li>
                  <li className="flex gap-3"><span className="text-legal-gold font-bold">II.</span><span>Fundamentación mediante búsqueda en tiempo real de leyes vigentes y jurisprudencia.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          {[
            { id: 'standard', label: 'General', icon: <Sparkles size={14} /> },
            { id: 'individual', label: 'Individual', icon: <Briefcase size={14} /> },
            { id: 'collective', label: 'Colectivo', icon: <Users size={14} /> },
            { id: 'procedural', label: 'Procesal', icon: <Gavel size={14} /> }
          ].map(mode => (
            <button 
              key={mode.id}
              onClick={() => setFocusMode(mode.id as any)}
              className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-[11px] font-bold transition-all ${focusMode === mode.id ? 'bg-white text-legal-950 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {mode.icon} <span className="hidden lg:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 space-y-12 scrollbar-hide bg-slate-50/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-7 rounded-[2rem] text-[15px] leading-relaxed shadow-premium border ${
                msg.role === 'user' 
                  ? 'bg-white border-slate-200/60 text-slate-800 rounded-tr-none' 
                  : 'bg-legal-950 text-slate-100 border-legal-900 rounded-tl-none'
              }`}>
                {msg.isThinking ? (
                  <div className="flex items-center space-x-3 text-legal-gold">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="font-serif italic text-sm tracking-wide">Analizando normativa vigente...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-sans opacity-95 selection:bg-legal-gold selection:text-legal-950">{msg.text}</div>
                )}
                
                {msg.role === 'model' && groundingSources.length > 0 && idx === messages.length - 1 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-bold text-legal-gold uppercase tracking-[0.2em] mb-4 flex items-center">
                      <ExternalLink size={14} className="mr-2" /> Fundamentación Normativa
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {groundingSources.map((source, sIdx) => (
                        <a key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white/5 hover:bg-white/15 px-4 py-2 rounded-xl border border-white/5 text-slate-300 transition-all hover:-translate-y-0.5 shadow-sm">
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mx-6">
                {msg.role === 'user' ? 'Consulta' : 'Dictamen Técnico'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.03)] z-10">
        <div className="max-w-5xl mx-auto relative">
          <div className="relative flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Describa su consulta técnica..."
              className="flex-1 p-6 rounded-3xl border border-slate-200 bg-slate-50/50 text-sm outline-none focus:ring-4 focus:ring-legal-gold/5 focus:border-legal-gold transition-all resize-none h-[80px] shadow-inner-soft"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="w-20 h-20 bg-legal-950 text-legal-gold rounded-3xl hover:bg-legal-900 hover:shadow-2xl hover:-translate-y-0.5 transition-all shadow-xl shadow-legal-950/20 active:scale-95 disabled:opacity-30 disabled:translate-y-0 flex items-center justify-center group"
            >
              <Send size={28} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <p className="text-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Enter para procesar consulta estratégica
          </p>
        </div>
      </div>
    </div>
  );
};
