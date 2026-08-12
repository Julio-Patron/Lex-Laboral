import React from 'react';
import { AppView } from '../types';
import { 
  Calculator, 
  ShieldCheck, 
  ChevronRight, 
  ArrowUpRight, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Scale, 
  FileCheck2,
  Lock,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';
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
    subtitle: 'Art. 48, 50, 162 LFT & ISR Art. 93',
    summary: 'Calculadora completa de indemnizaciones constitucionales (3 meses, 20 días por año), primas de antigüedad e ISR de retención.',
    access: 'Gratis • Sin Registro',
    action: 'Calcular Liquidación',
    badgeStyle: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    icon: <Calculator size={22} className="text-amber-400" />,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'Cuotas IMSS e INFONAVIT',
    subtitle: 'Ramos de Seguro 2026',
    summary: 'Desglose exacto de aportaciones obrero-patronales, enfermedad, invalidez, retiro, riesgo de trabajo e INFONAVIT a partir de salario o SBC.',
    access: 'Gratis • Sin Registro',
    action: 'Calcular Cuotas IMSS',
    badgeStyle: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    icon: <ShieldCheck size={22} className="text-emerald-400" />,
  },
  {
    view: AppView.PENSION_CALCULATOR,
    title: 'Calculadora de Pensiones',
    subtitle: 'Ley 73 y Ley 97 IMSS',
    summary: 'Proyecta el importe mensual de tu pensión estimando semanas cotizadas, salario promedio de los últimos 5 años y saldo de AFORE.',
    access: 'Gratis • Sin Registro',
    action: 'Estimar Pensión',
    badgeStyle: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    icon: <Scale size={22} className="text-blue-400" />,
  },
  {
    view: AppView.CONSULTAS,
    title: 'Consultas Normativas LFT',
    subtitle: 'Motor Legal Búsqueda RAG',
    summary: 'Consulta artículos vigentes de la Ley Federal del Trabajo y normatividad laboral con búsqueda semántica precisa.',
    access: 'Gratis • Sin Registro',
    action: 'Consultar Ley',
    badgeStyle: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    icon: <BookOpen size={22} className="text-purple-400" />,
  },
];

const highlights = [
  {
    icon: <FileCheck2 size={24} className="text-amber-400" />,
    title: 'Cálculos Oficiales LFT 2026',
    description: 'Basado estrictamente en la Ley Federal del Trabajo y Ley del Seguro Social. Transparencia total en fórmulas y fundamentación legal.'
  },
  {
    icon: <Lock size={24} className="text-emerald-400" />,
    title: '100% Privado y Local',
    description: 'Tus datos salariales y cálculos no se envían a servidores externos. Todo permanece guardado de forma segura en tu propio dispositivo.'
  },
  {
    icon: <Download size={24} className="text-blue-400" />,
    title: 'Exportación a PDF Gratuita',
    description: 'Descarga reportes profesionales en formato PDF con desglose concepto por concepto, fecha de emisión y nota legal oficial.'
  }
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in font-sans bg-slate-950 text-slate-100 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={(e) => handleNavClick(e, AppView.HOME)}
          >
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral Logo" 
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold tracking-widest text-amber-400/90 uppercase border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-full">
              v1.3.0
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a 
              href={getPathForView(AppView.CALCULATOR)} 
              onClick={(e) => handleNavClick(e, AppView.CALCULATOR)}
              className="hover:text-amber-400 transition-colors"
            >
              Liquidaciones
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
              Consultas LFT
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => handleNavClick(e, AppView.CALCULATOR)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calculator size={15} />
              <span>Usar Calculadoras</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/60 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.12),_transparent_60%)] py-16 sm:py-24">
        {/* Glow Spheres */}
        <div className="absolute left-1/2 -top-24 -translate-x-1/2 h-96 w-[600px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-sm">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>Plataforma Jurídica Laboral Gratis en México</span>
            </div>

            {/* Main Brand & Hero Title */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Cálculos Laborales Precisos,<br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Sin Costos ni Registro
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Estima tu liquidación por despido, finiquito, cuotas del IMSS e INFONAVIT y proyección de pensión con fundamentación legal actualizada a la <strong>LFT 2026</strong>.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-400" />
                100% Gratuito y Sin Anuncios
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Exportación PDF Oficial
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Datos Privados en Dispositivo
              </span>
            </div>
          </div>

          {/* Tools Grid Section */}
          <div className="mt-14 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tools.map((tool, index) => (
                <a
                  key={tool.view}
                  href={getPathForView(tool.view)}
                  onClick={(event) => handleNavClick(event, tool.view)}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
                >
                  <div>
                    {/* Header line of card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-950 shadow-md group-hover:border-amber-500/50 transition-colors">
                          {tool.icon}
                        </div>
                        <div>
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tool.badgeStyle}`}>
                            {tool.access}
                          </span>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{tool.subtitle}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-slate-600 group-hover:text-amber-400 transition-colors">
                        0{index + 1}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tool.title}
                    </h2>
                    
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                      {tool.summary}
                    </p>
                  </div>

                  {/* CTA Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                      {tool.action}
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="h-8 w-8 rounded-full bg-slate-800/80 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Highlights / Value Props Section */}
      <section className="py-16 sm:py-20 border-b border-slate-800/60 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              ¿Por qué utilizar Lex Laboral?
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Diseñado bajo altos estándares normativos para trabajadores, patrones, contadores y asesores legales en México.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item) => (
              <div 
                key={item.title} 
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 sm:p-7 shadow-lg flex flex-col items-start"
              >
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Download Promo */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-4">
                <Smartphone size={14} />
                <span>Aplicación Móvil Android Disponible</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                Lleva las Calculadoras en tu Teléfono
              </h2>
              
              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Descarga la versión nativa para Android en tu dispositivo para realizar cálculos offline sin necesidad de conexión a internet.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a
                  href="/LexLaboral-1.3.0-release.apk"
                  download="LexLaboral-1.3.0.apk"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Download size={18} />
                  <span>Descargar APK Android (v1.3.0)</span>
                </a>
              </div>
            </div>

            {/* Graphic Badge */}
            <div className="flex shrink-0 items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-inner max-w-xs text-center">
              <div>
                <img 
                  src="/assets/logo.webp" 
                  alt="Lex Laboral App" 
                  className="h-16 w-auto mx-auto object-contain mb-3" 
                />
                <p className="text-xs font-bold text-white">Lex Laboral Móvil</p>
                <p className="text-[11px] text-slate-400 mt-1">Sin registros • 100% Gratis</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEO FAQs Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <SEOContentSection
          title="Preguntas Frecuentes - Calculadoras Laborales México 2026"
          intro="Respuestas claras basadas estrictamente en la Ley Federal del Trabajo y normatividad legal del IMSS."
          highlights={[
            {
              title: 'Cálculos Según Ley Federal del Trabajo',
              body: 'Indemnización de 90 días, 20 días por año de servicio, prima de antigüedad de 12 días por año (topada a 2 salarios mínimos / UMA) e ISR conforme al Art. 93 LISR.'
            },
            {
              title: 'Cuotas Patronales y Obreras IMSS',
              body: 'Desglose oficial por ramos: Enfermedades y Maternidad, Invalidez y Vida, Retiro, Cesantía y Vejez, Guarderías e INFONAVIT.'
            },
            {
              title: 'Proyección de Pensiones IMSS',
              body: 'Estimación bajo el Régimen 1973 (500 semanas min.) o Régimen 1997 (825+ semanas) considerando tu AFORE.'
            }
          ]}
          faqs={[
            {
              question: '¿Cuánto cuesta usar las calculadoras de Lex Laboral?',
              answer: 'Es 100% gratuito. No requiere pagos, datos bancarios ni suscripciones.'
            },
            {
              question: '¿Tengo que crear una cuenta o registrarme?',
              answer: 'No. Todas las funciones están disponibles de inmediato sin necesidad de ingresar correos ni contraseñas.'
            },
            {
              question: '¿Puedo generar un reporte formal en PDF?',
              answer: 'Sí. Cada calculadora cuenta con una función de exportación a PDF que genera un documento limpio con desglose detallado listo para imprimir o compartir.'
            },
            {
              question: '¿Mis datos personales o salariales se comparten?',
              answer: 'No. Los datos que ingresas se procesan y almacenan únicamente dentro de tu navegador o dispositivo. No vendemos ni enviamos datos a servidores externos.'
            }
          ]}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img 
              src="/assets/logo.webp" 
              alt="Lex Laboral" 
              className="h-7 w-auto object-contain" 
            />
            <span className="text-xs font-semibold text-slate-400">
              Lex Laboral © 2026 • Plataforma Jurídica Libre
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium">
            <a 
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Aviso de Privacidad</span>
              <ExternalLink size={12} />
            </a>
            <a 
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>Términos y Condiciones</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Desarrollado por <span className="font-bold text-slate-300">filex dev</span>
          </p>
        </div>
      </footer>

    </div>
  );
};

