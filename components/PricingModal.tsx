
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Shield, PenTool, Sparkles, Calculator } from 'lucide-react';
import { createCheckoutSession, redirectToCheckout } from '../services/stripe';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (m: string, t?: any, tit?: string) => void;
  initialPlan?: 'draft_basic' | 'mensualidad';
}

export const PricingModal: React.FC<PricingModalProps> = ({ 
  isOpen, 
  onClose, 
  notify, 
  initialPlan = 'draft_basic' 
}) => {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handlePurchase = async (plan: 'draft_basic' | 'mensualidad') => {
    setLoading(plan);
    try {
      notify("Iniciando proceso de pago seguro...", "info", "Stripe Checkout");
      const { id: sessionId } = await createCheckoutSession('', '', plan, '');
      await redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Stripe error:', error);
      notify("No se pudo iniciar el proceso de pago.", "error", "Error de Stripe");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Uso Gratuito',
      description: 'Herramientas básicas de consulta rápida.',
      price: '$0',
      unit: 'siempre',
      icon: <Calculator className="text-slate-400" size={24} />, 
      features: [
        'Calculadora Laboral básica',
        'Calculadora Seguridad Social',
        'Visualización de fórmulas',
        'Exportación básica'
      ],
      color: 'slate',
      action: () => onClose()
    },
    {
      id: 'draft_basic',
      name: 'Documento Individual',
      description: 'Generación de 1 instrumento jurídico profesional.',
      price: '$79',
      unit: 'pago único',
      icon: <PenTool className="text-amber-500" size={24} />, 
      popular: true,
      features: [
        'Técnica legislativa mexicana',
        'Estructura de cláusulas formal',
        'Formatos LFT validados',
        'Exportación PDF Profesional'
      ],
      color: 'amber',
      action: () => handlePurchase('draft_basic')
    },
    {
      id: 'mensualidad',
      name: 'Pase Mensual',
      description: 'Uso intensivo para despachos o departamentos de RH.',
      price: '$499',
      unit: 'por mes',
      icon: <Crown className="text-legal-gold" size={24} />, 
      features: [
        'Generaciones ilimitadas',
        'Soporte técnico prioritario',
        'Actualizaciones de ley',
        'Sin marcas de agua'
      ],
      color: 'gold',
      action: () => handlePurchase('mensualidad')
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-legal-950/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-50 w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 my-auto"
          >
            {/* Header */}
            <div className="p-8 sm:px-12 flex items-center justify-between bg-white border-b border-slate-200">
              <div className="flex items-center gap-5">
                <div className="p-3.5 bg-legal-950 rounded-2xl shadow-lg">
                  <Shield className="text-legal-gold" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-legal-950 tracking-tight">Seleccione su Plan</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sin registros, pago por uso inmediato</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-legal-950"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <div key={plan.id} className={`relative flex flex-col bg-white rounded-[2rem] p-8 border ${plan.popular ? 'border-legal-gold ring-4 ring-legal-gold/5 shadow-xl' : 'border-slate-200 shadow-sm'}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-legal-gold text-legal-950 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <Sparkles size={10} /> Recomendado
                      </div>
                    )}

                    <div className="mb-6 flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-slate-50">{plan.icon}</div>
                      <div className="text-right">
                        <div className="text-2xl font-serif font-bold text-legal-950">{plan.price}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">{plan.unit}</div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-legal-950 mb-2">{plan.name}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-8 h-10 line-clamp-2">{plan.description}</p>

                    <div className="flex-1 space-y-4 mb-8">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check size={14} className={plan.popular ? 'text-legal-gold mt-0.5' : 'text-slate-300 mt-0.5'} />
                          <span className="text-[11px] text-slate-600 font-medium">{f}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => plan.action()}
                      disabled={loading !== null}
                      className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                        plan.popular 
                          ? 'bg-legal-950 text-legal-gold shadow-lg hover:bg-legal-900' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {loading === plan.id ? 'Procesando...' : plan.id === 'free' ? 'Usar Gratis' : 'Adquirir Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
