import React from 'react';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, ArrowUpRight, MessageSquare, Award, Download, CheckCircle, BookOpen, Search } from 'lucide-react';
import { getPathForView } from '../lib/routes';
import { WorkspacePanel } from './ui/Workspace';
import { SEOContentSection } from './SEOContentSection';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

const tools = [
  {
    view: AppView.CALCULATOR,
    title: 'Liquidación y Finiquito',
    summary: 'Calculadora completa de indemnizaciones constitucionales, primas de antigüedad y finiquitos de ley.',
    access: 'Acceso Gratuito',
    action: 'Calcular Prestaciones',
    accent: 'text-legal-gold',
    badgeStyle: 'border-legal-gold/20 bg-legal-gold/5 text-legal-gold',
    icon: <Calculator size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'Calculadora IMSS',
    summary: 'Proyección detallada de cuotas obrero-patronales, ramos de seguro social e INFONAVIT.',
    access: 'Acceso Gratuito',
    action: 'Calcular IMSS',
    accent: 'text-legal-gold',
    badgeStyle: 'border-legal-gold/20 bg-legal-gold/5 text-legal-gold',
    icon: <ShieldCheck size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.PENSION_CALCULATOR,
    title: 'Calculadora de Pensiones',
    summary: 'Estima tu pensión mensual del IMSS según la Ley de 1973 o 1997 basado en tus semanas cotizadas.',
    access: 'Acceso Gratuito',
    action: 'Estimar Pensión',
    accent: 'text-legal-gold',
    badgeStyle: 'border-legal-gold/20 bg-legal-gold/5 text-legal-gold',
    icon: <Calculator size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.CONSULTAS,
    title: 'Consultas Jurídicas',
    summary: 'Consulta artículos de la Ley Federal del Trabajo, IMSS e INFONAVIT con búsqueda semántica potenciada por IA.',
    access: 'Acceso Gratuito',
    action: 'Consultar',
    accent: 'text-legal-gold',
    badgeStyle: 'border-legal-gold/20 bg-legal-gold/5 text-legal-gold',
    icon: <BookOpen size={20} className="text-legal-gold" />,
  },
];

const supportBlocks = [
  {
    title: '1. Herramientas Laborales Completamente Gratuitas',
    body: 'Acceso gratuito a calculadoras de liquidación, IMSS y pensiones sin necesidad de planes pagados. Diseñadas para trabajadores, abogados y empresas en México.',
  },
  {
    title: '2. Motor de Búsqueda Legal (RAG)',
    body: 'Sistema de búsqueda semántica que extrae información directamente de la Ley Federal del Trabajo y normatividad laboral vigente. Solo da respuestas basadas en legislación oficial.',
  },
  {
    title: '3. Precisión Legal Absoluta',
    body: 'Cada cálculo y respuesta se basa en artículos específicos de la ley. Eliminamos la ambigüedad en temas de prestaciones, cuotas y derechos laborales en México.',
  },
];

const galleryItems = [
  {
    src: '/assets/screenshots/screenshot-liquidacion.svg',
    alt: 'Calculadora de Liquidación y Finiquito',
    title: 'Liquidación'
  },
  {
    src: '/assets/screenshots/screenshot-imss.svg',
    alt: 'Calculadora IMSS e INFONAVIT',
    title: 'IMSS'
  },
  {
    src: '/assets/screenshots/screenshot-consultas.svg',
    alt: 'Consultas Normatividad Laboral',
    title: 'Consultas'
  }
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in font-sans bg-[#020306] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(163,124,31,0.1),_transparent_45%),linear-gradient(180deg,_#050811_0%,_#020306_100%)] py-12 md:py-24">
        <div className="absolute right-0 top-0 hidden h-96 w-96 rounded-full bg-legal-gold/5 blur-[120px] md:block" />
        <div className="absolute -bottom-10 left-10 hidden h-80 w-80 rounded-full bg-slate-900/30 blur-[100px] md:block" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 flex flex-col items-center">
          {/* Centered Brand & Heading */}
          <div className="flex flex-col items-center text-center space-y-5 md:space-y-6 max-w-3xl animate-fade-in">
            <div className="flex flex-col items-center space-y-4">
              {/* Premium Large Transparent Logo */}
              <div className="max-w-[360px] sm:max-w-[540px] select-none animate-in fade-in duration-700 hue-rotate-[10deg] brightness-125 saturate-150 contrast-125 drop-shadow-[0_0_20px_rgba(224,175,34,0.45)] -mt-6">
                <img 
                  src="/assets/logo.webp" 
                  alt="Lex Laboral" 
                  width={800}
                  height={285}
                  className="w-full h-auto object-contain drop-shadow-[0_15px_35px_rgba(224,175,34,0.15)]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
              <span className="rounded-full border border-legal-gold/20 bg-legal-gold/5 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-legal-gold">
                Liquidaciones y Finiquitos
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 shadow-sm">
                Seguridad Social IMSS
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 shadow-sm">
                Régimen Vigente 2026
              </span>
            </div>

            {/* No more login/auth UI - all tools are now free */}
          </div>

          {/* Tools Grid Section */}
          <div className="w-full mt-16 max-w-6xl animate-fade-in">
            <WorkspacePanel className="relative overflow-hidden p-6 sm:p-10 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-[2.5rem] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.7)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-legal-gold/5 to-transparent pointer-events-none" />

              {/* Tools Cards arranged in 2x2 Grid */}
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool, index) => (
                  <a
                    key={tool.view}
                    href={getPathForView(tool.view)}
                    onClick={(event) => handleNavClick(event, tool.view)}
                    className="group flex items-start gap-3 sm:gap-4.5 rounded-2xl border border-white/5 bg-slate-900/60 p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-legal-gold/40 hover:bg-slate-900/80"
                  >
                    {/* Dark Icon Chip Homogeneous with LexCorporativo */}
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-[0.9rem] sm:rounded-[1.1rem] border border-white/10 bg-slate-950 shadow-md group-hover:border-legal-gold/40 transition-colors duration-300">
                      {tool.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[10px] font-bold text-legal-gold tracking-widest font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.16em] ${tool.badgeStyle}`}>
                          {tool.access}
                        </span>
                      </div>
                      <h2 className="mt-2 text-md font-bold text-white transition-colors group-hover:text-legal-gold">{tool.title}</h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-medium">{tool.summary}</p>
                      
                      {/* Premium Information Hierarchy CTA Button */}
                      <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 group-hover:bg-legal-gold group-hover:text-slate-950 group-hover:border-legal-gold group-hover:-translate-y-0.5">
                        <span>{tool.action}</span>
                        <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-500 group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors duration-300">
                      <ArrowUpRight size={14} />
                    </div>
                  </a>
                ))}
              </div>
            </WorkspacePanel>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {supportBlocks.map((block) => (
            <WorkspacePanel key={block.title} className="p-5 sm:p-6.5 border border-white/5 bg-slate-950/60 shadow-sm rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-legal-gold to-slate-900 opacity-80" />
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-legal-gold">Plataforma Lex Laboral</span>
              <h2 className="mt-2 text-md font-bold text-white">{block.title}</h2>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-400 font-medium">{block.body}</p>
            </WorkspacePanel>
          ))}
        </div>
      </section>

      {/* Gallery / Screenshots Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:px-10">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-3">Interfaz Moderna y Accesible</h2>
        <p className="text-center text-slate-400 text-sm md:text-base mb-10 max-w-2xl mx-auto">
          Diseñada para trabajadores, abogados y empresas. Disponible en web y móvil con PWA ready.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <div key={item.src} className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:border-legal-gold/40 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(163,124,31,0.15)]">
              <div className="aspect-video overflow-hidden bg-slate-900">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available on Web and Mobile Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:px-10">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-950/60 to-slate-900/40 backdrop-blur-md p-8 md:p-12">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <Download size={32} className="text-legal-gold mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Disponible en Web y Móvil</h2>
            <p className="text-slate-300 text-sm md:text-base mb-8">
              Lex Laboral es una aplicación web progresiva (PWA) totalmente funcional en tu navegador. Acceso inmediato sin necesidad de descargar desde app stores.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Web</p>
                <p className="text-white font-semibold">Acceso Inmediato</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              <div className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Móvil</p>
                <p className="text-white font-semibold">PWA Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10 py-12">
        <SEOContentSection
          title="Preguntas Frecuentes - Calculadoras y Consultas Laborales"
          intro="Lex Laboral es tu asistente legal laboral integral. Calcula prestaciones con precisión legal, consulta la normatividad laboral vigente y obtén respuestas basadas en la Ley Federal del Trabajo 2026."
          highlights={[
            {
              title: 'Calculadora de Liquidación Gratuita',
              body: 'Calcula indemnización constitucional, prima de antigüedad, aguinaldo y finiquito con desglose detallado. Disponible sin registro ni costo.'
            },
            {
              title: 'Consultas Normativas Precisas',
              body: 'Realiza consultas sobre tus derechos laborales y obtén respuestas directas de la Ley Federal del Trabajo. Sistema RAG con búsqueda semántica legal.'
            },
            {
              title: 'Seguridad Social IMSS',
              body: 'Calcula cuotas obrero-patronales, INFONAVIT y prima de riesgo con desglose por ramo. Accesible y gratuita para todos.'
            }
          ]}
          faqs={[
            {
              question: '¿Cuánto cuesta usar Lex Laboral?',
              answer: 'Las calculadoras de liquidación, IMSS e INFONAVIT y pensiones son completamente gratuitas. No requieren suscripción ni plan pagado.'
            },
            {
              question: '¿Es exacta la calculadora de liquidación?',
              answer: 'Sí. Nuestra calculadora aplica los artículos 48, 50, 162 y 163 de la Ley Federal del Trabajo vigente en México. Produce resultados precisos basados en la normatividad oficial.'
            },
            {
              question: '¿Puedo consultar la normatividad laboral?',
              answer: 'Sí. Usa el módulo de Consultas para hacer preguntas sobre la Ley Federal del Trabajo. El sistema extrae respuestas directas de los artículos aplicables.'
            },
            {
              question: '¿Funciona en móvil?',
              answer: 'Completamente. Lex Laboral es una aplicación web progresiva (PWA) optimizada para todos los dispositivos, desde teléfonos hasta desktops.'
            },
            {
              question: '¿Necesito crear una cuenta?',
              answer: 'No. Todas las herramientas de Lex Laboral son gratuitas y no requieren registro ni inicio de sesión.'
            }
          ]}
        />
      </section>

      {/* Elegant Homogeneous Footer */}
      <footer className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/5 px-4 sm:px-6 py-10 text-center md:flex-row md:px-10 md:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-legal-gold/20 bg-slate-950 p-1">
            <img
              src="/assets/logo.webp"
              alt="Logo"
              width={800}
              height={285}
              className="h-full w-full object-contain rounded-md"
              loading="lazy"
              decoding="async"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Lex Laboral © 2026</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          <a href={getPathForView(AppView.TERMS)} onClick={(event) => handleNavClick(event, AppView.TERMS)} className="transition-colors hover:text-white">
            Términos
          </a>
          <a href={getPathForView(AppView.PRIVACY)} onClick={(event) => handleNavClick(event, AppView.PRIVACY)} className="transition-colors hover:text-white">
            Privacidad
          </a>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Desarrollado por <span className="font-bold text-slate-300">filex dev</span>
        </p>
      </footer>
    </div>
  );
};
