
import React from 'react';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight } from 'lucide-react';

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
        <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
          Herramientas jurídicas especializadas para el cálculo laboral y redacción documental automatizada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <button
          onClick={() => onNavigate(AppView.CALCULATOR)}
          className="group relative flex flex-col p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-legal-gold/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-legal-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Calculator size={32} />
          </div>
          
          <div className="text-left">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Calculadora Laboral</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Calcula finiquitos, liquidaciones, ISR y prestaciones de ley con precisión profesional.
            </p>
            <div className="flex items-center text-blue-600 font-bold text-sm">
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
          
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <FileText size={32} />
          </div>
          
          <div className="text-left">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Redacción Documental</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Genera contratos, convenios y documentos legales personalizados mediante IA.
            </p>
            <div className="flex items-center text-amber-600 font-bold text-sm">
              <span>Generar documento</span>
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      <div className="mt-16 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Soporte Técnico: contacto@lexlaboral.com
        </p>
      </div>
    </div>
  );
};
