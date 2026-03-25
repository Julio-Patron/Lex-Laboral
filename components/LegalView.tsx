import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Scale, FileText, Lock } from 'lucide-react';
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
        <div className="p-3 bg-legal-gold/10 rounded-2xl text-legal-gold">
          <Scale size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 line-height-tight">Términos y Condiciones</h1>
          <p className="text-slate-500 text-sm">Última actualización: Marzo 2026</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">1</span>
            Aceptación de los Términos
          </h2>
          <p>Al acceder o utilizar la plataforma Lex Laboral (en adelante "la Plataforma"), disponible en lexlaboral.com.mx y app.lexlaboral.com.mx, usted ("el Usuario") acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo, deberá abstenerse de utilizar la Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">2</span>
            Naturaleza del Servicio y Limitaciones
          </h2>
          <div className="space-y-3">
            <p><strong>2.1.</strong> Lex Laboral es una herramienta tecnológica de asistencia basada en inteligencia artificial (Google Gemini API) que proporciona información, cálculos estimatorios (ej. finiquitos, cuotas IMSS) y redacción automatizada de borradores de documentos, utilizando parámetros legales vigentes en México.</p>
            <p className="bg-amber-50 border-l-4 border-amber-400 p-4 italic">
              <strong>2.2. LA PLATAFORMA NO CONSTITUYE ASESORÍA LEGAL PROFESIONAL.</strong> El contenido generado es meramente informativo y orientativo. No sustituye la consulta con un abogado colegiado. Las relaciones laborales, juicios y estrategias legales requieren de supervisión humana profesional.
            </p>
            <p><strong>2.3.</strong> El Usuario es el único responsable del uso que dé a la información y documentos generados por la Plataforma. Lex Laboral no se hace responsable por decisiones legales, administrativas o judiciales basadas en el uso de la herramienta.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">3</span>
            Precisión de la Información
          </h2>
          <p>Realizamos esfuerzos comercialmente razonables para mantener la información actualizada (ej. SMG $312.41, UMA $119.35 a Marzo 2026). Sin embargo, las leyes, criterios judiciales y tablas pueden cambiar. No garantizamos la precisión, integridad o actualización absoluta de los datos. El Usuario es responsable de verificar la información con fuentes oficiales.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">4</span>
            Registro y Cuentas de Usuario
          </h2>
          <p>Para acceder a ciertas funcionalidades, el Usuario deberá registrarse proporcionando información veraz. Es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">5</span>
            Propiedad Intelectual
          </h2>
          <p>El código fuente (bajo licencia MIT), diseños, logotipos y contenido original de la Plataforma son propiedad de Lex Laboral o sus licenciantes. El Usuario no adquiere ningún derecho sobre ellos. El software de código abierto utilizado se rige por sus propias licencias.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">6</span>
            Conducta del Usuario
          </h2>
          <p>El Usuario se compromete a no utilizar la Plataforma para actividades ilícitas, introducir virus o intentar vulnerar la seguridad del sistema.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">7</span>
            Limitación de Responsabilidad
          </h2>
          <p>Hasta el máximo permitido por la ley, Lex Laboral no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">8</span>
            Modificaciones
          </h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos al ser publicados en la Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">9</span>
            Ley y Jurisdicción
          </h2>
          <p>Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales de la Ciudad de México, renunciando a cualquier otro fuero.</p>
        </section>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
          <Lock size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 line-height-tight">Aviso de Privacidad</h1>
          <p className="text-slate-500 text-sm">Integral • Marzo 2026</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-emerald-900 text-sm mb-8">
          <p className="font-bold mb-2 flex items-center gap-2">
            <Shield size={16} /> Tu privacidad es prioridad
          </p>
          <p>Este aviso detalla cómo tratamos tus datos bajo los principios de licitud y transparencia.</p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Responsable</h2>
          <p><strong>Lex Laboral</strong>, con correo de contacto para temas de privacidad: soporte@lexlaboral.com.mx.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Finalidades del Tratamiento</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2 uppercase tracking-wide opacity-60">Finalidades Primarias (Necesarias)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Crear y administrar su cuenta de usuario.</li>
                <li>Proveer los servicios de la Plataforma (análisis jurídico, calculadoras).</li>
                <li>Procesar pagos de suscripción.</li>
                <li>Atender dudas y quejas relacionadas con el servicio.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2 uppercase tracking-wide opacity-60">Finalidades Secundarias (Opcionales)</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enviar comunicados sobre novedades y actualizaciones legales.</li>
                <li>Realizar encuestas de satisfacción para mejorar la herramienta.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Datos Personales Recabados</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identificación y contacto:</strong> Nombre, correo electrónico.</li>
            <li><strong>Contenido de usuario:</strong> Información contenida en documentos subidos para análisis. NO recopilamos datos financieros sensibles más allá de los necesarios para la pasarela de pago (Stripe).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Transferencias de Datos</h2>
          <p>Para el funcionamiento de la IA, los datos se transfieren de forma segura a:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Google LLC (Gemini API):</strong> Para procesar consultas y análisis.</li>
            <li><strong>Stripe:</strong> Para la gestión segura de pagos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Derechos ARCO</h2>
          <p>Usted puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición enviando una solicitud a nuestro correo de contacto. Le responderemos en un plazo máximo de 20 días hábiles.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Uso de la IA</h2>
          <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl italic">
            Al subir documentos, el Usuario manifiesta contar con el consentimiento de los terceros involucrados (ej. empleados) para el tratamiento de sus datos a través de nuestra herramienta.
          </p>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Lex Laboral • Sistema de Protección de Datos y Cumplimiento Normativo
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
