import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight, Shield } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTryCalculator: (type: 'labor' | 'social') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onTryCalculator }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_-20%,rgba(212,175,55,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.1),transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="w-20 h-20 bg-gradient-to-br from-legal-gold to-legal-goldhover rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-legal-gold/20"
        >
          <Scale className="text-slate-900" size={40} />
        </motion.div>
        
        <h1 className="text-4xl font-serif font-bold text-white mb-12 tracking-tight">
          Lex Laboral
        </h1>
        
        <button 
          onClick={() => onTryCalculator('labor')}
          className="group relative w-full bg-legal-gold hover:bg-legal-goldhover text-slate-900 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-3 shadow-xl overflow-hidden active:scale-95"
        >
          <span className="relative z-10 text-[14px]">Entrar al Sistema</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </motion.div>
      
      <div className="absolute bottom-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex space-x-6">
        <span>LFT 2026</span>
        <span>MÉXICO</span>
      </div>
    </div>
  );
};
