
import React from 'react';
import { AppView } from '../types';
import { Scale, MessageSquare, FileText, PenTool, Zap, Shield, ChevronRight, Calculator, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewCase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onNewCase }) => {
  const navItems = [
    { id: AppView.CHAT, label: 'Asesoría Legal', icon: <MessageSquare size={18} /> },
    { id: AppView.DOCUMENT_ANALYSIS, label: 'Auditoría Integral', icon: <FileText size={18} /> },
    { id: AppView.DRAFTING, label: 'Ingeniería Jurídica', icon: <PenTool size={18} /> },
    { id: AppView.CALCULATOR, label: 'Simulador LFT', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'Seguridad Social', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="w-72 bg-legal-950 text-white flex flex-col h-full border-r border-white/5 flex-shrink-0 z-50 relative overflow-hidden shadow-2xl no-print">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="p-8 pt-10 relative">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-legal-gold to-legal-goldhover rounded-xl shadow-lg shadow-legal-gold/20 flex items-center justify-center">
            <Scale className="text-legal-950" size={24} />
          </div>
          <h1 className="font-serif font-bold text-xl tracking-tight text-white">LexLaboral</h1>
        </div>
      </div>
      
      <nav className="mt-8 px-4 flex-1">
        <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Capacidades</p>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[13px] font-semibold transition-all group ${
                  currentView === item.id
                    ? 'bg-white/10 text-legal-gold shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className={currentView === item.id ? 'text-legal-gold' : 'text-slate-500 group-hover:text-slate-300'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {currentView === item.id && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 mt-auto space-y-4 border-t border-white/5 bg-black/10">
        <button 
            onClick={onNewCase}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-4 rounded-2xl text-xs font-bold transition-all border border-slate-700 active:scale-[0.98] shadow-lg"
        >
            <Zap size={14} className="text-legal-gold" />
            <span>Nueva Sesión</span>
        </button>
        
        <div className="flex items-center justify-center gap-2.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold py-2">
           <Shield size={10} className="text-emerald-500/80" />
           <span>Seguridad Encriptada</span>
        </div>
      </div>
    </div>
  );
};
