import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
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

  // Sync mode if it changes from outside when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'audit' | 'draft_basic' | 'draft_custom' | '3-months'>('3-months');

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Note: redirectTo will handle the modal closing
    } catch (error: any) {
      console.error('Google Auth error:', error);
      setError(error.message || "Error en la autenticación con Google");
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
                  </form>
                ) : (
                  <div className="space-y-4 text-left">
                    <div 
                      onClick={() => setSelectedPlan('audit')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'audit' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
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
                      onClick={() => setSelectedPlan('draft_custom')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === 'draft_custom' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-slate-900 text-base">Documento A Medida (1 Crédito)</h3>
                         <span className="text-legal-gold font-black">$299 MXN</span>
                      </div>
                      <p className="text-xs text-slate-500">Generación con instrucciones específicas.</p>
                    </div>

                    <div 
                      onClick={() => setSelectedPlan('3-months')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === '3-months' ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                         <h3 className="font-bold text-slate-900 text-base">Premium Trimestral</h3>
                         <span className="text-legal-gold font-black">$1,499 MXN</span>
                      </div>
                      <p className="text-xs text-slate-500">Acceso total. Incluye 50 auditorías, 50 redacciones y 100 consultas y análisis jurídico.</p>
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
                  
                  {mode !== 'forgotPassword' && mode !== 'planSelection' && (
                    <button 
                      type="button"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                      className="w-full py-3.5 bg-white border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center relative overflow-hidden active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      <div className="absolute left-1 top-1 bottom-1 w-12 flex items-center justify-center bg-white rounded-xl">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      </div>
                      <span>{mode === 'login' ? 'Acceder con Google' : 'Continuar con Google'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
