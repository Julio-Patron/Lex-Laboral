
import React from 'react';
import { AppView, ChatSession } from '../types';
import { 
  Scale, 
  MessageSquare, 
  FileText, 
  PenTool, 
  Zap, 
  Shield, 
  ChevronRight, 
  Calculator, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon,
  Crown,
  Clock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { createCheckoutSession, redirectToCheckout } from '../services/stripe';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewCase: () => void;
  onLogout: () => void;
  user: User | null;
  userData?: any;
  isPremium: boolean;
  isGuest: boolean;
  notify?: (m: string, t?: any, tit?: string) => void;
  onOpenPricing?: (plan: 'audit' | 'draft_basic' | 'draft_custom' | '3-months') => void;
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onNewCase, onLogout, user, userData, isPremium, isGuest, notify, onOpenPricing, sessions = [], currentSessionId, onSelectSession }) => {
  const handleUpgrade = async () => {
    if (onOpenPricing) {
      onOpenPricing('3-months');
      return;
    }
    // Fallback if prop not provided
    if (!user) return;
    try {
      if (notify) notify("Iniciando proceso de pago seguro...", "info", "Stripe Checkout");
      const { id: sessionId } = await createCheckoutSession(user.email || '', user.uid, '3-months'); 
      await redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Stripe error:', error);
      if (notify) notify("No se pudo iniciar el proceso de pago.", "error", "Error de Conexión");
    }
  };

  const navItems = [
    { id: AppView.CHAT, label: 'Consulta y Análisis Jurídico', icon: <MessageSquare size={18} /> },
    { id: AppView.DRAFTING, label: 'Ingeniería Jurídica', icon: <PenTool size={18} /> },
    { id: AppView.CALCULATOR, label: 'Cálculo Liquidación', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'Seguridad Social', icon: <ShieldCheck size={18} /> },
  ];

  const prefetchModule = (view: AppView) => {
    // Webpack / Vite can prefetch dynamic imports if we call them silently
    switch (view) {
      case AppView.CHAT: import('./ChatInterface'); break;
      case AppView.DRAFTING: import('./Drafter'); break;
      case AppView.CALCULATOR: import('./LaborCalculator'); break;
      case AppView.SOCIAL_SECURITY: import('./SocialSecurityCalculator'); break;
    }
  };

  const handleNavClick = (viewId: AppView) => {
    if (isGuest && (viewId === AppView.CHAT || viewId === AppView.DRAFTING)) {
      if (notify) notify("Debe iniciar sesión para usar las herramientas de IA", "warning", "Acceso Restringido");
      // Trigger login modal logic if provided or just block
      return;
    }
    onChangeView(viewId);
  };

  return (
    <div className="w-72 bg-legal-950 text-white flex flex-col h-full border-r border-white/5 flex-shrink-0 z-50 relative shadow-2xl no-print">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="p-8 pt-10 relative">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-black/20 border border-white/5 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-serif font-bold text-xl tracking-tight text-white">Lex Laboral</h1>
        </div>
      </div>
      
      <nav className="mt-4 px-4 flex-1 overflow-y-auto custom-scrollbar">
        <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Capacidades</p>
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isRestricted = isGuest && (item.id === AppView.CHAT || item.id === AppView.DRAFTING);
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => !isRestricted && prefetchModule(item.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-semibold transition-all group ${
                    currentView === item.id
                      ? 'bg-white/10 text-legal-gold shadow-inner'
                      : isRestricted
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={currentView === item.id ? 'text-legal-gold' : isRestricted ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-300'}>
                      {item.icon}
                    </span>
                    <span className={isRestricted ? 'opacity-50' : ''}>{item.label}</span>
                  </div>
                  {currentView === item.id && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
                  {isRestricted && <Shield size={12} className="text-slate-700" />}
                </button>
              </li>
            );
          })}
        </ul>

        {sessions.length > 0 && (
          <div className="mt-8 mb-4">
            <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={12} /> Expedientes Recientes
            </p>
            <ul className="space-y-1">
              {sessions.slice(0, 5).map(session => (
                <li key={session.id}>
                  <button
                    onClick={() => {
                      if (onSelectSession) onSelectSession(session.id);
                      onChangeView(AppView.CHAT);
                    }}
                    className={`w-full text-left px-5 py-2.5 rounded-xl text-[12px] transition-all truncate ${
                      currentSessionId === session.id && currentView === AppView.CHAT
                        ? 'bg-legal-gold/10 text-legal-gold font-bold border border-legal-gold/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    {session.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 mb-6 px-5 space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Información Legal</p>
          <button className="block text-[11px] font-bold text-slate-400 hover:text-legal-gold transition-colors text-left uppercase tracking-tighter">
            Términos y Condiciones
          </button>
          <button className="block text-[11px] font-bold text-slate-400 hover:text-legal-gold transition-colors text-left uppercase tracking-tighter">
            Aviso de Privacidad
          </button>
        </div>
      </nav>

      <div className="p-6 mt-auto space-y-4 border-t border-white/5 bg-black/10">
        {!isGuest && (
          <div className="bg-white/5 rounded-2xl p-4 mb-2 flex flex-col gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
                {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={18} className="text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user?.email?.split('@')[0]}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  {isPremium ? (
                    <span className="flex items-center text-[9px] font-bold text-legal-gold uppercase tracking-tighter bg-legal-gold/10 px-1.5 py-0.5 rounded leading-none">
                      <Crown size={8} className="mr-0.5" /> PLAN TRIMESTRAL
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded leading-none border border-slate-700">
                      PLAN GRATUITO
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!isPremium && (
              <button 
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-legal-gold/20 to-legal-gold/10 hover:from-legal-gold/30 hover:to-legal-gold/20 text-legal-gold text-[10px] font-extrabold uppercase tracking-widest py-2 rounded-lg border border-legal-gold/20 transition-all active:scale-95 mt-1"
              >
                Adquirir Licencia
              </button>
            )}

            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-white transition-colors py-1.5 mt-1"
            >
              <LogOut size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cerrar Sesión</span>
            </button>
          </div>
        )}

        <button 
            onClick={onNewCase}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-4 rounded-2xl text-xs font-bold transition-all border border-slate-700 active:scale-[0.98] shadow-lg"
        >
            <Zap size={14} className="text-legal-gold" />
            <span>Nueva Sesión</span>
        </button>
        
        <div className="bg-white/5 rounded-2xl p-5 mt-2 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Soporte Técnico</p>
          <div className="space-y-4">
            <a 
              href="mailto:admin@lexlaboral.com.mx" 
              className="flex items-center space-x-3 text-slate-400 hover:text-white transition-all group bg-white/0 hover:bg-legal-gold/10 p-2.5 rounded-xl border border-transparent hover:border-legal-gold/20"
            >
              <div className="w-9 h-9 rounded-lg bg-legal-gold/10 flex items-center justify-center group-hover:bg-legal-gold/20 transition-all shadow-sm">
                <FileText size={16} className="text-legal-gold" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider">Email Soporte</span>
                <span className="text-[9px] text-slate-500 group-hover:text-legal-gold transition-colors">Respuesta en 24h</span>
              </div>
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold py-2">
           <Shield size={10} className="text-emerald-500/80" />
           <span>Seguridad Encriptada</span>
        </div>
      </div>
    </div>
  );
};
