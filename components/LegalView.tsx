import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Scale, Mail, Globe, ExternalLink, ShieldCheck, FileCheck } from 'lucide-react';
import { AppView } from '../types';

interface LegalViewProps {
  type: AppView.TERMS | AppView.PRIVACY;
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isTerms = type === AppView.TERMS;

  const content = isTerms ? (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl shadow-lg border border-white/10">
          <Scale size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Términos y Condiciones</h1>
          <p className="text-slate-500 text-sm font-medium">Última actualización: Agosto 2026 • lexlaboral.com.mx (Mérida, Yucatán)</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">01</span>
            Aceptación y Titularidad
          </h2>
          <p>Bienvenido a <strong>Lex Laboral</strong>. Al acceder y utilizar este sitio web, la aplicación móvil y sus herramientas jurídicas, usted acepta estar sujeto a estos Términos y Condiciones. La plataforma es propiedad de y está operada por <strong>lexlaboral.com.mx</strong>, con domicilio en la ciudad de Mérida, Yucatán, México.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">02</span>
            Naturaleza de los Servicios y Parámetros Laborales 2026
          </h2>
          <div className="space-y-4">
            <p>Lex Laboral provee herramientas de cálculo laboral y de seguridad social basadas en la legislación mexicana vigente (Ley Federal del Trabajo, Ley del Seguro Social y Ley del INFONAVIT), con soporte para cálculo de liquidaciones, finiquitos, cuotas obrero-patronales y proyecciones de pensión bajo las leyes de 1973 y 1997.</p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm my-6">
              <p className="text-amber-900 font-bold mb-2 flex items-center gap-2 italic uppercase tracking-wider text-xs">
                ⚠️ DESLINDE DE RESPONSABILIDAD CRÍTICO (DISCLAIMER)
              </p>
              <p className="text-sm leading-6"><strong>LA PLATAFORMA NO CONSTITUYE ASESORÍA LEGAL PROFESIONAL.</strong> Los resultados y documentos emitidos son estimaciones matemáticas e informativas que deben ser evaluadas por un abogado o profesional legal antes de utilizarse en procedimientos judiciales o acuerdos laborales formales. lexlaboral.com.mx no se responsabiliza por resoluciones o decisiones adoptadas a partir del uso de la aplicación.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">03</span>
            Servicio Gratuito y Sin Registro
          </h2>
          <p>Lex Laboral es un servicio <strong>completamente gratuito</strong>. No requiere registro de cuenta, compras dentro de la aplicación ni membresías de pago. Todas las calculadoras y descargas del archivo APK de la aplicación nativa están disponibles de manera abierta y sin costo.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">04</span>
            Privacidad y Procesamiento Local
          </h2>
          <p>En estricto respeto a la privacidad del usuario, todos los cálculos salariales y simulaciones se procesan de manera local en el navegador o en la aplicación del dispositivo móvil, sin que sus datos o expedientes se almacenen en servidores remotos de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">05</span>
            Propiedad Intelectual
          </h2>
          <p>Todos los derechos sobre el software, código, diseño, marcas y logotipos pertenecen a <strong>lexlaboral.com.mx</strong>. Se otorga una licencia de uso personal o profesional legítimo, sin autorización para redistribución comercial o ingeniería inversa.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold">06</span>
            Jurisdicción, Ley Aplicable y Canales de Contacto
          </h2>
          <p>Para la interpretación de estos términos, las partes se someten a las leyes aplicables de los Estados Unidos Mexicanos y a los tribunales competentes en la ciudad de <strong>Mérida, Yucatán</strong>.</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Contacto Oficial:</p>
              <p className="text-xs text-slate-600">Atención a dudas normativas, soporte técnico o sugerencias:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a 
                href="mailto:admin@lexlaboral.com.mx" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Mail size={14} className="text-amber-400" />
                <span>admin@lexlaboral.com.mx</span>
              </a>
              <a 
                href="https://www.facebook.com/LexLaboral" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Globe size={14} />
                <span>Facebook Oficial</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg border border-white/10">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Aviso de Privacidad</h1>
          <p className="text-slate-500 text-sm font-medium">Integral • Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-[15px]">
        <section className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-emerald-900 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
             <ShieldCheck size={20} className="text-emerald-700" />
             Identidad del Responsable
          </h2>
          <p className="text-sm"><strong>lexlaboral.com.mx</strong>, con domicilio en la ciudad de Mérida, Yucatán, México, es el responsable del tratamiento de sus datos personales conforme a la LFPDPPP. Correo de contacto oficial: <strong>admin@lexlaboral.com.mx</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-bold">01</span>
            Datos Personales Tratados y Cero Almacenamiento Centralizado
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Sin Registro:</strong> Lex Laboral no solicita cuentas de usuario, contraseñas ni recolección de correos electrónicos para utilizar sus calculadoras laborales.</li>
            <li><strong>Procesamiento Local:</strong> Los cálculos de salarios, prestaciones, cuotas IMSS o estimaciones de pensión se realizan localmente en el dispositivo del usuario. No se transmiten ni almacenan en bases de datos remotas.</li>
            <li><strong>Consultas Normativas:</strong> Las búsquedas en la Ley Federal del Trabajo son efímeras y no quedan vinculadas a perfiles de usuarios.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-bold">02</span>
            Finalidades del Tratamiento
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Primarias:</strong> Proveer de forma instantánea y gratuita las estimaciones laborales, desglose de aportaciones patronales y proyecciones de pensión directamente en pantalla o formato PDF.</li>
            <li><strong>Secundarias:</strong> Permitir al usuario conservar su historial de cálculo exclusivamente en el almacenamiento local de su propio navegador o teléfono móvil.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center text-xs font-bold">03</span>
            Derechos ARCO y Contacto
          </h2>
          <p>Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) o consultar cualquier aspecto de este aviso enviando un correo electrónico a <strong>admin@lexlaboral.com.mx</strong> o a través de nuestros canales oficiales.</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Canales de Atención:</p>
              <p className="text-xs text-slate-600">Contacto con el equipo de Lex Laboral:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a 
                href="mailto:admin@lexlaboral.com.mx" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Mail size={14} className="text-emerald-400" />
                <span>admin@lexlaboral.com.mx</span>
              </a>
              <a 
                href="https://www.facebook.com/LexLaboral" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Globe size={14} />
                <span>Facebook Oficial</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-10 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Regresar al Ecosistema</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100"
        >
          {content}
          
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Lex Laboral © 2026 • lexlaboral.com.mx • Mérida, Yucatán
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
