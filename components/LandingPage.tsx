import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight, Shield, Zap, FileSearch, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTryCalculator: (type: 'labor' | 'social') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onTryCalculator }) => {
  const features = [
    {
      icon: <MessageSquare className="text-legal-gold" size={20} />,
      title: "IA Jurídica 24/7",
      desc: "Consultas inmediatas sobre la LFT."
    },
    {
      icon: <FileSearch className="text-legal-gold" size={20} />,
      title: "Análisis Documental",
      desc: "Auditoría de contratos y finiquitos."
    },
    {
      icon: <Scale className="text-legal-gold" size={20} />,
      title: "Cálculos LFT 2026",
      desc: "Estimaciones exactas de ley."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-y-auto relative py-12">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_30%_-20%,rgba(212,175,55,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.1),transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-14 text-center shadow-2xl relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="w-20 h-20 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl overflow-hidden"
        >
          <img src="/assets/logo.png" alt="Lex Laboral Logo" className="w-full h-full object-cover" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight leading-tight">
          Asesoría Laboral Impulsada por <span className="text-legal-gold">IA</span>
        </h1>
        
        <p className="text-slate-400 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          La plataforma definitiva para el análisis jurídico, auditoría de documentos y cálculos de prestaciones bajo la normativa mexicana vigente.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-white/5 border border-white/5 rounded-2xl p-5 text-left hover:bg-white/10 transition-colors"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="text-white text-sm font-bold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-[11px] leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
          <button 
            onClick={onLogin}
            className="group relative flex-1 bg-legal-gold text-slate-950 hover:bg-legal-gold/90 py-4 rounded-2xl font-bold uppercase tracking-[0.1em] text-xs transition-all flex items-center justify-center space-x-3 shadow-xl overflow-hidden active:scale-[0.98]"
          >
            <span className="relative z-10">Comenzar Ahora</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => onTryCalculator('labor')}
            className="flex-1 bg-white/5 text-white border border-white/10 hover:border-white/20 hover:bg-white/10 py-4 rounded-2xl font-bold uppercase tracking-[0.1em] text-[11px] transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Scale size={16} className="text-legal-gold" />
            <span>Calculadora Libre</span>
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex justify-center space-x-8">
          <span className="flex items-center gap-2"><Shield size={12} className="text-emerald-500/50" /> LFT 2026</span>
          <span>SOPORTE MÉXICO</span>
        </div>
      </motion.div>
    </div>
  );
};
