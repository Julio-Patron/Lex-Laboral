import { track } from '@vercel/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calculator, CheckCircle2, FileText, MousePointerClick, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export const OnboardingTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Revisar si ya completó el onboarding en visitas anteriores
    const onboardingStatus = localStorage.getItem('lexlaboral_onboarding_labor');
    if (!onboardingStatus) {
      // Retrasar sutilmente la aparición para no asustar al usuario de golpe
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasCompleted(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('lexlaboral_onboarding_labor', 'true');
    setHasCompleted(true);
    track('onboarding_completed', { step_reached: step });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  if (hasCompleted || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay sutil para móviles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm sm:hidden"
            onClick={handleDismiss}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed bottom-6 left-4 right-4 z-[70] sm:bottom-8 sm:left-auto sm:right-8 w-auto sm:w-[340px] rounded-2xl bg-slate-900 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50"
          >
            <button 
              onClick={handleDismiss}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-legal-gold">
                {step === 1 ? <Calculator size={20} /> : step === 2 ? <MousePointerClick size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Guía rápida • {step} de 3</span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {step === 1 && "Captura tu sueldo"}
                  {step === 2 && "Fechas o antigüedad"}
                  {step === 3 && "Obtén tu documento"}
                </h4>
              </div>
            </div>

            <div className="min-h-[48px]">
              <p className="text-xs leading-relaxed text-slate-300">
                {step === 1 && "Ingresa cuánto ganas y elige si es un sueldo diario, semanal, quincenal o mensual. Nosotros integramos lo demás."}
                {step === 2 && "Dinos cuándo entraste y cuándo saliste. Si no sabes las fechas exactas, puedes poner directamente los años y días trabajados."}
                {step === 3 && "Al terminar, podrás descargar gratis tu recibo de finiquito o carta de renuncia lista para firmar."}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-4 bg-amber-500' : 'w-1.5 bg-slate-700'}`} />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-all hover:bg-slate-100 active:scale-95"
              >
                {step === 3 ? (
                  <>¡Entendido! <CheckCircle2 size={14} /></>
                ) : (
                  <>Siguiente <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
