import React from 'react';
import { AppView } from '../types';
import { 
  Calculator, 
  ShieldCheck, 
  ChevronRight, 
  ArrowUpRight, 
  BookOpen, 
  Download, 
  Scale, 
  Smartphone,
  ExternalLink,
  Mail,
  Globe,
  ShieldAlert
} from 'lucide-react';
import { getPathForView } from '../lib/routes';
import { SEOContentSection } from './SEOContentSection';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

const tools = [
  {
    view: AppView.CALCULATOR,
    title: 'Liquidación y Finiquito',
    subtitle: 'Art. 48, 50, 162 LFT',
    summary: 'Indemnización constitucional de 90 días, 20 días por año, prima de antigüedad e retención de ISR.',
    action: 'Calcular Liquidación',
    badge: 'LFT 2026',
    icon: <Calculator size={20} className="text-amber-400" />,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'Cuotas IMSS e INFONAVIT',
    subtitle: 'Ramos de Seguro Social',
    summary: 'Desglose de aportaciones obrero-patronales por enfermedad, invalidez, retiro e INFONAVIT.',
    action: 'Calcular Cuotas',
    badge: 'IMSS 2026',
    icon: <ShieldCheck size={20} className="text-emerald-400" />,
  },
  {
    view: AppView.PENSION_CALCULATOR,
    title: 'Calculadora de Pensiones',
    subtitle: 'Ley 73 y Ley 97 IMSS',
    summary: 'Estimación mensual de pensión según semanas cotizadas, salario promedio y saldo de AFORE.',
    action: 'Estimar Pensión',
    badge: 'IMSS Ley 73/97',
    icon: <Scale size={20} className="text-blue-400" />,
  },
  {
    view: AppView.CONSULTAS,
    title: 'Fundamentador Jurídico',
    subtitle: 'LFT, IMSS e INFONAVIT',
    summary: 'Localiza artículos y arma un fundamento jurídico sugerido para el caso planteado.',
    action: 'Fundamentar Caso',
    badge: 'RAG Jurídico',
    icon: <BookOpen size={20} className="text-purple-400" />,
  },
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in font-sans bg-slate-950 text-slate-100 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-4 sm:px-8 py-3.5">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => handleNavClick(e, AppView.HOME)}
          >
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a 
              href={getPathForView(AppView.CALCULATOR)} 
              onClick={(e) => handleNavClick(e, AppView.CALCULATOR)}
              className="hover:text-amber-400 transition-colors"
            >
              Liquidación
            </a>
            <a 
              href={getPathForView(AppView.SOCIAL_SECURITY)} 
              onClick={(e) => handleNavClick(e, AppView.SOCIAL_SECURITY)}
              className="hover:text-amber-400 transition-colors"
            >
              Cuotas IMSS
            </a>
            <a 
              href={getPathForView(AppView.PENSION_CALCULATOR)} 
              onClick={(e) => handleNavClick(e, AppView.PENSION_CALCULATOR)}
              className="hover:text-amber-400 transition-colors"
            >
              Pensiones
            </a>
            <a 
              href={getPathForView(AppView.CONSULTAS)} 
              onClick={(e) => handleNavClick(e, AppView.CONSULTAS)}
              className="hover:text-amber-400 transition-colors"
            >
              Fundamentador
            </a>
            <a 
              href={getPathForView(AppView.SOURCES)} 
              onClick={(e) => handleNavClick(e, AppView.SOURCES)}
              className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
            >
              Fuentes Oficiales
            </a>
          </nav>

          <button
            onClick={(e) => handleNavClick(e, AppView.CALCULATOR)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calculator size={14} />
            <span>Calcular</span>
          </button>
        </div>
      </header>

      {/* Minimalist Hero Section */}
      <section className="relative py-16 sm:py-24 border-b border-slate-800/60 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_70%)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10 text-center">
          
          {/* Hero Brand Logo as Main Title */}
          <div className="max-w-[280px] sm:max-w-[420px] md:max-w-[480px] mx-auto mb-6 select-none">
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral" 
              className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
              loading="eager"
            />
          </div>

          <span className="inline-block font-mono text-[11px] font-semibold tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full mb-4">
            Calculadoras Jurídicas Laborales • México 2026
          </span>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Calculadoras laborales de estimación para liquidación por despido, cuotas obrero-patronales del IMSS e INFONAVIT y proyección de pensión. Herramienta privada e independiente, 100% gratuita y sin registro.
          </p>

        </div>
      </section>

      {/* Prominent Government Disclaimer Banner */}
      <section className="pt-8 pb-2 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Iniciativa Privada · No Oficial
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white mt-1">
                  Deslinde de Representación Gubernamental
                </p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                  Lex Laboral <strong>NO representa ni está afiliada</strong> al IMSS, INFONAVIT, STPS ni al Gobierno de México. Ofrece estimaciones y proyecciones basadas en normativas federales públicas.
                </p>
              </div>
            </div>
            <a
              href={getPathForView(AppView.SOURCES)}
              onClick={(e) => handleNavClick(e, AppView.SOURCES)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/30 active:scale-95"
            >
              <span>Fuentes oficiales (.gob.mx)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="py-16 sm:py-20 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <a
              key={tool.view}
              href={getPathForView(tool.view)}
              onClick={(event) => handleNavClick(event, tool.view)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-sm transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900/90"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950">
                    {tool.icon}
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-400 border border-slate-800 rounded-md px-2 py-0.5">
                    {tool.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {tool.title}
                </h2>
                
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {tool.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {tool.action}
                  <ChevronRight size={13} />
                </span>
                <ArrowUpRight size={15} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Minimalist Mobile App Banner */}
      <section className="pb-16 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Aplicación Android Nativa</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculadoras sin conexión a internet • Gratuita v1.3.0</p>
            </div>
          </div>

          <a
            href="/LexLaboral-1.3.0-release.apk"
            download="LexLaboral-1.3.0.apk"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 text-xs border border-slate-700 transition-all shrink-0"
          >
            <Download size={15} />
            <span>Descargar APK</span>
          </a>
        </div>
      </section>

      {/* SEO Section */}
      <section className="pb-16 mx-auto max-w-5xl px-4 sm:px-6">
        <SEOContentSection
          title="Preguntas Frecuentes — Lex Laboral"
          intro="Calculadoras jurídicas elaboradas bajo la legislación mexicana vigente."
          highlights={[
            {
              title: 'Cálculo de Liquidación LFT',
              body: 'Indemnización constitucional de 90 días, 20 días por año de servicio, prima de antigüedad de 12 días e ISR Art. 93.'
            },
            {
              title: 'Cuotas Patronales e IMSS',
              body: 'Desglose por ramos de seguro: enfermedades, invalidez, retiro, cesantía, vejez e INFONAVIT.'
            },
            {
              title: 'Pensiones Ley 73 y 97',
              body: 'Estimación mensual según semanas cotizadas y salario promedio.'
            }
          ]}
          faqs={[
            {
              question: '¿Esta aplicación pertenece al gobierno o al IMSS?',
              answer: 'No. Lex Laboral es una herramienta de iniciativa privada e independiente. No representa ni está afiliada al IMSS, INFONAVIT, STPS ni al Gobierno de México. Todos los cálculos son estimaciones informativas basadas en leyes federales públicas (LFT, LSS, INFONAVIT).'
            },
            {
              question: '¿Tiene algún costo usar las calculadoras?',
              answer: 'No, todas las herramientas son 100% gratuitas y sin anuncios.'
            },
            {
              question: '¿Requiere crear una cuenta?',
              answer: 'No, las herramientas funcionan de inmediato sin registro de usuario.'
            },
            {
              question: '¿Se pueden exportar los resultados?',
              answer: 'Sí, cada calculadora cuenta con exportación directa a reporte en PDF.'
            }
          ]}
        />
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-10 text-slate-400 text-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral" 
              className="h-6 w-auto object-contain" 
            />
            <span>Lex Laboral © 2026 • lexlaboral.com.mx</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <a 
              href="mailto:admin@lexlaboral.com.mx"
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Mail size={13} />
              <span>admin@lexlaboral.com.mx</span>
            </a>
            <a 
              href="https://www.facebook.com/LexLaboral"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Globe size={13} />
              <span>Facebook</span>
              <ExternalLink size={11} />
            </a>
            <a 
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Privacidad</span>
              <ExternalLink size={11} />
            </a>
            <a 
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Términos</span>
              <ExternalLink size={11} />
            </a>
            <a 
              href={getPathForView(AppView.SOURCES)}
              onClick={(e) => handleNavClick(e, AppView.SOURCES)}
              className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>Fuentes oficiales</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
