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
          className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl overflow-hidden"
        >
          <img src="/assets/logo.png" alt="Lex Laboral Logo" className="w-full h-full object-cover" />
        </motion.div>
        
        <h1 className="text-4xl font-serif font-bold text-white mb-2 tracking-tight">
          Lex Laboral
        </h1>
        <p className="text-legal-gold/80 text-sm font-medium mb-12 uppercase tracking-[0.05em] px-4 leading-relaxed">
          Asesoría integral de derecho Laboral
        </p>
        
        <button 
          onClick={() => onTryCalculator('labor')}
          className="group relative w-full bg-slate-950 text-legal-gold border border-legal-gold/30 hover:border-legal-gold py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(197,164,126,0.1)] overflow-hidden active:scale-95"
        >
          <span className="relative z-10 text-[13px]">Explorar Herramientas Gratuitas</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-legal-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </motion.div>
      
      <div className="absolute bottom-8 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex space-x-6">
        <span>LFT 2026</span>
        <span>MÉXICO</span>
      </div>
    </div>
  );
};
