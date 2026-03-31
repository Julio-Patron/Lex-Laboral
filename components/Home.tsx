
import React from 'react';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getPathForView } from '../lib/routes';
import { SEOContentSection } from './SEOContentSection';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  user?: SupabaseUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onLogin, onLogout }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

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
        <a
          href={getPathForView(AppView.CALCULATOR)}
          onClick={(event) => handleNavClick(event, AppView.CALCULATOR)}
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
        </a>

        <a
          href={getPathForView(AppView.DRAFTING)}
          onClick={(event) => handleNavClick(event, AppView.DRAFTING)}
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
        </a>

        <a
          href={getPathForView(AppView.SOCIAL_SECURITY)}
          onClick={(event) => handleNavClick(event, AppView.SOCIAL_SECURITY)}
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
        </a>
      </div>

      <section className="mt-16 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 px-1">
        <article className="bg-white border border-slate-100 rounded-[2rem] p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Calculadora de liquidación laboral</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Calcula finiquito, indemnización constitucional, prima de antigüedad, vacaciones, prima vacacional y aguinaldo proporcional con criterios aplicables en México.
          </p>
          <a
            href={getPathForView(AppView.CALCULATOR)}
            onClick={(event) => handleNavClick(event, AppView.CALCULATOR)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Ir a la calculadora
          </a>
        </article>

        <article className="bg-white border border-slate-100 rounded-[2rem] p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Generador de documentos legales</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Genera contratos individuales, convenios de terminación, cartas de renuncia, actas administrativas y otros borradores laborales con IA.
          </p>
          <a
            href={getPathForView(AppView.DRAFTING)}
            onClick={(event) => handleNavClick(event, AppView.DRAFTING)}
            className="text-sm font-bold text-amber-600 hover:text-amber-700"
          >
            Ir al generador
          </a>
        </article>

        <article className="bg-white border border-slate-100 rounded-[2rem] p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Calculadora IMSS e INFONAVIT</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Obtén el desglose de cuotas obrero-patronales y calcula la prima de riesgo de trabajo con parámetros ajustables para 2026.
          </p>
          <a
            href={getPathForView(AppView.SOCIAL_SECURITY)}
            onClick={(event) => handleNavClick(event, AppView.SOCIAL_SECURITY)}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            Ir a IMSS
          </a>
        </article>
      </section>

      <div className="w-full max-w-6xl">
        <SEOContentSection
          title="Herramientas jurídicas laborales para México"
          intro="Lex Laboral está orientado a búsquedas prácticas de usuarios que necesitan calcular liquidación, finiquito o cuotas IMSS, así como preparar un borrador documental laboral. La plataforma reúne una calculadora laboral gratuita para usuarios registrados, una calculadora IMSS para planes activos y un generador documental con acceso por plan o por documento suelto."
          highlights={[
            {
              title: 'Calculadora laboral',
              body: 'Pensada para consultas frecuentes como liquidación por despido injustificado, finiquito, prima de antigüedad, vacaciones y aguinaldo proporcional.',
            },
            {
              title: 'Calculadora IMSS',
              body: 'Enfocada en cuotas obrero-patronales, desglose por ramo de seguro y apoyo para revisar prima de riesgo e INFONAVIT.',
            },
            {
              title: 'Generador documental',
              body: 'Útil para construir borradores de documentos laborales frecuentes y partir de una base ordenada antes de la revisión jurídica final.',
            },
          ]}
          faqs={[
            {
              question: 'Lex Laboral sirve para calcular liquidacion y finiquito en Mexico?',
              answer: 'Sí. La plataforma incluye una calculadora de prestaciones laborales enfocada en escenarios frecuentes conforme a la normativa mexicana.',
            },
            {
              question: 'Que parte de la app es gratis?',
              answer: 'La calculadora laboral es gratuita para usuarios registrados. La calculadora IMSS y el generador de documentos dependen del plan activo o del documento suelto.',
            },
            {
              question: 'La plataforma esta dirigida a trabajadores o a abogados?',
              answer: 'A ambos. Puede ser útil para trabajadores que quieren una estimación inicial y para despachos o áreas de recursos humanos que necesitan una referencia operativa rápida.',
            },
          ]}
        />
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
            <a
              href={getPathForView(AppView.TERMS)}
              onClick={(event) => handleNavClick(event, AppView.TERMS)}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Términos
            </a>
            <a
              href={getPathForView(AppView.PRIVACY)}
              onClick={(event) => handleNavClick(event, AppView.PRIVACY)}
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Privacidad
            </a>
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
