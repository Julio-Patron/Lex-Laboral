import {
    ArrowUpRight,
    BookOpen,
    Calculator,
    ChevronRight,
    Download,
    ExternalLink,
    Globe,
    Mail,
    Scale,
    ShieldCheck,
    Smartphone
} from 'lucide-react';
import React from 'react';
import { getPathForView } from '../lib/routes';
import { AppView } from '../types';
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
      <section className="relative pt-10 pb-12 sm:py-24 border-b border-slate-800/60 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_70%)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10 text-center">
          
          {/* Hero Brand Logo as Main Title */}
          <div className="max-w-[240px] sm:max-w-[420px] md:max-w-[480px] mx-auto mb-5 sm:mb-6 select-none">
            <h1 className="sr-only">Lex Laboral: Herramientas Jurídicas Laborales en México</h1>
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral Logo" 
              className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(212,175,55,0.15)]"
              loading="eager"
            />
          </div>

          <span className="inline-block font-mono text-[10px] sm:text-[11px] font-semibold tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full mb-4 sm:mb-5">
            Calculadoras Jurídicas Laborales • México 2026
          </span>

        </div>
      </section>



      {/* Tools Grid Section */}
      <section className="py-8 sm:py-20 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {tools.map((tool) => (
            <a
              key={tool.view}
              href={getPathForView(tool.view)}
              onClick={(event) => handleNavClick(event, tool.view)}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-sm transition-all duration-200 hover:border-amber-500/40 hover:bg-slate-900/90"
            >
              <div className="flex flex-row sm:flex-col items-start gap-4 sm:gap-0">
                <div className="flex shrink-0 h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950 sm:mb-4">
                  {tool.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 sm:mb-0 mb-1">
                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate sm:whitespace-normal">
                      {tool.title}
                    </h2>
                    <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-400 border border-slate-800 rounded-md px-2 py-0.5 shrink-0">
                      {tool.badge}
                    </span>
                  </div>
                  
                  <p className="text-[13px] sm:text-xs leading-snug sm:leading-relaxed text-slate-400 sm:mt-2">
                    {tool.summary}
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[13px] sm:text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {tool.action}
                  <ChevronRight size={13} />
                </span>
                <ArrowUpRight size={15} className="text-slate-500 group-hover:text-amber-400 transition-colors hidden sm:block" />
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
              <p className="text-xs text-slate-400 mt-0.5">Calculadoras sin conexión a internet • Gratuita v1.4.0</p>
            </div>
          </div>

          <a
            href="/LexLaboral-1.4.0-release.apk"
            download="LexLaboral-1.4.0.apk"
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
          title="Calculadoras de Liquidación, IMSS y Pensiones 2026"
          intro="Herramientas jurídicas y calculadoras laborales actualizadas con la legislación mexicana. Estimaciones precisas basadas en la Ley Federal del Trabajo, IMSS e INFONAVIT para empleadores, despachos y trabajadores."
          highlights={[
            {
              title: 'Liquidación y Finiquito',
              body: 'Calcula indemnización constitucional de 90 días, 20 días por año, prima de antigüedad e ISR (Art. 93). Descarga memoria técnica de cálculo o recibos de finiquito en PDF y Word.'
            },
            {
              title: 'Cuotas Patronales e IMSS',
              body: 'Simula el impacto de las cuotas obrero-patronales 2026. Desglose detallado por ramos de seguro: enfermedades y maternidad, invalidez y vida, retiro y riesgos de trabajo.'
            },
            {
              title: 'Pensiones Ley 73 y 97',
              body: 'Proyecta escenarios de pensión IMSS según tu salario base de cotización, semanas reconocidas y saldo en tu cuenta AFORE.'
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
