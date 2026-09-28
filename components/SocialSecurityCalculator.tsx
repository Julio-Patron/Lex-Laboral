
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Activity,
    CheckCircle2,
    Download,
    Settings2,
    ShieldCheck,
    TrendingUp,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { NotificationType } from '../types';

import { calculateAnnualRisk, calculateSocialSecurity, type RiskCalculationInput, type SocialSecurityInput } from '../lib/calculators/social-security';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { trackEvent } from '../lib/analytics';
import { AdBanner } from './AdBanner';
import { SEOContentSection } from './SEOContentSection';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel, WorkspaceStat } from './ui/Workspace';

const riskPresets = [
  { label: 'Oficina', hint: 'Clase I', value: 0.54355 },
  { label: 'Comercio', hint: 'Clase II', value: 1.13065 },
  { label: 'Industria', hint: 'Clase III', value: 2.59840 },
  { label: 'Construcción', hint: 'Clase IV', value: 4.65325 },
];

const formatCurrency = (value: number) =>
  value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SocialSecurityCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);
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

  const [isEditing, setIsEditing] = useState(true);

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

  const revealResults = () => {
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const loadExample = () => {
    const exampleInput: SocialSecurityInput = {
      sbc: 650,
      riskClass: 1.13065,
      days: 30,
      umaValue: MEXICO_LABOR_DEFAULTS_2026.uma,
      minWage: MEXICO_LABOR_DEFAULTS_2026.minWage,
    };

    setSbc(650);
    setRiskClass(1.13065);
    setDays(30);
    setShowRiskCalc(false);
    setShowAdvanced(false);
    setMinWage(MEXICO_LABOR_DEFAULTS_2026.minWage);
    setUmaValue(MEXICO_LABOR_DEFAULTS_2026.uma);

    setResults(calculateSocialSecurity(exampleInput));
    setIsEditing(false);
    notify('Ejemplo calculado para IMSS e INFONAVIT', 'success');
    revealResults();
  };

  const applyRiskPreset = (value: number) => {
    setRiskClass(value);
    setResults(null);
    setIsEditing(true);
  };

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
    setIsEditing(false);

    trackEvent('social_security_used', {
      risk_class: riskClass,
      days,
    });

    notify("Cálculo finalizado", "success");
    revealResults();
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
    
    doc.setFontSize(16);
    doc.text('Estimación de Cuotas IMSS e INFONAVIT', 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('HERRAMIENTA PRIVADA E INDEPENDIENTE · NO OFICIAL', 14, 26);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`SBC (Salario Base Cotización): $${sbc.toFixed(2)}`, 14, 33);
    doc.text(`Días Cotizados: ${days}`, 14, 39);
    doc.text(`Clase de Riesgo: ${riskClass}%`, 14, 45);
    
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

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 220;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, 182, 38, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('AVISO LEGAL, DESLINDE GUBERNAMENTAL Y FUENTES OFICIALES:', 18, finalY + 7);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const disclaimerLines = [
      '1. Lex Laboral es una herramienta de cálculo de iniciativa privada e independiente.',
      '2. NO representa ni está afiliada al Instituto Mexicano del Seguro Social (IMSS) ni al INFONAVIT.',
      '3. Los resultados son estimaciones informativas y no sustituyen las cédulas oficiales emitidas por el SUA o IDSE.',
      '4. Fuentes oficiales gubernamentales (.gob.mx):',
      '   - Instituto Mexicano del Seguro Social: https://www.imss.gob.mx/',
      '   - INFONAVIT: https://portalmx.infonavit.org.mx/',
      '   - Ley del Seguro Social: https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf',
    ];
    doc.text(disclaimerLines, 18, finalY + 12);
    
    doc.save('LexLaboral_Cuotas_IMSS.pdf');
    trackEvent('export_pdf', { tool: 'imss' });
    notify('PDF generado correctamente', 'success');
  };

  const contributionRows = results ? [
    { group: 'IMSS', label: 'Enfermedad y maternidad: cuota fija', pat: results.employer.fixed, trab: 0 },
    { group: 'IMSS', label: 'Enfermedad y maternidad: excedente de 3 UMA', pat: results.employer.excedente, trab: results.employee.excedente },
    { group: 'IMSS', label: 'Enfermedad y maternidad: prestaciones en dinero', pat: results.employer.dinero, trab: results.employee.dinero },
    { group: 'IMSS', label: 'Gastos médicos para pensionados', pat: results.employer.pensionados, trab: results.employee.pensionados },
    { group: 'IMSS', label: 'Invalidez y vida', pat: results.employer.invalidez, trab: results.employee.invalidez },
    { group: 'IMSS', label: 'Riesgos de trabajo', pat: results.employer.riesgo, trab: 0 },
    { group: 'IMSS', label: 'Guarderías y prestaciones sociales', pat: results.employer.guarderia, trab: 0 },
    { group: 'Retiro y vivienda', label: 'Retiro', pat: results.employer.retiro, trab: 0 },
    { group: 'Retiro y vivienda', label: 'Cesantía en edad avanzada y vejez', pat: results.employer.cesantia, trab: results.employee.cesantia },
    { group: 'Retiro y vivienda', label: 'INFONAVIT 5%', pat: results.employer.infonavit, trab: 0 },
  ] : [];

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora informativa"
        title="IMSS e INFONAVIT"
        description="Proyecta cuotas y reparto patrón-trabajador con vigencia 2026. Herramienta independiente no oficial."
        icon={<ShieldCheck size={28} />}
      />

      <div className="flex min-w-0 flex-col gap-5 lg:gap-8">
          <div className="min-w-0 w-full lg:max-w-4xl lg:mx-auto">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="inputs"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <WorkspacePanel className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Datos de cotización</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">Proyección rápida</p>
                </div>
                <button type="button" onClick={loadExample} className="ui-secondary-action shrink-0">
                  <Zap size={14} />
                  Ejemplo
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <label htmlFor="imssSbc" className="ui-label">Salario diario base de cotización</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input id="imssSbc" type="number" value={sbc || ''} onChange={(e) => setSbc(Number(e.target.value))} className="ui-input w-full pl-10 pr-4 text-lg font-bold" placeholder="0.00" />
                  </div>
                  <p className="px-1 text-xs leading-5 text-slate-500">
                    También lo verás como SBC. Normalmente aparece en nómina, SUA o IDSE.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="imssRiskClass" className="ui-label px-0">Clase de riesgo</label>
                    <button type="button" onClick={() => setShowRiskCalc(!showRiskCalc)} aria-expanded={showRiskCalc} className="rounded-md px-2 py-1 text-xs font-bold text-legal-gold transition-colors hover:bg-legal-gold/10">
                      Calcular prima anual
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {riskPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyRiskPreset(preset.value)}
                        aria-pressed={riskClass === preset.value}
                        className={`min-w-0 rounded-lg border p-3 text-left transition-all hover:border-legal-gold/60 hover:bg-legal-gold/5 ${
                          riskClass === preset.value ? 'border-legal-gold/70 bg-legal-gold/10 text-slate-950' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="block text-xs font-extrabold">{preset.label}</span>
                        <span className="mt-1 block text-[11px] font-semibold text-slate-500">{preset.hint}</span>
                      </button>
                    ))}
                  </div>
                  <select id="imssRiskClass" value={riskClass} onChange={(e) => setRiskClass(Number(e.target.value))} className="ui-input">
                    <option value={0}>Seleccione clase...</option>
                    <option value={0.54355}>Clase I (0.54355%)</option>
                    <option value={1.13065}>Clase II (1.13065%)</option>
                    <option value={2.59840}>Clase III (2.59840%)</option>
                    <option value={4.65325}>Clase IV (4.65325%)</option>
                    <option value={7.58875}>Clase V (7.58875%)</option>
                  </select>
                  <p className="px-1 text-xs leading-5 text-slate-500">
                    Si no tienes la clase exacta, usa una guía rápida y confirma después con el registro patronal.
                  </p>
                </div>

                <AnimatePresence>
                  {showRiskCalc && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ui-subtle-block space-y-5 overflow-hidden p-4"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Prima de riesgo variable</h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Captura los datos anuales para estimar la prima y aplicarla al cálculo.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="imssSubsidizedDays" className="ui-label">Días subsidiados</label>
                          <input id="imssSubsidizedDays" type="number" value={s_days || ''} onChange={(e) => setS_days(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="imssFactorV" className="ui-label">Factor V</label>
                          <input id="imssFactorV" type="number" value={v_factor || ''} onChange={(e) => setV_factor(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="imssDisabilities" className="ui-label">Incapacidades</label>
                          <input id="imssDisabilities" type="number" value={i_disability || ''} onChange={(e) => setI_disability(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="imssDeaths" className="ui-label">Defunciones</label>
                          <input id="imssDeaths" type="number" value={d_deaths || ''} onChange={(e) => setD_deaths(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="imssFactorF" className="ui-label">Factor F</label>
                          <input id="imssFactorF" type="number" value={f_factor || ''} onChange={(e) => setF_factor(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="imssWorkers" className="ui-label">Trabajadores</label>
                          <input id="imssWorkers" type="number" value={n_workers || ''} onChange={(e) => setN_workers(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="imssMinimumRisk" className="ui-label">Prima mínima</label>
                        <input id="imssMinimumRisk" type="number" value={m_min || ''} onChange={(e) => setM_min(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" step="0.0001" />
                      </div>

                      <button
                        type="button"
                        onClick={calculateAnnualRiskValue}
                        className="ui-secondary-action w-full uppercase tracking-[0.12em]"
                      >
                        Aplicar prima
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <label htmlFor="imssContributionDays" className="ui-label">Días cotizados</label>
                  <input id="imssContributionDays" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="ui-input" />
                  <p className="px-1 text-xs leading-5 text-slate-500">Usa 30 para estimación mensual o el número real de días del periodo.</p>
                </div>

                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} aria-expanded={showAdvanced} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-600 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Constantes 2026</span>
                  </div>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block space-y-4 overflow-hidden p-4">
                      <div className="space-y-2">
                        <label htmlFor="imssMinWage" className="ui-label">Salario mínimo vigente</label>
                        <input id="imssMinWage" type="number" value={minWage} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="imssUmaValue" className="ui-label">UMA vigente</label>
                        <input id="imssUmaValue" type="number" value={umaValue} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={calculate} className="ui-primary-action group">
                  <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-wide">Calcular cuotas</span>
                </button>
              </div>
            </WorkspacePanel>
                </motion.div>
              ) : (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <WorkspacePanel className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="ui-icon-chip bg-emerald-100/50 border border-emerald-200"><CheckCircle2 size={18} className="text-emerald-700" /></div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Datos cotización</h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                           SBC: <strong className="text-slate-700">${sbc.toFixed(2)}</strong> • Días: <strong className="text-slate-700">{days}</strong> • Riesgo: <strong className="text-slate-700">{riskClass}%</strong>
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsEditing(true)} className="ui-secondary-action shrink-0">
                      Editar datos
                    </button>
                  </WorkspacePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={resultsRef} className="min-w-0 w-full lg:max-w-5xl lg:mx-auto">
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
                    <WorkspaceStat label="Total" value={`$${results.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`} emphasis="inverse" />
                    <WorkspaceStat label="Patrón" value={`$${results.employer.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`} />
                    <WorkspaceStat label="Trabajador" value={`$${results.employee.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`} emphasis="accent" />
                  </div>

                  <WorkspacePanel className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="ui-icon-chip h-10 w-10 sm:h-10 sm:w-10">
                            <Activity size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Lectura rápida</p>
                            <h4 className="mt-1 text-base font-bold text-slate-950">Costo estimado del periodo</h4>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          Para {days} días con SBC de ${formatCurrency(sbc)}, el patrón absorbería ${formatCurrency(results.employer.total)} y el trabajador ${formatCurrency(results.employee.total)}.
                        </p>
                      </div>
                      <div className="grid min-w-[180px] grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <span className="block font-bold uppercase tracking-[0.12em] text-slate-500">Prima</span>
                          <strong className="mt-1 block text-slate-950">{riskClass.toFixed(5)}%</strong>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <span className="block font-bold uppercase tracking-[0.12em] text-slate-500">INFONAVIT</span>
                          <strong className="mt-1 block text-slate-950">${formatCurrency(results.employer.infonavit)}</strong>
                        </div>
                      </div>
                    </div>
                  </WorkspacePanel>

                  <WorkspacePanel className="overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                      <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900">Desglose de cuotas</h4>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleExport} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-legal-950" aria-label="Exportar PDF"><Download size={20} /></button>
                      </div>
                    </div>
                    <>
                    <div className="space-y-3 p-4 lg:hidden">
                      {contributionRows.map((row, index, rows) => (
                        <React.Fragment key={row.label}>
                          {(index === 0 || rows[index - 1].group !== row.group) && (
                            <p className="px-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                              {row.group}
                            </p>
                          )}
                          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h5 className="text-sm font-bold leading-5 text-slate-800">{row.label}</h5>
                            <dl className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                              <div className="rounded-lg bg-slate-950 p-3 text-white">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Total</dt>
                                <dd className="mt-1 font-sans text-sm font-extrabold tabular-nums text-legal-gold">${formatCurrency(row.pat + row.trab)}</dd>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-3">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Patrón</dt>
                                <dd className="mt-1 font-sans text-sm font-bold tabular-nums text-slate-800">${formatCurrency(row.pat)}</dd>
                              </div>
                              <div className="rounded-lg bg-slate-50 p-3">
                                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Trabajador</dt>
                                <dd className="mt-1 font-sans text-sm font-bold tabular-nums text-slate-800">${formatCurrency(row.trab)}</dd>
                              </div>
                            </dl>
                          </article>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="hidden overflow-x-auto p-0 lg:block">
                      <table className="w-full min-w-[620px] text-left lg:min-w-0">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Concepto</th>
                            <th className="p-4 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Patrón</th>
                            <th className="p-4 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Trabajador</th>
                            <th className="p-4 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {contributionRows.map((row, i, rows) => (
                            <React.Fragment key={row.label}>
                              {(i === 0 || rows[i - 1].group !== row.group) && (
                                <tr>
                                  <td colSpan={4} className="bg-slate-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                                    {row.group}
                                  </td>
                                </tr>
                              )}
                              <tr className="transition-colors hover:bg-slate-50/50">
                                <td className="max-w-[260px] break-words p-4 text-sm font-semibold leading-5 text-slate-700">{row.label}</td>
                                <td className="p-4 text-right font-sans font-bold tabular-nums text-slate-600">${formatCurrency(row.pat)}</td>
                                <td className="p-4 text-right font-sans font-bold tabular-nums text-slate-600">${formatCurrency(row.trab)}</td>
                                <td className="p-4 text-right font-sans font-extrabold tabular-nums text-slate-950">${formatCurrency(row.pat + row.trab)}</td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>

                  </WorkspacePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      <AdBanner slot="imss-calculator-banner" />

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
            question: '¿Qué calcula esta calculadora de cuotas IMSS?',
            answer: 'Calcula las cuotas del patrón y del trabajador a partir del salario base de cotización, la UMA, la clase de riesgo, los días cotizados y otros parámetros de seguridad social.',
          },
          {
            question: '¿La calculadora IMSS es gratuita?',
            answer: 'Sí. Todas las calculadoras de Lex Laboral son gratuitas y no requieren registro.',
          },
          {
            question: '¿Sirve como determinación definitiva ante el IMSS?',
            answer: 'No. Es una herramienta de apoyo técnico para estimación y revisión. La determinación final depende de la integración salarial, movimientos afiliatorios y circunstancias concretas del patrón.',
          },
        ]}
      />


    </WorkspacePage>
  );
};
