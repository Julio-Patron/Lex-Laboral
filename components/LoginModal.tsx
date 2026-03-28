import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Sparkles, LogIn, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, title = "Acceso a LexMeXL", subtitle = "Sin contraseñas. Ingresa tu correo y te enviaremos un enlace mágico seguro." }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;

    setVerifying(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    setVerifying(false);

    if (error) {
      setError("Código inválido o expirado. Verifica y vuelve a intentar.");
    } else {
      setEmail('');
      setOtp('');
      setSent(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sm:items-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-legal-950 p-8 sm:p-10 pb-8 text-white z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-legal-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-legal-gold to-yellow-600 flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-serif font-bold">{title}</h2>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm relative z-10">
              {subtitle}
            </p>
          </div>

          <div className="p-8 sm:p-10 -mt-4 bg-white rounded-t-3xl relative z-10 flex flex-col">
            {sent ? (
              <div className="flex flex-col py-2 transition-all">
                 <div className="w-16 h-16 bg-legal-gold/10 text-legal-gold rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Código Enviado</h3>
                 <p className="text-slate-600 text-center text-sm mb-6">
                   Revisa el correo <strong>{email}</strong> e ingresa el código de 6 dígitos para iniciar sesión de forma segura.
                 </p>
                 
                 <form onSubmit={handleVerifyOtp} className="space-y-6">
                   <div>
                     <label htmlFor="otp" className="block text-sm font-semibold text-slate-700 mb-2">
                       Código de Verificación
                     </label>
                     <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <KeyRound size={18} className="text-legal-gold" />
                       </div>
                       <input
                         id="otp"
                         type="text"
                         required
                         value={otp}
                         onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="123456"
                         className="block w-full pl-11 pr-4 py-3 sm:text-lg tracking-widest font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-legal-gold/50 focus:border-legal-gold transition-colors text-slate-900 placeholder-slate-400 text-center"
                       />
                     </div>
                     {error && (
                       <p className="mt-2 text-sm text-red-600 font-medium text-center">{error}</p>
                     )}
                   </div>

                   <button
                     type="submit"
                     disabled={verifying || otp.length < 6}
                     className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-legal-dark to-legal-950 hover:from-legal-950 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold transition-all items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {verifying ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                       <span>Verificar Código</span>
                     )}
                   </button>
                 </form>

                 <button 
                    onClick={() => { setSent(false); setOtp(''); setError(''); }}
                    disabled={verifying}
                    className="mt-6 text-sm text-slate-500 hover:text-legal-gold transition-colors font-medium self-center focus:outline-none"
                 >
                   Usar otro correo
                 </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-legal-gold" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="abogado@estudio.com"
                      className="block w-full pl-11 pr-4 py-3 sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-legal-gold/50 focus:border-legal-gold transition-colors text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-legal-gold/20 text-sm font-bold text-white bg-gradient-to-r from-legal-dark to-legal-950 hover:from-legal-950 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold transition-all items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Continuar con mi correo</span>
                      <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
           
           <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-500">
               Al continuar, confirmas que aceptas nuestros Términos de Servicio y Políticas de Privacidad.
             </p>
           </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
