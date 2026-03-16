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
      title: "Consultoría Estratégica",
      desc: "Respuestas fundamentadas en la LFT, Jurisprudencia y Tesis Aisladas."
    },
    {
      icon: <FileSearch className="text-legal-gold" size={20} />,
      title: "Auditoría de Riesgos",
      desc: "Detección automática de cláusulas vulnerables en contratos y convenios."
    },
    {
      icon: <Scale className="text-legal-gold" size={20} />,
      title: "Cálculo de Prestaciones",
      desc: "Cuantificación precisa de finiquitos, liquidaciones y salarios caídos."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-y-auto relative py-12">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_30%_-20%,rgba(212,175,55,0.1),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-3xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-black/50"
        >
          <img src="/assets/logo.png" alt="Lex Laboral Logo" className="w-16 h-16 object-contain" />
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight leading-tight">
          Inteligencia Artificial para la <span className="text-transparent bg-clip-text bg-gradient-to-r from-legal-gold to-yellow-200">Excelencia Jurídica</span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-light">
          Potencie su práctica legal con herramientas de análisis predictivo, automatización documental y cálculo forense bajo la normativa mexicana vigente.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-white/5 border border-white/5 rounded-2xl p-6 text-left hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
            >
              <div className="mb-4 p-3 bg-slate-900/50 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="text-white text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <button 
            onClick={onLogin}
            className="group relative flex-1 bg-gradient-to-r from-legal-gold to-yellow-600 text-white hover:brightness-110 py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center space-x-3 shadow-lg shadow-legal-gold/20 active:scale-[0.98]"
          >
            <span>Acceso Profesional</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => onTryCalculator('labor')}
            className="flex-1 bg-transparent text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Scale size={16} />
            <span>Herramientas Gratuitas</span>
          </button>
        </div>

        <div className="mt-14 pt-8 border-t border-white/5 text-[10px] font-medium text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-6">
          <span className="flex items-center gap-2"><Shield size={12} className="text-emerald-500/60" /> Actualizado LFT 2026</span>
          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
          <span>Desarrollado para Abogados y RH</span>
        </div>
      </motion.div>
    </div>
  );
};
