
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
    { id: AppView.DRAFTING, label: 'Redacción Documental', icon: <PenTool size={18} /> },
    { id: AppView.CALCULATOR, label: 'Calculadora Laboral', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'Seguridad Social', icon: <ShieldCheck size={18} /> },
  ];

  const prefetchModule = (view: AppView) => {
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
      return;
    }
    onChangeView(viewId);
  };

  return (
    <div className="w-72 bg-legal-950 text-white flex flex-col h-full border-r border-white/5 flex-shrink-0 z-50 relative shadow-2xl no-print">
      {/* Header & New Session */}
      <div className="p-6 pb-2 space-y-6">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-serif font-bold text-lg tracking-tight text-white">Lex Laboral</h1>
        </div>

        {!isGuest && (
          <button 
              onClick={onNewCase}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-slate-100 py-3.5 rounded-xl text-xs font-bold transition-all border border-white/5 hover:border-white/10 shadow-lg active:scale-[0.98] group"
          >
              <Zap size={14} className="text-legal-gold group-hover:scale-110 transition-transform" />
              <span>Nueva Sesión</span>
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="px-4 flex-1 overflow-y-auto custom-scrollbar mt-2">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2">Herramientas</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isRestricted = isGuest && (item.id === AppView.CHAT || item.id === AppView.DRAFTING);
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => !isRestricted && prefetchModule(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group ${
                    currentView === item.id
                      ? 'bg-white/10 text-legal-gold border border-white/5'
                      : isRestricted
                        ? 'text-slate-600 cursor-not-allowed opacity-70'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={currentView === item.id ? 'text-legal-gold' : isRestricted ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-300'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {currentView === item.id && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
                  {isRestricted && <Shield size={12} className="text-slate-700" />}
                </button>
              </li>
            );
          })}
        </ul>

        {sessions.length > 0 && (
          <div className="mt-8">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={12} /> Recientes
            </p>
            <ul className="space-y-0.5">
              {sessions.slice(0, 5).map(session => (
                <li key={session.id}>
                  <button
                    onClick={() => {
                      if (onSelectSession) onSelectSession(session.id);
                      onChangeView(AppView.CHAT);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-[12px] transition-all truncate ${
                      currentSessionId === session.id && currentView === AppView.CHAT
                        ? 'bg-legal-gold/5 text-legal-gold font-medium'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {session.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        {!isGuest ? (
          <div className="flex flex-col gap-3">
             {/* User Info & Actions */}
             <div className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border border-white/10">
                    {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={16} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{user?.email?.split('@')[0]}</p>
                    <div className="flex items-center mt-0.5">
                      {isPremium ? (
                        <span className="text-[9px] font-bold text-legal-gold bg-legal-gold/10 px-1.5 py-px rounded flex items-center gap-1">
                           <Crown size={8} /> PREMIUM
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-px rounded">GRATUITO</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {!isPremium && (
                    <button 
                      onClick={handleUpgrade}
                      className="col-span-2 bg-legal-gold/20 hover:bg-legal-gold/30 text-legal-gold text-[10px] font-bold py-1.5 rounded-lg border border-legal-gold/20 transition-all text-center"
                    >
                      Mejorar Plan
                    </button>
                  )}
                  <button 
                    onClick={onLogout}
                    className="col-span-2 flex items-center justify-center space-x-1.5 text-slate-500 hover:text-slate-300 py-1.5 hover:bg-white/5 rounded-lg transition-all"
                  >
                    <LogOut size={12} />
                    <span className="text-[10px] font-bold">Salir</span>
                  </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-legal-gold/10 rounded-xl p-4 border border-legal-gold/20 mb-2">
            <p className="text-[10px] text-legal-gold mb-2 text-center">Modo Invitado</p>
            <button 
              onClick={onLogout} 
              className="w-full bg-legal-gold text-black text-xs font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        )}
        
        {/* Minimal Footer Links */}
        <div className="flex items-center justify-between px-1 mt-3 opacity-60">
            <button className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors">Soporte</button>
            <span className="text-slate-700 text-[9px]">•</span>
            <button 
              onClick={() => onChangeView(AppView.PRIVACY)}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacidad
            </button>
            <span className="text-slate-700 text-[9px]">•</span>
            <button 
              onClick={() => onChangeView(AppView.TERMS)}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Términos
            </button>
        </div>
      </div>
    </div>
  );
};
