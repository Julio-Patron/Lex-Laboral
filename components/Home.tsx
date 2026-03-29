
import React from 'react';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
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

      <div className="mt-16 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Soporte Técnico: contacto@lexlaboral.com
        </p>
      </div>
    </div>
  );
};
