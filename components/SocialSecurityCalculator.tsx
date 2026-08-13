
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel, WorkspaceStat } from './ui/Workspace';
import { calculateSocialSecurity, calculateAnnualRisk, type SocialSecurityInput, type RiskCalculationInput } from '../lib/calculators/social-security';

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
  
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
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

    const input: SocialSecurityInput = { sbc, riskClass, days, umaValue, minWage };
    const results = calculateSocialSecurity(input);
    setResults(results);

    notify("Cálculo finalizado", "success");
  };

  const calculateAnnualRiskValue = () => {
    if (n_workers <= 0) {
      notify("El número de trabajadores debe ser mayor a 0", "error");
      return;
    }
    const input: RiskCalculationInput = { s_days, v_factor, i_disability, d_deaths, f_factor, n_workers, m_min };
    const calculatedRisk = calculateAnnualRisk(input);
    setRiskClass(calculatedRisk);
    setShowRiskCalc(false);
    notify(`Nueva Prima de Riesgo: ${(calculatedRisk).toFixed(5)}%`, "success");
  };

  const handleExport = () => {
    if (!results) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Cálculo de Cuotas IMSS / INFONAVIT', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`SBC (Salario Base Cotización): $${sbc.toFixed(2)}`, 14, 32);
    doc.text(`Días Cotizados: ${days}`, 14, 38);
    doc.text(`Clase de Riesgo: ${riskClass}%`, 14, 44);
    
    autoTable(doc, {
      startY: 54,
      head: [['Concepto', 'Patrón', 'Trabajador', 'Total']],
      body: [
        ['Enf. y Mat. (Cuota Fija)', `$${results.employer.fixed.toFixed(2)}`, '$0.00', `$${results.employer.fixed.toFixed(2)}`],
        ['Enf. y Mat. (Excedente)', `$${results.employer.excedente.toFixed(2)}`, `$${results.employee.excedente.toFixed(2)}`, `$${(results.employer.excedente + results.employee.excedente).toFixed(2)}`],
        ['Enf. y Mat. (Prest. Dinero)', `$${results.employer.dinero.toFixed(2)}`, `$${results.employee.dinero.toFixed(2)}`, `$${(results.employer.dinero + results.employee.dinero).toFixed(2)}`],
        ['Enf. y Mat. (Gastos Méd.)', `$${results.employer.pensionados.toFixed(2)}`, `$${results.employee.pensionados.toFixed(2)}`, `$${(results.employer.pensionados + results.employee.pensionados).toFixed(2)}`],
        ['Invalidez y Vida', `$${results.employer.invalidez.toFixed(2)}`, `$${results.employee.invalidez.toFixed(2)}`, `$${(results.employer.invalidez + results.employee.invalidez).toFixed(2)}`],
        ['Riesgos de Trabajo', `$${results.employer.riesgo.toFixed(2)}`, '$0.00', `$${results.employer.riesgo.toFixed(2)}`],
        ['Guarderías y Prest.', `$${results.employer.guarderia.toFixed(2)}`, '$0.00', `$${results.employer.guarderia.toFixed(2)}`],
        ['Retiro', `$${results.employer.retiro.toFixed(2)}`, '$0.00', `$${results.employer.retiro.toFixed(2)}`],
        ['Cesantía y Vejez', `$${results.employer.cesantia.toFixed(2)}`, `$${results.employee.cesantia.toFixed(2)}`, `$${(results.employer.cesantia + results.employee.cesantia).toFixed(2)}`],
        ['INFONAVIT 5%', `$${results.employer.infonavit.toFixed(2)}`, '$0.00', `$${results.employer.infonavit.toFixed(2)}`],
      ],
      foot: [[
        'Total', 
        `$${results.employer.total.toFixed(2)}`, 
        `$${results.employee.total.toFixed(2)}`, 
        `$${results.total.toFixed(2)}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    doc.save('Cuotas_IMSS.pdf');
    notify('PDF generado correctamente', 'success');
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora IMSS"
        title="IMSS e INFONAVIT"
        description="Proyecta cuotas y reparto patrón-trabajador con vigencia 2026."
        icon={<ShieldCheck size={28} />}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 space-y-6 lg:col-span-4 lg:space-y-8">
            <WorkspacePanel className="space-y-6 p-5 sm:p-8 lg:space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Datos de cotización</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Proyección rápida</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="ui-label">Salario Base de Cotización (SBC)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input type="number" value={sbc || ''} onChange={(e) => setSbc(Number(e.target.value))} className="ui-input w-full pl-10 pr-4 text-lg font-bold" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="ui-label px-0">Clase de riesgo</label>
                    <button onClick={() => setShowRiskCalc(!showRiskCalc)} className="text-xs font-bold text-legal-gold hover:underline">Variable</button>
                  </div>
                  <select value={riskClass} onChange={(e) => setRiskClass(Number(e.target.value))} className="ui-input">
                    <option value={0}>Seleccione clase...</option>
                    <option value={0.54355}>Clase I (0.54355%)</option>
                    <option value={1.13065}>Clase II (1.13065%)</option>
                    <option value={2.59840}>Clase III (2.59840%)</option>
                    <option value={4.65325}>Clase IV (4.65325%)</option>
                    <option value={7.58875}>Clase V (7.58875%)</option>
                  </select>
                </div>

                <AnimatePresence>
                  {showRiskCalc && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ui-subtle-block space-y-5 overflow-hidden p-4 sm:p-6"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Prima de riesgo variable</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Captura los datos anuales para estimar la prima y aplicarla al cálculo.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="ui-label">Días subsidiados</label>
                          <input type="number" value={s_days || ''} onChange={(e) => setS_days(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="ui-label">Factor V</label>
                          <input type="number" value={v_factor || ''} onChange={(e) => setV_factor(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="ui-label">Incapacidades</label>
                          <input type="number" value={i_disability || ''} onChange={(e) => setI_disability(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="ui-label">Defunciones</label>
                          <input type="number" value={d_deaths || ''} onChange={(e) => setD_deaths(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="ui-label">Factor F</label>
                          <input type="number" value={f_factor || ''} onChange={(e) => setF_factor(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="ui-label">Trabajadores</label>
                          <input type="number" value={n_workers || ''} onChange={(e) => setN_workers(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="ui-label">Prima mínima</label>
                        <input type="number" value={m_min || ''} onChange={(e) => setM_min(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" step="0.0001" />
                      </div>

                      <button
                        onClick={calculateAnnualRiskValue}
                        className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 shadow-sm transition-all hover:bg-slate-100"
                      >
                        Aplicar prima
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <label className="ui-label">Días</label>
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="ui-input" />
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-500 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Constantes 2026</span>
                  </div>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block space-y-4 overflow-hidden p-4 sm:p-6">
                      <div className="space-y-2">
                        <label className="ui-label">Salario mínimo vigente</label>
                        <input type="number" value={minWage} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="ui-label">UMA vigente</label>
                        <input type="number" value={umaValue} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-legal-950 to-slate-900 text-legal-gold rounded-[1.5rem] font-bold shadow-2xl shadow-legal-950/20 hover:shadow-legal-950/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-wide">Calcular cuotas</span>
                </button>
              </div>
            </WorkspacePanel>
          </div>

          <div className="min-w-0 lg:col-span-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <WorkspaceEmpty
                  icon={<Activity size={42} />}
                  title="Tu proyección aparecerá aquí"
                  description="Captura SBC, riesgo y días para ver cuotas patronales y obreras."
                />
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                    <WorkspaceStat label="Patrón" value={`$${results.employer.total.toLocaleString()}`} />
                    <WorkspaceStat label="Trabajador" value={`$${results.employee.total.toLocaleString()}`} emphasis="accent" />
                    <WorkspaceStat label="Total" value={`$${results.total.toLocaleString()}`} emphasis="inverse" />
                  </div>

                  <WorkspacePanel className="overflow-hidden rounded-[2.4rem]">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-50 p-5 sm:p-8">
                      <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-900">Desglose de cuotas</h4>
                      <button onClick={handleExport} className="p-2 text-slate-400 hover:text-legal-950 transition-colors"><Download size={20} /></button>
                    </div>
                    <div className="p-0 overflow-x-auto no-scrollbar">
                      <table className="w-full min-w-[560px] text-left lg:min-w-0">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400 sm:p-6">Concepto</th>
                            <th className="p-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400 sm:p-6">Patrón</th>
                            <th className="p-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400 sm:p-6">Trabajador</th>
                            <th className="p-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400 sm:p-6">Total</th>
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
                              <td className="p-4 text-sm font-medium text-slate-700 sm:p-6">{row.label}</td>
                              <td className="p-4 text-right font-serif font-bold text-slate-500 sm:p-6">${row.pat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-4 text-right font-serif font-bold text-slate-500 sm:p-6">${row.trab.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-4 text-right font-serif font-bold text-slate-900 sm:p-6">${(row.pat + row.trab).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WorkspacePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      

      <SEOContentSection
        title="Calculadora de cuotas IMSS e INFONAVIT"
        intro="La calculadora IMSS permite estimar cuotas obrero-patronales con desglose por ramo de aseguramiento y aporta una base útil para revisión patronal, auditoría interna y validación preliminar de costos de nómina. También incluye apoyo para proyectar la prima de riesgo de trabajo."
        highlights={[
          {
            title: 'Cuotas obrero-patronales',
            body: 'Desglosa enfermedad y maternidad, invalidez y vida, retiro, cesantía, guarderías, prestaciones sociales e INFONAVIT.',
          },
          {
            title: 'Prima de riesgo',
            body: 'Permite trabajar con clase de riesgo fija o variable para estimar escenarios de cotización y revisar impactos mensuales.',
          },
          {
            title: 'Acceso del producto',
            body: 'Esta herramienta es gratuita y está disponible para cualquier usuario sin registro ni plan de pago.',
          },
        ]}
        faqs={[
          {
            question: 'Que calcula esta calculadora IMSS?',
            answer: 'Calcula las cuotas del patrón y del trabajador a partir del salario base de cotización, la UMA, la clase de riesgo, los días cotizados y otros parámetros de seguridad social.',
          },
          {
            question: 'La calculadora IMSS es gratis?',
            answer: 'Sí. Todas las calculadoras de Lex Laboral son gratuitas y no requieren registro.',
          },
          {
            question: 'Sirve como determinacion definitiva ante el IMSS?',
            answer: 'No. Es una herramienta de apoyo técnico para estimación y revisión. La determinación final depende de la integración salarial, movimientos afiliatorios y circunstancias concretas del patrón.',
          },
        ]}
      />
    </WorkspacePage>
  );
};
