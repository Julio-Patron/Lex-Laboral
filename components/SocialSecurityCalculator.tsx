
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Heart, 
  Baby, 
  Home, 
  TrendingUp, 
  Download, 
  AlertCircle,
  Stethoscope,
  Settings2,
  Users,
  Zap
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const SocialSecurityCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const [sbc, setSbc] = useState<number>(0);
  const [riskClass, setRiskClass] = useState<number>(0); 
  const [days, setDays] = useState<number>(30);
  
  const [showRiskCalc, setShowRiskCalc] = useState(false);
  const [s_days, setS_days] = useState<number>(0); 
  const [v_factor, setV_factor] = useState<number>(28); 
  const [i_disability, setI_disability] = useState<number>(0); 
  const [d_deaths, setD_deaths] = useState<number>(0); 
  const [f_factor, setF_factor] = useState<number>(2.3); 
  const [n_workers, setN_workers] = useState<number>(1); 
  const [m_min, setM_min] = useState<number>(0.0050); 
  
  const [umaValue, setUmaValue] = useState<number>(108.57); 
  const [minWage, setMinWage] = useState<number>(248.93);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [results, setResults] = useState<{
    employer: {
      fixed: number;
      excedente: number;
      dinero: number;
      pensionados: number;
      invalidez: number;
      guarderia: number;
      riesgo: number;
      retiro: number;
      cesantia: number;
      infonavit: number;
      total: number;
    };
    employee: {
      excedente: number;
      dinero: number;
      pensionados: number;
      invalidez: number;
      cesantia: number;
      total: number;
    };
    total: number;
  } | null>(null);

  const calculate = async () => {
    if (sbc <= 0) {
      notify("El Salario Base de Cotización debe ser un número positivo", "error");
      return;
    }
    if (sbc < minWage) {
      notify(`El SBC no puede ser menor al salario mínimo ($${minWage})`, "warning");
      return;
    }
    if (riskClass === 0) {
      notify("Por favor, seleccione una Clase de Riesgo", "error");
      return;
    }

    const fixed = (umaValue * 0.204) * days;
    const excedenteBase = Math.max(0, sbc - (3 * umaValue));
    const empExcedente = (excedenteBase * 0.011) * days;
    const empDinero = (sbc * 0.007) * days;
    const empPensionados = (sbc * 0.0105) * days;
    const empInvalidez = (sbc * 0.0175) * days;
    const empGuarderia = (sbc * 0.01) * days;
    const empRiesgo = (sbc * (riskClass / 100)) * days;
    const empRetiro = (sbc * 0.02) * days;
    
    const ratio = sbc / umaValue;
    let cesantiaRate = 0.0315; 
    
    if (sbc > minWage) {
      if (ratio <= 1.50) cesantiaRate = 0.03567;
      else if (ratio <= 2.00) cesantiaRate = 0.04230;
      else if (ratio <= 2.50) cesantiaRate = 0.04894;
      else if (ratio <= 3.00) cesantiaRate = 0.05558;
      else if (ratio <= 3.50) cesantiaRate = 0.06221;
      else if (ratio <= 4.00) cesantiaRate = 0.06885;
      else cesantiaRate = 0.08241; 
    }
    
    const empCesantia = (sbc * cesantiaRate) * days;
    const empInfonavit = (sbc * 0.05) * days;

    const empTotal = fixed + empExcedente + empDinero + empPensionados + empInvalidez + empGuarderia + empRiesgo + empRetiro + empCesantia + empInfonavit;

    const workerExcedente = (excedenteBase * 0.004) * days;
    const workerDinero = (sbc * 0.0025) * days;
    const workerPensionados = (sbc * 0.00375) * days;
    const workerInvalidez = (sbc * 0.00625) * days;
    const workerCesantia = (sbc * 0.01125) * days;

    const workerTotal = workerExcedente + workerDinero + workerPensionados + workerInvalidez + workerCesantia;

    setResults({
      employer: {
        fixed,
        excedente: empExcedente,
        dinero: empDinero,
        pensionados: empPensionados,
        invalidez: empInvalidez,
        guarderia: empGuarderia,
        riesgo: empRiesgo,
        retiro: empRetiro,
        cesantia: empCesantia,
        infonavit: empInfonavit,
        total: empTotal
      },
      employee: {
        excedente: workerExcedente,
        dinero: workerDinero,
        pensionados: workerPensionados,
        invalidez: workerInvalidez,
        cesantia: workerCesantia,
        total: workerTotal
      },
      total: empTotal + workerTotal
    });

    notify("Cálculo finalizado", "success");
  };

  const calculateAnnualRisk = () => {
    if (n_workers <= 0) {
      notify("El número de trabajadores debe ser mayor a 0", "error");
      return;
    }
    const calculatedRisk = (((s_days / 365) + v_factor * (i_disability + d_deaths)) * (f_factor / n_workers)) + m_min;
    setRiskClass(Number((calculatedRisk * 100).toFixed(5)));
    setShowRiskCalc(false);
    notify(`Nueva Prima de Riesgo: ${(calculatedRisk * 100).toFixed(5)}%`, "success");
  };

  const handleExport = () => {
    if (!results) return;
    const content = `CUOTAS IMSS/INFONAVIT - LEXLABORAL\nSBC: $${sbc.toFixed(2)}\nPatrón: $${results.employer.total.toFixed(2)}\nTrabajador: $${results.employee.total.toFixed(2)}\nTotal: $${results.total.toFixed(2)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cuotas_IMSS.txt`;
    link.click();
  };

  return (
    <div className="h-full overflow-y-auto p-6 md:p-12 bg-slate-50 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-legal-gold">
               <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-serif font-extrabold text-slate-900 tracking-tight">Cálculo de Seguridad Social</h2>
              <p className="text-slate-500 text-sm font-medium mt-1 max-w-xl">Determinación técnica de cuotas IMSS e INFONAVIT.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Salario Base de Cotización (SBC)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input type="number" value={sbc || ''} onChange={(e) => setSbc(Number(e.target.value))} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold outline-none focus:bg-white focus:ring-4 focus:ring-legal-gold/5 transition-all" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clase de Riesgo</label>
                    <button onClick={() => setShowRiskCalc(!showRiskCalc)} className="text-xs font-bold text-legal-gold hover:underline">Variable</button>
                  </div>
                  <select value={riskClass} onChange={(e) => setRiskClass(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white transition-all">
                    <option value={0}>Seleccione clase...</option>
                    <option value={0.54355}>Clase I (0.54355%)</option>
                    <option value={1.13065}>Clase II (1.13065%)</option>
                    <option value={2.59840}>Clase III (2.59840%)</option>
                    <option value={4.65325}>Clase IV (4.65325%)</option>
                    <option value={7.58875}>Clase V (7.58875%)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Días</label>
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white transition-all" />
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Ajustes Constantes (2026+)</span>
                  </div>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salario Mínimo Vigente</label>
                        <input type="number" value={minWage} onChange={(e) => setMinWage(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">UMA Vigente</label>
                        <input type="number" value={umaValue} onChange={(e) => setUmaValue(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-legal-950 to-slate-900 text-legal-gold rounded-[1.5rem] font-bold shadow-2xl shadow-legal-950/20 hover:shadow-legal-950/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-wide">Proyectar Cuotas</span>
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 border-dashed p-12 text-center text-slate-300">
                  <Activity size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Complete los parámetros para ver el desglose.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patrón</span>
                      <p className="text-2xl font-serif font-bold text-slate-900 mt-2">${results.employer.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trabajador</span>
                      <p className="text-2xl font-serif font-bold text-legal-gold mt-2">${results.employee.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-legal-950 p-8 rounded-3xl shadow-xl text-center">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total</span>
                      <p className="text-2xl font-serif font-bold text-white mt-2">${results.total.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Desglose Legal</h4>
                      <button onClick={handleExport} className="p-2 text-slate-400 hover:text-legal-950 transition-colors"><Download size={20} /></button>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Concepto</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Patrón</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Trabajador</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[
                            { label: 'Enf. y Mat. (Cuota Fija)', pat: results.employer.fixed, trab: 0 },
                            { label: 'Enf. y Mat. (Excedente 3 UMA)', pat: results.employer.excedente, trab: results.employee.excedente },
                            { label: 'Enf. y Mat. (Prest. en Dinero)', pat: results.employer.dinero, trab: results.employee.dinero },
                            { label: 'Enf. y Mat. (Gastos Méd. Pens.)', pat: results.employer.pensionados, trab: results.employee.pensionados },
                            { label: 'Invalidez y Vida', pat: results.employer.invalidez, trab: results.employee.invalidez },
                            { label: 'Riesgos de Trabajo', pat: results.employer.riesgo, trab: 0 },
                            { label: 'Guarderías y Prest. Sociales', pat: results.employer.guarderia, trab: 0 },
                            { label: 'Retiro', pat: results.employer.retiro, trab: 0 },
                            { label: 'Cesantía en Edad Avanzada y Vejez', pat: results.employer.cesantia, trab: results.employee.cesantia },
                            { label: 'INFONAVIT 5%', pat: results.employer.infonavit, trab: 0 },
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6 text-sm font-medium text-slate-700">{row.label}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-500">${row.pat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-500">${row.trab.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-900">${(row.pat + row.trab).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
