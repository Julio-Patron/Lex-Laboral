
import React from 'react';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  user?: SupabaseUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onLogin, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-legal-950 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10 overflow-hidden">
          <img src="/assets/logo.webp" alt="Lex Laboral Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4 tracking-tight">
          Lex Laboral
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
          Herramientas jurídicas especializadas para el cálculo laboral y redacción documental automatizada.
        </p>

        {/* Auth Section — integrated below the description */}
        <div className="mt-6">
          {user ? (
            <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-legal-gold to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {user.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-slate-600 max-w-[200px] truncate">
                {user.email}
              </span>
              <div className="w-px h-5 bg-slate-200" />
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={14} />
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-legal-dark to-legal-950 text-white px-7 py-3.5 rounded-2xl shadow-lg shadow-legal-gold/20 hover:shadow-xl hover:shadow-legal-gold/30 hover:-translate-y-0.5 transition-all duration-300 font-bold text-sm border border-white/10"
            >
              <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <button
          onClick={() => onNavigate(AppView.CALCULATOR)}
          className="group relative flex flex-col p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-legal-gold/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-legal-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
            <Calculator size={28} />
          </div>
          
          <div className="text-left relative z-10">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cálculo de Prestaciones</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Calcula finiquitos, liquidaciones, ISR y prestaciones de ley con precisión profesional.
            </p>
            <div className="flex items-center text-blue-600 font-bold text-xs uppercase tracking-widest">
              <span>Empezar cálculo</span>
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate(AppView.DRAFTING)}
          className="group relative flex flex-col p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-legal-gold/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-legal-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
            <FileText size={28} />
          </div>
          
          <div className="text-left relative z-10">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Generador de Documentos</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Genera contratos, convenios y documentos legales personalizados mediante IA.
            </p>
            <div className="flex items-center text-amber-600 font-bold text-xs uppercase tracking-widest">
              <span>Generar documento</span>
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate(AppView.SOCIAL_SECURITY)}
          className="group relative flex flex-col p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-legal-gold/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 relative z-10">
            <ShieldCheck size={28} />
          </div>
          
          <div className="text-left relative z-10">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cuotas IMSS</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Calcula cuotas obrero-patronales y determina la prima de riesgo.
            </p>
            <div className="flex items-center text-emerald-600 font-bold text-xs uppercase tracking-widest">
              <span>Calcular cuotas</span>
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      <footer className="mt-20 w-full max-w-6xl pt-8 border-t border-slate-100 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center overflow-hidden">
              <img src="/assets/logo.webp" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">Lex Laboral © 2026</span>
          </div>

          <div className="flex items-center space-x-8">
            <button 
              onClick={() => onNavigate(AppView.TERMS)}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Términos
            </button>
            <button 
              onClick={() => onNavigate(AppView.PRIVACY)}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Privacidad
            </button>
            <a 
              href="mailto:admin@lexlaboral.com.mx"
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Soporte
            </a>
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            Desarrollado con precisión por <span className="text-slate-900 font-bold">filex dev</span> • Mérida, Yucatán
          </p>
        </div>
      </footer>
    </div>
  );
};
