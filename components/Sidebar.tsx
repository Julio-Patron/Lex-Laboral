
import { motion } from 'framer-motion';
import {
    BookOpen,
    Calculator,
    ChevronRight,
    FileText,
    Home,
    PanelLeftClose,
    PanelLeftOpen,
    Scale,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewCase: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar = React.memo<SidebarProps>(({ currentView, onChangeView, isCollapsed = false, onToggleCollapse }) => {
  const navItems = [
    { id: AppView.HOME, label: 'Inicio', icon: <Home size={18} /> },
    { id: AppView.CALCULATOR, label: 'Liquidación y Finiquito', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'IMSS e INFONAVIT', icon: <ShieldCheck size={18} /> },
    { id: AppView.PENSION_CALCULATOR, label: 'Calculadora de Pensiones', icon: <Calculator size={18} /> },
    { id: AppView.CONSULTAS, label: 'Fundamentador Jurídico', icon: <BookOpen size={18} /> },
  ];

  const handleNavClick = (viewId: AppView) => {
    onChangeView(viewId);
  };

  return (
    <aside
      className={`no-print relative z-50 flex h-full w-[min(18rem,86vw)] flex-shrink-0 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-[width] duration-300 ease-out ${
        isCollapsed ? 'md:w-20' : 'md:w-72'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-white/10 py-5 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex gap-2 ${isCollapsed ? 'items-center justify-center md:flex-col' : 'items-center justify-between'}`}>
          <button
            type="button"
            className={`group flex min-w-0 items-center rounded-lg p-2 text-left transition-colors hover:bg-white/[0.04] ${
              isCollapsed ? 'justify-center' : 'flex-1 gap-3'
            }`}
            onClick={() => onChangeView(AppView.HOME)}
            title="Inicio"
          >
            <img src="/assets/logo.webp" alt="Lex Laboral" className="h-10 w-10 shrink-0 object-contain opacity-95 transition-opacity group-hover:opacity-100" loading="lazy" />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate font-serif text-lg font-bold leading-tight text-white">Lex Laboral</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Herramientas</p>
              </div>
            )}
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
              title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white md:inline-flex"
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className={`custom-scrollbar mt-2 flex-1 overflow-y-auto py-3 ${isCollapsed ? 'px-2' : 'px-3'}`}>
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
                  title={item.label}
                  className={`group flex w-full min-w-0 items-center rounded-lg py-3 text-left text-[13px] font-semibold leading-5 transition-all ${
                    isActive
                      ? 'border border-white/10 bg-white/[0.09] text-legal-gold shadow-[inset_3px_0_0_rgba(212,175,55,0.95)]'
                      : 'border border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : 'justify-between gap-3 px-3'}`}
                >
                  <span className={`flex min-w-0 items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <span className={`shrink-0 transition-colors ${isActive ? 'text-legal-gold' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {item.icon}
                    </span>
                    <span className={isCollapsed ? 'sr-only' : 'min-w-0 break-words'}>{item.label}</span>
                  </span>
                  {isActive && !isCollapsed && <ChevronRight size={14} className="shrink-0 animate-in fade-in slide-in-from-left-2 duration-300" />}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Links */}
      <div className={`mt-auto border-t border-white/10 bg-black/20 p-4 ${isCollapsed ? 'md:px-3' : ''}`}>
        <div className={`flex items-center gap-3 px-1 ${isCollapsed ? 'md:flex-col md:justify-center' : 'justify-between'}`}>
            <button 
              onClick={() => onChangeView(AppView.PRIVACY)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
              title="Privacidad"
            >
              <Shield size={15} />
              <span className={isCollapsed ? 'md:sr-only' : ''}>Privacidad</span>
            </button>
            {!isCollapsed && <span className="text-slate-700 text-xs">•</span>}
            <button 
              onClick={() => onChangeView(AppView.TERMS)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
              title="Términos"
            >
              <FileText size={15} />
              <span className={isCollapsed ? 'md:sr-only' : ''}>Términos</span>
            </button>
            {!isCollapsed && <span className="text-slate-700 text-xs">•</span>}
            <button 
              onClick={() => onChangeView(AppView.SOURCES)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 transition-colors hover:text-amber-300"
              title="Fuentes Oficiales"
            >
              <Scale size={15} />
              <span className={isCollapsed ? 'md:sr-only' : ''}>Fuentes</span>
            </button>
        </div>
      </div>
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
export default Sidebar;
