
import React from 'react';
import { motion } from 'framer-motion';
import { AppView } from '../types';
import { 
  Calculator, 
  ShieldCheck, 
  Home,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewCase: () => void;
}

export const Sidebar = React.memo<SidebarProps>(({ currentView, onChangeView, onNewCase }) => {
  const navItems = [
    { id: AppView.HOME, label: 'Inicio', icon: <Home size={18} /> },
    { id: AppView.CALCULATOR, label: 'Liquidación y Finiquito', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'IMSS e INFONAVIT', icon: <ShieldCheck size={18} /> },
    { id: AppView.PENSION_CALCULATOR, label: 'Calculadora de Pensiones', icon: <Calculator size={18} /> },
    { id: AppView.CONSULTAS, label: 'Consultas Jurídicas', icon: <BookOpen size={18} /> },
  ];

  const handleNavClick = (viewId: AppView) => {
    onChangeView(viewId);
  };

  return (
    <aside className="no-print relative z-50 flex h-full w-[min(17rem,86vw)] flex-shrink-0 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl md:w-64">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-5">
        <button
          type="button"
          className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.04]"
          onClick={() => onChangeView(AppView.HOME)}
        >
          <img src="/assets/logo.webp" alt="Lex Laboral" className="h-12 w-12 shrink-0 object-contain opacity-95 transition-opacity group-hover:opacity-100" loading="lazy" />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-bold leading-tight text-white">Lex Laboral</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Herramientas</p>
          </div>
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="custom-scrollbar mt-2 flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <motion.button
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex w-full min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-[13px] font-semibold leading-5 transition-all ${
                    isActive
                      ? 'border border-white/10 bg-white/[0.09] text-legal-gold shadow-[inset_3px_0_0_rgba(212,175,55,0.95)]'
                      : 'border border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`shrink-0 transition-colors ${isActive ? 'text-legal-gold' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 break-words">{item.label}</span>
                  </span>
                  {isActive && <ChevronRight size={14} className="shrink-0 animate-in fade-in slide-in-from-left-2 duration-300" />}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Links */}
      <div className="mt-auto border-t border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3 px-1">
            <button 
              onClick={() => onChangeView(AppView.PRIVACY)}
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
            >
              Privacidad
            </button>
            <span className="text-slate-700 text-xs">•</span>
            <button 
              onClick={() => onChangeView(AppView.TERMS)}
              className="text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
            >
              Términos
            </button>
        </div>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
export default Sidebar;
