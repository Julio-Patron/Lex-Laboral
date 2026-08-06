
import React from 'react';
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
    <div className="w-72 bg-legal-950 text-white flex flex-col h-full border-r border-white/5 flex-shrink-0 z-50 relative shadow-2xl no-print">
      {/* Header */}
      <div className="p-6 pb-2 space-y-6">
        <div 
          className="flex items-center justify-center px-6 py-8 cursor-pointer group"
          onClick={() => onChangeView(AppView.HOME)}
        >
          <img src="/assets/logo.webp" alt="Lex Laboral" className="w-44 h-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_15px_rgba(212,175,55,0.15)]" loading="lazy" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="px-4 flex-1 overflow-y-auto custom-scrollbar mt-4">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Herramientas</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group ${
                    currentView === item.id
                      ? 'bg-white/10 text-legal-gold border border-white/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={currentView === item.id ? 'text-legal-gold' : 'text-slate-400 group-hover:text-slate-300'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {currentView === item.id && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Links */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between px-1 opacity-60">
            <button 
              onClick={() => onChangeView(AppView.PRIVACY)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Privacidad
            </button>
            <span className="text-slate-700 text-xs">•</span>
            <button 
              onClick={() => onChangeView(AppView.TERMS)}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Términos
            </button>
        </div>
      </div>
    </div>
  );
});
Sidebar.displayName = 'Sidebar';
export default Sidebar;
