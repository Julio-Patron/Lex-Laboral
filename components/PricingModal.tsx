
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Shield, FileText, PenTool, Sparkles } from 'lucide-react';
import { createCheckoutSession, redirectToCheckout } from '../services/stripe';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  notify: (m: string, t?: any, tit?: string) => void;
  initialPlan?: 'audit' | 'draft_basic' | 'draft_custom' | '3-months';
}

export const PricingModal: React.FC<PricingModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  notify, 
  initialPlan = '3-months' 
}) => {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handlePurchase = async (plan: 'audit' | 'draft_basic' | 'draft_custom' | '3-months') => {
    if (!user) {
      notify("Por favor, inicie sesión para continuar con la compra.", "warning");
      return;
    }

    setLoading(plan);
    try {
      notify("Iniciando proceso de pago seguro...", "info", "Stripe Checkout");
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';
      
      const { id: sessionId } = await createCheckoutSession(user.email || '', user.id, plan, accessToken);
      await redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Stripe error:', error);
      notify("No se pudo iniciar el proceso de pago. Intente de nuevo.", "error", "Error de Stripe");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'audit',
      name: 'Análisis y Auditoría',
      description: 'Análisis profundo de un expediente laboral completo.',
      price: '$49',
      unit: 'por auditoría',
      icon: <FileText className="text-blue-500" size={24} />, 
      features: [
        'Análisis de 3 pilares (LFT, Colectivo, IMSS)',
        'Detección de contingencias críticas',
        'Puntaje de riesgo estratégico',
        'Dictamen exportable'
      ],
      color: 'blue'
    },
    {
      id: 'draft_basic',
      name: 'Documento Legal',
      description: 'Generación de instrumento jurídico profesional.',
      price: '$79',
      unit: 'por documento',
      icon: <PenTool className="text-purple-500" size={24} />, 
      features: [
        'Técnica legislativa mexicana',
        'Estructura de cláusulas formal',
        'Formatos LFT validados',
        'Exportación inmediata'
      ],
      color: 'purple'
    },
    {
      id: 'monthly',
      name: 'Suscripción Mensual',
      description: 'Acceso ilimitado a la calculadora y hasta 15 análisis y 15 generaciones de documentos al mes.',
      price: '$299',
      unit: 'al mes',
      icon: <Crown className="text-legal-gold" size={24} />, 
      popular: true,
      features: [
        'Calculadora ilimitada',
        '15 análisis de documentos al mes',
        '15 generaciones de documentos al mes',
        'Soporte prioritario'
      ],
      color: 'gold'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-legal-950/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-50 w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 my-auto"
          >
            {/* Header */}
            <div className="p-8 sm:px-12 flex items-center justify-between bg-white border-b border-slate-200">
              <div className="flex items-center gap-5">
                <div className="p-3.5 bg-legal-950 rounded-2xl shadow-premium">
                  <Shield className="text-legal-gold" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-legal-950 tracking-tight">Licencias y Créditos Estratégicos</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Potencie su práctica jurídica con Lex Laboral</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-legal-950 active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 sm:p-12 lg:p-14 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan) => (
                  <motion.div 
                    key={plan.id}
                    whileHover={{ y: -5 }}
                    className={`relative flex flex-col bg-white rounded-[2rem] p-8 border ${plan.popular ? 'border-legal-gold ring-4 ring-legal-gold/5 shadow-xl' : 'border-slate-200 shadow-sm'} transition-all`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-legal-gold text-legal-950 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <Sparkles size={10} /> Más Popular
                      </div>
                    )}

                    <div className="mb-6 flex items-center justify-between">
                      <div className={`p-3 rounded-2xl bg-slate-50`}>
                        {plan.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-serif font-bold text-legal-950">{plan.price}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{plan.unit}</div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-legal-950 mb-2">{plan.name}</h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed mb-8 h-12 line-clamp-3">
                      {plan.description}
                    </p>

                    <div className="flex-1 space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular ? 'bg-legal-gold/20' : 'bg-slate-100'}`}>
                            <Check size={12} className={plan.popular ? 'text-legal-gold' : 'text-slate-400'} />
                          </div>
                          <span className="text-[12px] text-slate-600 font-medium leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handlePurchase(plan.id as any)}
                      disabled={loading !== null}
                      className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        plan.popular 
                          ? 'bg-legal-950 text-legal-gold shadow-lg shadow-legal-950/20 hover:bg-legal-900' 
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      } disabled:opacity-50`}
                    >
                      {loading === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <span>Adquirir Ahora</span>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Security Banner */}
              <div className="mt-12 p-6 bg-slate-100/50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 opacity-75">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Shield className="text-emerald-500" size={24} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-legal-950 uppercase tracking-widest">Pago 100% Seguro</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Transacciones procesadas por Stripe con encriptación de grado bancario.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                  <span className="text-[10px] font-black text-slate-400 italic">VISA</span>
                  <span className="text-[10px] font-black text-slate-400 italic">MASTERCARD</span>
                  <span className="text-[10px] font-black text-slate-400 italic">AMEX</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Al realizar la compra, usted acepta nuestros <a href="#" className="text-legal-gold hover:underline">Términos de Servicio</a> y <a href="#" className="text-legal-gold hover:underline">Política de Reembolsos</a>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
