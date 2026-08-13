import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Coins, 
  Calendar, 
  Briefcase, 
  Info, 
  Download, 
  RefreshCw, 
  Scale, 
  Zap, 
  AlertCircle,
  ChevronDown,
  TrendingUp,
  FileText,
  User,
  FileDown,
  CheckCircle2,
  Settings2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';
import { calculateSDI, calculateLaborSettlement, type DismissalType, type LaborSettlementInput } from '../lib/calculators/labor';

const LazyBreakdownChart = React.lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart }))
);

export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  onOpenImss?: () => void;
}> = ({ notify, onOpenImss }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const dismissalOptions: Array<{ value: DismissalType; label: string }> = [
    { value: 'injustificado', label: 'Injustificado' },
    { value: 'renuncia', label: 'Renuncia' },
    { value: 'rescision_patron', label: 'Rescisión' },
  ];
  const [dailySalary, setDailySalary] = useState<number>(0);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryPeriod, setSalaryPeriod] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [isSdiCalculated, setIsSdiCalculated] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [yearsOfService, setYearsOfService] = useState<number>(0);
  const [daysOfService, setDaysOfService] = useState<number>(0);
  const [vacationDays, setVacationDays] = useState<number>(12);
  const [vacationPremium, setVacationPremium] = useState<number>(25);
  const [aguinaldoDays, setAguinaldoDays] = useState<number>(15);
  const [doubleOvertimeHours, setDoubleOvertimeHours] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  const [tripleOvertimeHours, setTripleOvertimeHours] = useState<number>(0);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [dismissalType, setDismissalType] = useState<DismissalType>('injustificado');
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);
  const [showErrors, setShowErrors] = useState(false);

  React.useEffect(() => {
    if (baseSalary > 0) {
      let daily = 0;
      if (salaryPeriod === 'daily') daily = baseSalary;
      else if (salaryPeriod === 'weekly') daily = baseSalary / 7;
      else if (salaryPeriod === 'biweekly') daily = baseSalary / 15;
      else if (salaryPeriod === 'monthly') daily = baseSalary / 30;

      const factor = 1 + (aguinaldoDays / 365.25) + (vacationDays * (vacationPremium / 100) / 365.25);
      const sdi = daily * factor;
      setDailySalary(Math.round(sdi * 100) / 100);
      setIsSdiCalculated(true);
    }
  }, [baseSalary, salaryPeriod, aguinaldoDays, vacationDays, vacationPremium]);

  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const years = Math.floor(totalDays / 365.25);
        const remainingDays = Math.floor(totalDays % 365.25);
        
        setYearsOfService(years);
        setDaysOfService(remainingDays);
      } else {
        setYearsOfService(0);
        setDaysOfService(0);
      }
    }
  }, [startDate, endDate]);

  const [results, setResults] = useState<{
    aguinaldo: number;
    vacations: number;
    vacationPremium: number;
    indemnity90: number;
    indemnity20: number;
    seniorityPremium: number;
    overtime: number;
    total: number;
    finiquito: number;
    liquidacion: number;
    isr: number;
    formulas: {
      aguinaldo: string;
      vacations: string;
      vacationPremium: string;
      indemnity90: string;
      indemnity20: string;
      seniorityPremium: string;
      overtime: string;
      isr: string;
    };
  } | null>(null);

  const calculate = async () => {
    if (dailySalary <= 0 || (yearsOfService <= 0 && daysOfService <= 0)) {
      setShowErrors(true);
      notify("Complete los campos obligatorios para generar el cálculo", "warning");
      return;
    }
    setShowErrors(false);

    const input: LaborSettlementInput = {
      dailySalary,
      yearsOfService,
      daysOfService,
      vacationDays,
      vacationPremium,
      aguinaldoDays,
      doubleOvertimeHours,
      tripleOvertimeHours,
      hoursPerDay,
      dismissalType,
      minWage,
      umaValue
    };

    const result = calculateLaborSettlement(input);
    setResults(result);
    
    notify("Cálculo generado exitosamente", "success");
    setTimeout(() => {
      if (typeof resultsRef.current?.scrollIntoView === 'function') {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return [
      { name: 'Aguinaldo', value: results.aguinaldo, color: '#94a3b8' },
      { name: 'Vacaciones', value: results.vacations, color: '#64748b' },
      { name: 'Prima Vac.', value: results.vacationPremium, color: '#475569' },
      { name: 'Indemnización 90', value: results.indemnity90, color: '#d4af37' },
      { name: 'Indemnización 20', value: results.indemnity20, color: '#b8962e' },
      { name: 'Prima Antig.', value: results.seniorityPremium, color: '#1e293b' },
      { name: 'Horas Extras', value: results.overtime, color: '#0f172a' },
      { name: 'Retención ISR', value: results.isr, color: '#991b1b' },
    ].filter(d => d.value > 0);
  }, [results]);

  const handleExportPDF = async () => {
    if (!results) return;
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [30, 41, 59];
      const goldColor: [number, number, number] = [212, 175, 55];

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LEXLABORAL', 20, 25);
      doc.setFontSize(10);
      doc.text('DICTAMEN TÉCNICO DE LIQUIDACIÓN LABORAL', 20, 32);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
      doc.text(`Tipo: ${dismissalType.toUpperCase().replace('_', ' ')}`, 20, 50);

      autoTable(doc, {
        startY: 60,
        head: [['Concepto', 'Valor']],
        body: [
          ['Fecha de Ingreso', startDate || 'No especificada'],
          ['Fecha de Baja', endDate || 'No especificada'],
          ['Antigüedad', `${yearsOfService} años, ${daysOfService} días`],
          ['SDI Integrado', `$${dailySalary.toFixed(2)}`],
          ['Salario Mínimo', `$${minWage.toFixed(2)}`],
        ],
        headStyles: { fillColor: primaryColor },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Prestación', 'Monto (MXN)', 'Fundamento']],
        body: [
          ['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`, 'Art. 87 LFT'],
          ['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`, 'Art. 76 LFT'],
          ['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`, 'Art. 80 LFT'],
          ['Indemnización 90 días', `$${results.indemnity90.toFixed(2)}`, 'Art. 48 LFT'],
          ['Indemnización 20 días/año', `$${results.indemnity20.toFixed(2)}`, 'Art. 50 LFT'],
          ['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`, 'Art. 162 LFT'],
          ['Retención ISR (Estimada)', `-$${results.isr.toFixed(2)}`, 'Art. 95, 96 LISR'],
        ].filter(r => parseFloat(r[1].replace('$', '').replace('-', '')) > 0),
        headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
      });

      doc.save(`LexLaboral_Dictamen_${new Date().getTime()}.pdf`);
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  const handleImssNextStep = () => {
    onOpenImss?.();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora laboral"
        title="Liquidación y finiquito"
        description="Calcula finiquito, indemnización y total estimado en una sola vista."
        icon={<Calculator size={28} />}
        actions={
          <div className="grid w-full grid-cols-3 rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-sm sm:w-auto">
            {dismissalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDismissalType(option.value)}
                className={`min-w-0 rounded-[1rem] px-2.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all sm:px-5 sm:text-[11px] sm:tracking-[0.18em] ${
                  dismissalType === option.value
                    ? 'bg-slate-950 text-legal-gold shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Inputs Section */}
          <div className="min-w-0 space-y-6 lg:col-span-5 lg:space-y-8">
            <WorkspacePanel className="space-y-6 p-5 sm:p-8 lg:space-y-8">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="ui-icon-chip h-11 w-11 rounded-[1rem]"><User size={18} className="text-legal-gold" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Datos del caso</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Cálculo inmediato</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="ui-subtle-block space-y-4 p-4 sm:p-6">
                   <div className="flex items-center justify-between">
                      <label className="ui-label">Periodo de pago</label>
                      <div className="grid grid-cols-4 gap-1">
                        {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                          <button key={p} onClick={() => setSalaryPeriod(p)} className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${salaryPeriod === p ? 'bg-legal-950 text-white' : 'text-slate-400 hover:bg-white'}`}>
                            {p === 'daily' ? 'D' : p === 'weekly' ? 'S' : p === 'biweekly' ? 'Q' : 'M'}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                   </div>
                   {isSdiCalculated && baseSalary > 0 && (
                      <div className="flex items-center justify-between px-2 pt-1">
                        <span className="text-xs text-slate-400 font-medium">SDI Integrado:</span>
                        <span className="text-xs font-bold text-emerald-600">${dailySalary.toFixed(2)}</span>
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div className="space-y-3">
                    <label htmlFor="startDateInput" className="ui-label flex items-center gap-2">
                      <Calendar size={12} className="text-legal-gold" /> Ingreso
                    </label>
                    <input id="startDateInput" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ui-input" />
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="endDateInput" className="ui-label flex items-center gap-2">
                      <Calendar size={12} className="text-legal-gold" /> Baja
                    </label>
                    <input id="endDateInput" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ui-input" />
                  </div>
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-500 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Más opciones</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block grid grid-cols-1 gap-5 overflow-hidden p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
                      <div className="space-y-2">
                        <label className="ui-label">Aguinaldo (Días)</label>
                        <input type="number" value={aguinaldoDays} onChange={(e) => setAguinaldoDays(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="ui-label">Vacaciones (Días)</label>
                        <input type="number" value={vacationDays} onChange={(e) => setVacationDays(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
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
                  <span className="tracking-wide">Calcular</span>
                </button>
              </div>
            </WorkspacePanel>
          </div>

          {/* Results Section */}
          <div ref={resultsRef} className="min-w-0 lg:col-span-7">
            <AnimatePresence mode="wait">
              {!results ? (
                <WorkspaceEmpty
                  icon={<Calculator size={44} />}
                  title="Tu cálculo aparecerá aquí"
                  description="Captura sueldo y fechas para ver finiquito, liquidación y total."
                  className="lg:min-h-[600px]"
                />
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <WorkspacePanel className="overflow-hidden rounded-[2.4rem]">
                    <div className="flex flex-col items-start justify-between gap-5 border-b border-slate-50 bg-gradient-to-br from-slate-900 to-legal-950 p-5 text-white sm:p-8 md:flex-row md:items-center lg:p-10">
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Total estimado</span>
                        <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-2 sm:gap-3">
                          <h3 className="break-words font-serif text-3xl font-bold text-legal-gold sm:text-4xl lg:text-5xl">
                            ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </h3>
                          <span className="text-slate-400 font-bold text-sm">MXN</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button onClick={handleExportPDF} className="flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10 active:scale-95 text-xs">
                          <FileDown size={18} /> <span>PDF</span>
                        </button>
                        <button onClick={() => setResults(null)} className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl transition-all">
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="border-b border-slate-50 p-5 sm:p-8 md:border-b-0 md:border-r lg:p-10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Composición</h4>
                        <div className="h-[280px]">
                          <React.Suspense fallback={<div className="h-full rounded-2xl bg-slate-50" />}>
                            <LazyBreakdownChart data={chartData} />
                          </React.Suspense>
                        </div>
                      </div>

                      <div className="max-h-none space-y-4 overflow-visible p-5 sm:p-8 md:max-h-[500px] md:overflow-y-auto lg:p-10 no-scrollbar">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose</h4>
                        {[
                          { key: 'aguinaldo', label: 'Aguinaldo', val: results.aguinaldo, f: results.formulas.aguinaldo },
                          { key: 'vacations', label: 'Vacaciones', val: results.vacations, f: results.formulas.vacations },
                          { key: 'indemnity90', label: 'Indemnización 90 días', val: results.indemnity90, f: results.formulas.indemnity90 },
                          { key: 'indemnity20', label: 'Indemnización 20 días/año', val: results.indemnity20, f: results.formulas.indemnity20 },
                          { key: 'seniorityPremium', label: 'Prima de Antigüedad', val: results.seniorityPremium, f: results.formulas.seniorityPremium },
                        ].filter(i => i.val > 0).map(item => (
                          <div key={item.key} className="group">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="min-w-0 text-xs font-bold text-slate-700">{item.label}</span>
                              <span className={`shrink-0 text-sm font-serif font-bold ${item.key === 'isr' ? 'text-red-700' : 'text-slate-900'}`}>
                                {item.key === 'isr' ? '-' : ''}${item.val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </div>
                            <div className="break-words p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                              {item.f}
                            </div>
                          </div>
                        ))}
                        
                        {results.isr > 0 && (
                          <div className="group">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-red-700">Retención de ISR</span>
                              <span className="shrink-0 text-sm font-serif font-bold text-red-700">-${results.isr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="break-words p-3 bg-red-50 rounded-xl text-xs text-red-700/80 font-mono leading-relaxed border border-red-100 whitespace-pre-wrap">
                              {results.formulas.isr}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                          <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-orange-800 tracking-wide uppercase">Cálculo de ISR</span>
                            <p className="text-xs text-orange-600/80 mt-1 leading-relaxed">
                              Se ha estimado una retención total de ISR de <strong className="font-bold text-orange-700">${results.isr.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> aplicando la tasa efectiva sobre indemnizaciones y la tarifa mensual sobre el finiquito gravable.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </WorkspacePanel>

                  <div className="grid gap-4 md:grid-cols-1">
                    <button
                      onClick={handleImssNextStep}
                      className="group w-full min-w-0 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 text-left shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <Scale className="text-emerald-600" size={20} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">IMSS</span>
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-slate-950">
                          Abrir IMSS
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Revisa cuotas e impacto patronal para completar el análisis del caso.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                          Continuar
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      

      <SEOContentSection
        title="Calculadora de liquidación y finiquito en México"
        intro="Esta calculadora laboral está pensada para estimar finiquito, liquidación e indemnizaciones con criterios alineados a la Ley Federal del Trabajo. Te permite proyectar escenarios de despido injustificado, renuncia o rescisión, y revisar conceptos como aguinaldo proporcional, vacaciones, prima vacacional, prima de antigüedad e ISR sobre indemnización."
        highlights={[
          {
            title: 'Liquidación laboral',
            body: 'Incluye indemnización constitucional de 3 meses, 20 días por año cuando aplica y prima de antigüedad topada conforme al marco legal mexicano.',
          },
          {
            title: 'Finiquito proporcional',
            body: 'Desglosa aguinaldo, vacaciones, prima vacacional y horas extra a partir de fechas de ingreso y baja, salario y tipo de separación.',
          },
          {
            title: 'Uso práctico',
            body: 'Sirve como simulador para trabajadores, áreas de RH, despachos laborales y patrones que necesitan una referencia rápida antes de revisar el caso a detalle.',
          },
        ]}
        faqs={[
          {
            question: 'Que incluye una liquidacion por despido injustificado en Mexico?',
            answer: 'Normalmente incluye 3 meses de salario, 20 días por año cuando corresponde, prima de antigüedad y las partes proporcionales del finiquito como aguinaldo, vacaciones y prima vacacional.',
          },
          {
            question: 'La calculadora laboral de Lex Laboral es gratis?',
            answer: 'Sí. La calculadora de prestaciones es gratuita y no requiere registro ni plan de pago.',
          },
          {
            question: 'Este resultado sustituye asesoria legal profesional?',
            answer: 'No. Funciona como una estimación técnica útil para análisis preliminar, pero cada caso debe revisarse con sus hechos, documentos y estrategia jurídica específica.',
          },
        ]}
      />
    </WorkspacePage>
  );
};
