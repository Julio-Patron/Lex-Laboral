import React from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight, Shield, FileSearch, MessageSquare } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onTryCalculator: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onTryCalculator }) => {
  const features = [
    {
      icon: <MessageSquare className="text-legal-gold" size={18} />,
      title: "Consultoría Estratégica",
      desc: "Respuestas fundamentadas en LFT y Jurisprudencia."
    },
    {
      icon: <FileSearch className="text-legal-gold" size={18} />,
      title: "Auditoría de Riesgos",
      desc: "Detección de cláusulas vulnerables en contratos."
    },
    {
      icon: <Scale className="text-legal-gold" size={18} />,
      title: "Cálculo de Prestaciones",
      desc: "Cuantificación precisa de finiquitos y liquidaciones."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto py-10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_30%_-20%,rgba(212,175,55,0.1),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-3xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/50">
          <img src="/assets/logo.png" alt="Lex Laboral Logo" className="w-12 h-12 object-contain" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
          Lex Laboral
        </h1>
        
        <p className="text-legal-gold text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium tracking-wide">
          Asesoría integral en Derecho Laboral
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-white/5 border border-white/5 rounded-xl p-4 text-left hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
            >
              <div className="mb-3 p-2 bg-slate-900/50 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="text-white text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <button 
            onClick={onLogin}
            className="group relative flex-1 bg-gradient-to-r from-legal-gold to-yellow-600 text-white hover:brightness-110 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-legal-gold/20 active:scale-[0.98]"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={onTryCalculator}
            className="flex-1 bg-transparent text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Scale size={16} />
            <span>Calcula tus Prestaciones</span>
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-[10px] font-medium text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-6">
          <span className="flex items-center gap-2"><Shield size={12} className="text-emerald-500/60" /> LFT 2026</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>Soporte México</span>
        </div>
      </motion.div>
    </div>
  );
};
