
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
  Users,
  Zap
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const SocialSecurityCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  user?: any;
  userData?: any;
  onAuthRequired?: () => void;
}> = ({ notify, user, userData, onAuthRequired }) => {
  const [sbc, setSbc] = useState<number>(0);
  const [riskClass, setRiskClass] = useState<number>(0); // 0 means not selected
  const [days, setDays] = useState<number>(30);
  
  // Annual Risk Premium Calculation States
  const [showRiskCalc, setShowRiskCalc] = useState(false);
  const [s_days, setS_days] = useState<number>(0); // Días subsidiados
  const [v_factor, setV_factor] = useState<number>(28); // Factor 28
  const [i_disability, setI_disability] = useState<number>(0); // Suma de porcentajes de incapacidades
  const [d_deaths, setD_deaths] = useState<number>(0); // Defunciones
  const [f_factor, setF_factor] = useState<number>(2.3); // Factor 2.3
  const [n_workers, setN_workers] = useState<number>(1); // Trabajadores expuestos
  const [m_min, setM_min] = useState<number>(0.0050); // Prima mínima
  
  const UMA = 119.35; // Valor UMA Vigente 2026 (Proyectado)
  const MIN_WAGE = 312.41; // Salario Mínimo General Vigente 2026 (Proyectado)

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
    if (sbc < MIN_WAGE) {
      notify(`El SBC no puede ser menor al salario mínimo ($${MIN_WAGE})`, "warning");
      return;
    }
    if (riskClass === 0) {
      notify("Por favor, seleccione una Clase de Riesgo", "error");
      return;
    }

    const isPremiumValid = userData?.isPremium && (!userData?.expiresAt || (userData.expiresAt.toDate ? userData.expiresAt.toDate() : new Date(userData.expiresAt)) >= new Date());
    
    if (!isPremiumValid) {
      if (!user) {
        const usageKey = `lex_laboral_ss_calc_anon`;
        const currentUsage = parseInt(localStorage.getItem(usageKey) || '0');
        if (currentUsage >= 2) {
          notify("Límite de cálculos gratuitos (2) alcanzado. Inicie sesión para continuar.", "warning");
          if (onAuthRequired) onAuthRequired();
          return;
        }
        localStorage.setItem(usageKey, (currentUsage + 1).toString());
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';
          const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/calculator`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (!response.ok) {
            notify(data.error || "Límite de cálculos diarios superado.", "warning");
            return;
          }
        } catch (error) {
          console.error("Error validando limite:", error);
          notify("Error de conexión al validar límites.", "error");
          return;
        }
      }
    }

    // Employer Calculations
    const fixed = (UMA * 0.204) * days;
    const excedenteBase = Math.max(0, sbc - (3 * UMA));
    const empExcedente = (excedenteBase * 0.011) * days;
    const empDinero = (sbc * 0.007) * days;
    const empPensionados = (sbc * 0.0105) * days;
    const empInvalidez = (sbc * 0.0175) * days;
    const empGuarderia = (sbc * 0.01) * days;
    const empRiesgo = (sbc * (riskClass / 100)) * days;
    const empRetiro = (sbc * 0.02) * days;
    
    // Cesantía y Vejez Patronal (Tabla Progresiva 2026 - Art. 168 LSS)
    const ratio = sbc / UMA;
    let cesantiaRate = 0.0315; // Base para Salario Mínimo
    
    if (sbc > MIN_WAGE) {
      if (ratio <= 1.50) cesantiaRate = 0.03899;
      else if (ratio <= 2.00) cesantiaRate = 0.04246;
      else if (ratio <= 2.50) cesantiaRate = 0.04593;
      else if (ratio <= 3.00) cesantiaRate = 0.04939;
      else if (ratio <= 3.50) cesantiaRate = 0.05286;
      else if (ratio <= 4.00) cesantiaRate = 0.05633;
      else cesantiaRate = 0.06326; // Tope para > 4.01 UMA en 2026
    }
    
    const empCesantia = (sbc * cesantiaRate) * days;
    
    const empInfonavit = (sbc * 0.05) * days;

    const empTotal = fixed + empExcedente + empDinero + empPensionados + empInvalidez + empGuarderia + empRiesgo + empRetiro + empCesantia + empInfonavit;

    // Employee Calculations
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

    notify("Cálculo de cuotas IMSS/INFONAVIT finalizado", "success");
  };

  const calculateAnnualRisk = () => {
    if (n_workers <= 0) {
      notify("El número de trabajadores debe ser mayor a 0", "error");
      return;
    }
    
    // Formula: Prima = [(S/365) + V * (I + D)] * (F/N) + M
    const calculatedRisk = (((s_days / 365) + v_factor * (i_disability + d_deaths)) * (f_factor / n_workers)) + m_min;
    
    // The risk premium cannot decrease or increase more than 1% per year (simplified here by just setting it)
    // We'll set it as the current riskClass for the SS calculation
    setRiskClass(Number((calculatedRisk * 100).toFixed(5)));
    setShowRiskCalc(false);
    notify(`Nueva Prima de Riesgo calculada: ${(calculatedRisk * 100).toFixed(5)}%`, "success");
  };

  const handleExport = () => {
    if (!results) return;
    const content = `CÁLCULO DE CUOTAS OBRERO-PATRONALES - LEXLABORAL
Fecha: ${new Date().toLocaleDateString()}
Periodo: ${days} días

DATOS DE ENTRADA:
SBC: $${sbc.toFixed(2)}
UMA: $${UMA.toFixed(2)}
Prima Riesgo: ${riskClass}%

CUOTAS PATRONALES:
- Cuota Fija: $${results.employer.fixed.toFixed(2)}
- Enf. y Mat. (Excedente): $${results.employer.excedente.toFixed(2)}
- Prestaciones en Dinero: $${results.employer.dinero.toFixed(2)}
- Gastos Médicos Pensionados: $${results.employer.pensionados.toFixed(2)}
- Invalidez y Vida: $${results.employer.invalidez.toFixed(2)}
- Guarderías y Soc.: $${results.employer.guarderia.toFixed(2)}
- Riesgo de Trabajo: $${results.employer.riesgo.toFixed(2)}
- Retiro: $${results.employer.retiro.toFixed(2)}
- Cesantía y Vejez: $${results.employer.cesantia.toFixed(2)}
- INFONAVIT: $${results.employer.infonavit.toFixed(2)}
TOTAL PATRÓN: $${results.employer.total.toFixed(2)}

CUOTAS OBRERAS:
- Enf. y Mat. (Excedente): $${results.employee.excedente.toFixed(2)}
- Prestaciones en Dinero: $${results.employee.dinero.toFixed(2)}
- Gastos Médicos Pensionados: $${results.employee.pensionados.toFixed(2)}
- Invalidez y Vida: $${results.employee.invalidez.toFixed(2)}
- Cesantía y Vejez: $${results.employee.cesantia.toFixed(2)}
TOTAL TRABAJADOR: $${results.employee.total.toFixed(2)}

TOTAL GLOBAL: $${results.total.toFixed(2)}

---
FUNDAMENTACIÓN: Ley del Seguro Social (LSS) y Ley del INFONAVIT.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cuotas_IMSS_${new Date().getTime()}.txt`;
    link.click();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
               <ShieldCheck className="text-legal-gold" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Calculadora de Seguridad Social</h2>
              <p className="text-slate-500 text-sm font-medium">Determinación de cuotas IMSS e INFONAVIT (LSS).</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-slate-900 mb-2">
                <TrendingUp size={18} className="text-legal-gold" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Parámetros de Cotización</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salario Base de Cotización (SBC)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold group-focus-within:text-legal-gold transition-colors">$</span>
                    <input 
                      type="number" 
                      value={sbc || ''} 
                      onChange={(e) => setSbc(Number(e.target.value))}
                      className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        sbc < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {sbc < 0 && (
                    <p className="text-[10px] text-red-500 font-bold animate-pulse">El SBC no puede ser negativo</p>
                  )}
                  {sbc > 0 && sbc < MIN_WAGE && (
                    <p className="text-[10px] text-amber-500 font-bold">Menor al mínimo legal (${MIN_WAGE})</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clase de Riesgo (Prima %)</label>
                    <button 
                      onClick={() => setShowRiskCalc(!showRiskCalc)}
                      className="text-[9px] font-bold text-legal-gold hover:underline flex items-center gap-1"
                    >
                      <Zap size={10} /> Calcular Variable
                    </button>
                  </div>
                  
                  {showRiskCalc ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in shadow-inner">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Días Subsidiados (S)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={s_days} 
                            onChange={e => setS_days(Number(e.target.value))} 
                            className={`w-full p-2.5 bg-white border rounded-lg text-xs outline-none transition-all ${s_days < 0 ? 'border-red-500' : 'border-slate-200 focus:border-legal-gold'}`} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Incapacidades (I)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={i_disability} 
                            onChange={e => setI_disability(Number(e.target.value))} 
                            className={`w-full p-2.5 bg-white border rounded-lg text-xs outline-none transition-all ${i_disability < 0 ? 'border-red-500' : 'border-slate-200 focus:border-legal-gold'}`} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Defunciones (D)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={d_deaths} 
                            onChange={e => setD_deaths(Number(e.target.value))} 
                            className={`w-full p-2.5 bg-white border rounded-lg text-xs outline-none transition-all ${d_deaths < 0 ? 'border-red-500' : 'border-slate-200 focus:border-legal-gold'}`} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-400 uppercase">Trabajadores (N)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={n_workers} 
                            onChange={e => setN_workers(Number(e.target.value))} 
                            className={`w-full p-2.5 bg-white border rounded-lg text-xs outline-none transition-all ${n_workers <= 0 ? 'border-red-500' : 'border-slate-200 focus:border-legal-gold'}`} 
                          />
                        </div>
                      </div>
                      <button 
                        onClick={calculateAnnualRisk}
                        disabled={s_days < 0 || i_disability < 0 || d_deaths < 0 || n_workers <= 0}
                        className="w-full py-3 bg-legal- gold text-white text-[11px] font-bold rounded-xl hover:bg-legal-goldhover hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                      >
                        Aplicar Cálculo Anual
                      </button>
                    </div>
                  ) : (
                    <select 
                      value={riskClass}
                      onChange={(e) => setRiskClass(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        riskClass === 0 && results === null
                          ? 'border-slate-200 focus:border-legal-gold'
                          : riskClass === 0
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-slate-200 focus:border-legal-gold'
                      }`}
                    >
                      <option value={0}>Seleccione una clase...</option>
                      <option value={0.54355}>Clase I (0.54355%)</option>
                      <option value={1.13065}>Clase II (1.13065%)</option>
                      <option value={2.59840}>Clase III (2.59840%)</option>
                      <option value={4.65325}>Clase IV (4.65325%)</option>
                      <option value={7.58875}>Clase V (7.58875%)</option>
                      {riskClass !== 0 && ![0.54355, 1.13065, 2.5984, 4.65325, 7.58875].includes(riskClass) && (
                        <option value={riskClass}>Personalizada ({riskClass}%)</option>
                      )}
                    </select>
                  )}
                  {riskClass === 0 && !showRiskCalc && (
                    <p className="text-[10px] text-slate-400 italic">Obligatorio para Riesgo de Trabajo</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días del Periodo</label>
                  <input 
                    type="number" 
                    min="0"
                    value={days} 
                    onChange={(e) => setDays(Number(e.target.value))}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                      days < 0 
                        ? 'border-red-500 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                    }`}
                  />
                  {days < 0 && (
                    <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                  )}
                </div>
              </div>

              <button 
                onClick={calculate}
                disabled={sbc <= 0 || days < 0 || riskClass === 0}
                className="w-full py-4 bg-legal-950 text-legal-gold rounded-xl font-bold shadow-lg shadow-legal-950/20 hover:bg-legal-900 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <ShieldCheck size={18} />
                <span>Calcular Cuotas</span>
              </button>
            </section>

            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Referencia 2026:</strong> UMA: ${UMA.toFixed(2)}. Los cálculos de Cesantía Patronal utilizan las nuevas tablas progresivas vigentes.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 bg-white rounded-[2rem] border border-slate-200 p-12 border-dashed"
                >
                  <Activity size={48} className="text-slate-100 mb-4" />
                  <p className="text-sm font-medium text-slate-400">Ingrese el SBC para determinar la carga social.</p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carga Patronal</span>
                      <p className="text-2xl font-serif font-bold text-slate-900 mt-1">${results.employer.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retención Obrera</span>
                      <p className="text-2xl font-serif font-bold text-legal-gold mt-1">${results.employee.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-legal-950 p-6 rounded-3xl shadow-lg">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Costo Total</span>
                      <p className="text-2xl font-serif font-bold text-white mt-1">${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Desglose por Rama de Seguro</h4>
                      <button onClick={handleExport} className="text-xs font-bold text-legal-gold flex items-center gap-2 hover:text-legal-goldhover hover:underline transition-colors active:scale-95">
                        <Download size={14} /> Descargar PDF/TXT
                      </button>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase">Rama</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">Patrón</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase text-right">Trabajador</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          <tr className="border-b border-slate-50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Stethoscope size={14} /></div>
                              <span className="font-medium text-slate-700">Enfermedad y Maternidad</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono">${(results.employer.fixed + results.employer.excedente + results.employer.dinero + results.employer.pensionados).toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">${(results.employee.excedente + results.employee.dinero + results.employee.pensionados).toFixed(2)}</td>
                          </tr>
                          <tr className="border-b border-slate-50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg"><Heart size={14} /></div>
                              <span className="font-medium text-slate-700">Invalidez y Vida</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono">${results.employer.invalidez.toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">${results.employee.invalidez.toFixed(2)}</td>
                          </tr>
                          <tr className="border-b border-slate-50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><Activity size={14} /></div>
                              <span className="font-medium text-slate-700">Riesgo de Trabajo</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono">${results.employer.riesgo.toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">$0.00</td>
                          </tr>
                          <tr className="border-b border-slate-50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Users size={14} /></div>
                              <span className="font-medium text-slate-700">Retiro, Cesantía y Vejez</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono">${(results.employer.retiro + results.employer.cesantia).toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">${results.employee.cesantia.toFixed(2)}</td>
                          </tr>
                          <tr className="border-b border-slate-50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg"><Baby size={14} /></div>
                              <span className="font-medium text-slate-700">Guarderías y Soc.</span>
                            </td>
                            <td className="p-4 text-right text-slate-600 font-mono">${results.employer.guarderia.toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">$0.00</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="p-4 flex items-center gap-3">
                              <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><Home size={14} /></div>
                              <span className="font-medium text-slate-700 font-bold">INFONAVIT</span>
                            </td>
                            <td className="p-4 text-right text-slate-900 font-bold font-mono">${results.employer.infonavit.toFixed(2)}</td>
                            <td className="p-4 text-right text-slate-600 font-mono">$0.00</td>
                          </tr>
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
