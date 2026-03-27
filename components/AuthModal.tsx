import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Shield, ArrowRight, Loader2, Chrome } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createCheckoutSession, redirectToCheckout } from '../services/stripe';
import { NotificationType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (m: string, t?: NotificationType) => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'signup' | 'planSelection' | 'forgotPassword';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, notify, initialMode = 'login' }) => {
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'analisis' | 'draft_basic' | 'mensualidad'>('mensualidad');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google auth error:', error);
      setError(error.message || 'Error con Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Go to plan selection
        setMode('planSelection');
        notify("Cuenta creada. Seleccione su nivel de acceso.", "success");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Ingrese su correo electrónico");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      notify("Correo de recuperación enviado", "success");
      setMode('login');
    } catch (error: any) {
      console.error('Reset error:', error);
      setError(`Error: ${error.message || 'Verifique su correo'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado");
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      const session = await createCheckoutSession(user.email || '', user.id, selectedPlan, authSession?.access_token || '');
      await redirectToCheckout(session.id);
    } catch (error) {
      console.error(error);
      setError("Error al iniciar el proceso de pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-legal-950/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="p-8 pt-12 text-center">
              <div className="w-12 h-12 bg-legal-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="text-legal-gold" size={24} />
              </div>
              
              <h2 className="text-3xl font-serif font-bold text-legal-950">
                {mode === 'login' ? 'Bienvenido de Nuevo' : 
                 mode === 'signup' ? 'Crear Cuenta Profesional' : 
                 mode === 'forgotPassword' ? 'Recuperar Contraseña' :
                 'Selección de Licencia'}
              </h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                {mode === 'login' ? 'Acceda a su ecosistema jurídico digital' : 
                 mode === 'signup' ? 'Únase a la élite legal tecnológica' :
                 mode === 'forgotPassword' ? 'Le enviaremos un enlace para restablecer su acceso' :
                 'Active su acceso por 3 o 6 meses'}
              </p>
              
              <div className="mt-10">
                {mode !== 'planSelection' ? (
                  <form onSubmit={mode === 'forgotPassword' ? handleForgotPassword : handleSubmit} className="space-y-5 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="abogado@estudio.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-legal-gold/20 focus:border-legal-gold outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    {mode !== 'forgotPassword' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                          {mode === 'login' && (
                            <button 
                              type="button"
                              onClick={() => setMode('forgotPassword')}
                              className="text-[10px] font-bold text-legal-gold uppercase tracking-widest hover:text-legal-800 transition-colors"
                            >
                              ¿Olvidó su contraseña?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-legal-gold/20 focus:border-legal-gold outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <div className="flex items-start gap-3 px-1">
                        <input type="checkbox" required className="mt-1 accent-legal-gold" />
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Acepto los <a href="#" className="underline font-bold text-slate-700">Términos y Condiciones</a> y el <a href="#" className="underline font-bold text-slate-700">Aviso de Privacidad</a> de Lex Laboral.
                        </p>
                      </div>
                    )}

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100"
                      >
                        {error}
                      </motion.div>
                    )}
                    
                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full bg-legal-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          <span>
                            {mode === 'login' ? 'Iniciar Sesión' : 
                             mode === 'signup' ? 'Registrar Cuenta' : 
                             'Enviar Correo'}
                          </span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">O</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleLogin}
                      className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      <Chrome size={20} />
                      <span>Continuar con Google</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-left">
                    <div 
                      onClick={() => setSelectedPlan('analisis')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'analisis' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-slate-900 text-base">Auditoría Jurídica (1 Crédito)</h3>
                         <span className="text-legal-gold font-black">$49 MXN</span>
                      </div>
                      <p className="text-xs text-slate-500">Un dictamen de auditoría de documentos.</p>
                    </div>
                    
                    <div 
                      onClick={() => setSelectedPlan('draft_basic')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'draft_basic' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-slate-900 text-base">Documento Estándar (1 Crédito)</h3>
                         <span className="text-legal-gold font-black">$79 MXN</span>
                      </div>
                      <p className="text-xs text-slate-500">Generación sin instrucciones personalizadas.</p>
                    </div>

                    <div 
                      onClick={() => setSelectedPlan('mensualidad')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'mensualidad' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-slate-900 text-base">Premium Trimestral</h3>
                         <span className="text-legal-gold font-black">$1,499 MXN</span>
                      </div>
                      <p className="text-xs text-slate-500">Acceso total. Incluye 15 análisis, 30 consultas y 15 documentos al mes.</p>
                    </div>

                    <div className="text-center pt-2">
                       <button 
                         onClick={() => {
                           onClose();
                           notify("Puede adquirir una licencia más tarde desde el panel de control.", "info");
                         }}
                         className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors underline"
                       >
                         Continuar con acceso gratuito limitado
                       </button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
                        {error}
                      </div>
                    )}

                    <button 
                      onClick={handlePlanSubmit}
                      disabled={loading}
                      className="w-full bg-legal-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-70 mt-4"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          <span>Pagar y Activar Licencia</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center space-y-4">
                  <button 
                    onClick={() => {
                      setError(null);
                      setMode(mode === 'login' ? 'signup' : 'login');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-legal-950 transition-colors uppercase tracking-widest"
                  >
                    {mode === 'login' ? '¿No tiene cuenta? Regístrese' : 
                     mode === 'forgotPassword' ? 'Volver al Inicio de Sesión' :
                     '¿Ya tiene cuenta? Inicie Sesión'}
                  </button>
                  

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
