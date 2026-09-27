import { track } from '@vercel/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Briefcase,
    Calculator,
    Calendar,
    CheckCircle2,
    ChevronDown,
    FileText,
    Info,
    RefreshCw,
    Settings2,
    Sparkles,
    TrendingUp,
    User
} from 'lucide-react';
import LZString from 'lz-string';
import React, { useState } from 'react';
import { calculateLaborSettlement, calculateSDI, type DismissalType, type LaborSettlementInput } from '../lib/calculators/labor';
import { generatePDFDoc, generateWordDoc } from '../lib/calculators/labor-docs';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { NotificationType } from '../types';
import { DocumentExportModal } from './DocumentExportModal';
import { OnboardingTooltip } from './OnboardingTooltip';
import { SEOContentSection } from './SEOContentSection';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';




export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  onOpenImss?: () => void;
}> = ({ notify, onOpenImss }) => {

  const resultsRef = React.useRef<HTMLDivElement>(null);
  const dismissalOptions: Array<{ value: DismissalType; label: string }> = [
    { value: 'injustificado', label: 'Despido' },
    { value: 'renuncia', label: 'Renuncia' },
    { value: 'rescision_patron', label: 'Rescisión' },
  ];
  const dismissalLabels: Record<DismissalType, string> = {
    injustificado: 'Despido injustificado',
    renuncia: 'Renuncia',
    rescision_patron: 'Rescisión por causa imputable al trabajador',
    rescision_trabajador: 'Rescisión por causa imputable al patrón',
  };
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
  const [isExporting, setIsExporting] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isSharedScenario, setIsSharedScenario] = useState(false);
  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);

  React.useEffect(() => {
    const loadSharedState = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // Manejo del enlace nuevo corto (Redis Hash)
        const hash = params.get('s');
        let stateObj = null;

        if (hash) {
          const res = await fetch(`/api/link?hash=${hash}`);
          if (res.ok) {
            const data = await res.json();
            stateObj = JSON.parse(data.scenario);
          }
        } else {
          // Fallback: Manejo del enlace viejo (LZString en URL)
          const scenarioStr = params.get('scenario');
          if (scenarioStr) {
            const decompressed = LZString.decompressFromEncodedURIComponent(scenarioStr);
            if (decompressed) {
              stateObj = JSON.parse(decompressed);
            }
          }
        }

        if (stateObj) {
          if (stateObj.baseSalary) setBaseSalary(stateObj.baseSalary);
          if (stateObj.salaryPeriod) setSalaryPeriod(stateObj.salaryPeriod);
          if (stateObj.startDate) setStartDate(stateObj.startDate);
          if (stateObj.endDate) setEndDate(stateObj.endDate);
          if (stateObj.yearsOfService) setYearsOfService(stateObj.yearsOfService);
          if (stateObj.daysOfService) setDaysOfService(stateObj.daysOfService);
          if (stateObj.dismissalType) setDismissalType(stateObj.dismissalType);
          if (stateObj.vacationDays) setVacationDays(stateObj.vacationDays);
          if (stateObj.vacationPremium) setVacationPremium(stateObj.vacationPremium);
          if (stateObj.aguinaldoDays) setAguinaldoDays(stateObj.aguinaldoDays);
          
          setIsSharedScenario(true);
          notify("Escenario cargado exitosamente", "success");
          
          // Tracking PLG: Apertura de link compartido
          track('open_shared_link', {
            source: 'whatsapp_or_direct'
          });
          
          // Auto calcular si ya traemos datos completos
          setTimeout(() => {
            const computeBtn = document.getElementById("computeLaborBtn");
            if (computeBtn) computeBtn.click();
          }, 300);
        }

        // Clean URL after loading to avoid confusion
        if (hash || params.get('scenario')) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (e) {
        console.error("Error loading scenario", e);
      }
    };

    loadSharedState();
  }, []);



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
    setExpandedBreakdown(null);
    setResults(result);
    setIsEditing(false);
    
    notify("Cálculo generado exitosamente", "success");
    setTimeout(() => {
      if (typeof resultsRef.current?.scrollIntoView === 'function') {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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

  const loadExampleCase = () => {
    const exampleDailySalary = calculateSDI(30000, 'monthly', 15, 12, 25);
    const exampleResult = calculateLaborSettlement({
      dailySalary: exampleDailySalary,
      yearsOfService: 3,
      daysOfService: 180,
      vacationDays: 12,
      vacationPremium: 25,
      aguinaldoDays: 15,
      doubleOvertimeHours: 0,
      tripleOvertimeHours: 0,
      hoursPerDay: 8,
      dismissalType: 'injustificado',
      minWage: MEXICO_LABOR_DEFAULTS_2026.minWage,
      umaValue: MEXICO_LABOR_DEFAULTS_2026.uma,
    });

    setSalaryPeriod('monthly');
    setBaseSalary(30000);
    setDailySalary(exampleDailySalary);
    setIsSdiCalculated(true);
    setStartDate('');
    setEndDate('');
    setYearsOfService(3);
    setDaysOfService(180);
    setVacationDays(12);
    setVacationPremium(25);
    setAguinaldoDays(15);
    setDoubleOvertimeHours(0);
    setTripleOvertimeHours(0);
    setHoursPerDay(8);
    setDismissalType('injustificado');
    setMinWage(MEXICO_LABOR_DEFAULTS_2026.minWage);
    setUmaValue(MEXICO_LABOR_DEFAULTS_2026.uma);
    setShowErrors(false);
    setExpandedBreakdown(null);
    setResults(exampleResult);
    setIsEditing(false);
    notify('Ejemplo calculado para liquidación', 'success');
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };





  const handleWhatsAppShare = async () => {
    if (!results) return;
    setIsOpeningWhatsApp(true);
    try {
      const state = {
        baseSalary,
        salaryPeriod,
        startDate,
        endDate,
        yearsOfService,
        daysOfService,
        dismissalType,
        vacationDays,
        vacationPremium,
        aguinaldoDays
      };
      
      const payload = JSON.stringify(state);
      let shareUrl = '';

      try {
        const response = await fetch('/api/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: payload })
        });
        
        if (response.ok) {
          const { hash } = await response.json();
          shareUrl = `${window.location.origin}${window.location.pathname}?s=${hash}`;
        } else {
          throw new Error('Fallback to local compression');
        }
      } catch (err) {
        // Fallback: Si el servidor falla o no hay DB, usamos compresión en URL
        const encoded = LZString.compressToEncodedURIComponent(payload);
        shareUrl = `${window.location.origin}${window.location.pathname}?scenario=${encoded}`;
      }

      const totalStr = `$${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
      const text = `📊 *Memoria de Cálculo Laboral*\n\nRevisa el desglose de Finiquito / Liquidación conforme a la LFT vigente. Total estimado: ${totalStr} MXN.\n\n👇 Abre este enlace para ver el desglose exacto o ajustar los números:\n${shareUrl}\n\n_Generado por LexLaboral.com.mx_`;
      
      // Tracking de PLG: Loop Viral WhatsApp
      track('share_whatsapp', {
        type: dismissalType,
        total_amount: results.total,
        is_shared_scenario: isSharedScenario
      });

      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      setIsOpeningWhatsApp(false);
      
    } catch (e) {
      notify("No se pudo generar el enlace", "error");
      setIsOpeningWhatsApp(false);
    }
  };

  const handleDocumentExport = async (template: 'A' | 'B' | 'C', format: 'pdf' | 'docx', data: { employeeName: string, employerName: string }) => {
    if (!results) return;
    setIsExporting(true);
    try {
      const docData = {
        employeeName: data.employeeName,
        employerName: data.employerName,
        results,
        dismissalLabel: dismissalLabels[dismissalType],
        startDate,
        endDate,
        yearsOfService,
        daysOfService,
        dailySalary,
        minWage
      };

      if (format === 'pdf') {
        generatePDFDoc(template, docData);
        notify("PDF generado con éxito", "success");
      } else {
        await generateWordDoc(template, docData);
        notify("Documento Word generado con éxito", "success");
      }

      // Tracking de PLG: Conversión de Documento
      track('export_document', {
        template_id: template,
        format_type: format,
        type: dismissalType,
        is_shared_scenario: isSharedScenario
      });

      setIsDocModalOpen(false);
    } catch (error) {
      console.error(error);
      notify(`Error al generar el documento ${format.toUpperCase()}`, "error");
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora laboral informativa"
        title="Liquidación y finiquito"
        description="Calcula finiquito, indemnización y total estimado en una sola vista."
        icon={<Calculator size={28} />}
        actions={
          <div className="w-full space-y-2 sm:min-w-[21rem] lg:w-auto">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Tipo de separación</p>
            <div className="ui-segmented grid-cols-3">
              {dismissalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDismissalType(option.value)}
                  title={dismissalLabels[option.value]}
                  aria-pressed={dismissalType === option.value}
                  className={`ui-segmented-option ${dismissalType === option.value ? 'ui-segmented-option-active' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        }
      />



      <div className="flex min-w-0 flex-col gap-5 lg:gap-8">
          {/* Inputs Section */}
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
              <div className="flex flex-wrap items-start justify-between gap-3 text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="ui-icon-chip"><User size={18} className="text-legal-gold" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Datos del caso</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">Cálculo inmediato</p>
                  </div>
                </div>
                <button type="button" onClick={loadExampleCase} className="ui-secondary-action shrink-0">
                  <Sparkles size={14} />
                  Ejemplo
                </button>
              </div>

              <div className="space-y-5">
                <div className="ui-subtle-block space-y-4 p-4">
                   <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <label htmlFor="laborBaseSalary" className="ui-label px-0">Sueldo bruto por periodo</label>
                      </div>
                      <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
                        {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            aria-label={`Periodo ${p}`}
                            aria-pressed={salaryPeriod === p}
                            onClick={() => setSalaryPeriod(p)}
                            className={`rounded-md px-2 py-1.5 text-[11px] font-extrabold transition-all ${salaryPeriod === p ? 'bg-slate-950 text-legal-gold shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                          >
                            {p === 'daily' ? 'Día' : p === 'weekly' ? 'Sem' : p === 'biweekly' ? 'Quin' : 'Mes'}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-500">$</span>
                      <input id="laborBaseSalary" type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                   </div>
                   
                   {isSdiCalculated && baseSalary > 0 && (
                      <div className="flex items-center justify-between px-2 pt-1">
                        <span className="text-xs font-semibold text-slate-500">SDI integrado</span>
                        <span className="text-xs font-extrabold text-emerald-700">${dailySalary.toFixed(2)}</span>
                      </div>
                   )}
                   {showErrors && dailySalary <= 0 && (
                      <p className="flex items-center gap-2 px-2 text-xs font-semibold text-amber-700">
                        <AlertCircle size={14} /> Captura un salario mayor a cero.
                      </p>
                   )}
                </div>

                <div className="ui-form-grid">
                  <div className="space-y-3">
                    <label htmlFor="startDateInput" className="ui-label flex items-center gap-2">
                      <Calendar size={12} className="text-legal-gold" /> Fecha de ingreso
                    </label>
                    <input id="startDateInput" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ui-input" />
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="endDateInput" className="ui-label flex items-center gap-2">
                      <Calendar size={12} className="text-legal-gold" /> Fecha de baja
                    </label>
                    <input id="endDateInput" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ui-input" />
                  </div>
                </div>


                <div className="ui-subtle-block space-y-4 p-5 border-l-4 border-l-slate-300 mt-2">
                  <div className="flex items-start gap-3">
                    <Briefcase size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">Paso 2: Antigüedad</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label htmlFor="laborYearsOfService" className="ui-label">Años</label>
                      <input
                        id="laborYearsOfService"
                        type="number"
                        value={yearsOfService || ''}
                        min="0"
                        onChange={(e) => setYearsOfService(Number(e.target.value))}
                        className="ui-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="laborDaysOfService" className="ui-label">Días</label>
                      <input
                        id="laborDaysOfService"
                        type="number"
                        value={daysOfService || ''}
                        min="0"
                        onChange={(e) => setDaysOfService(Number(e.target.value))}
                        className="ui-input"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {showErrors && yearsOfService <= 0 && daysOfService <= 0 && (
                    <p className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <AlertCircle size={14} /> Captura fechas o antigüedad para calcular.
                    </p>
                  )}
                </div>

                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} aria-expanded={showAdvanced} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-600 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Más opciones</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block grid grid-cols-1 gap-4 overflow-hidden p-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="laborAguinaldoDays" className="ui-label">Aguinaldo anual en días</label>
                        <input id="laborAguinaldoDays" type="number" value={aguinaldoDays} onChange={(e) => setAguinaldoDays(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="laborVacationDays" className="ui-label">Vacaciones anuales en días</label>
                        <input id="laborVacationDays" type="number" value={vacationDays} onChange={(e) => setVacationDays(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="laborMinWage" className="ui-label">Salario mínimo vigente</label>
                        <input id="laborMinWage" type="number" value={minWage} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="laborUmaValue" className="ui-label">UMA vigente</label>
                        <input id="laborUmaValue" type="number" value={umaValue} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button id="computeLaborBtn" onClick={() => calculate()} className="ui-primary-action group w-full justify-center mt-4">
                  <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-wide">Calcular pago estimado</span>
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
                        <h3 className="text-sm font-bold text-slate-900">Datos capturados</h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                           SDI: <strong className="text-slate-700">${dailySalary.toFixed(2)}</strong> • Antigüedad: <strong className="text-slate-700">{yearsOfService} años, {daysOfService} días</strong>
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

          {/* Results Section */}
          <div ref={resultsRef} className="min-w-0 w-full lg:max-w-5xl lg:mx-auto">
            <AnimatePresence mode="wait">
              {!results ? (
                <WorkspaceEmpty
                  icon={<Calculator size={44} />}
                  title="Tu cálculo aparecerá aquí"
                  description="Captura sueldo y fechas para ver finiquito, liquidación y total."
                  className="lg:min-h-[520px]"
                />
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <WorkspacePanel className="overflow-hidden">
                    <div className="flex flex-col items-start justify-between gap-5 border-b border-slate-800 bg-slate-950 p-5 text-white sm:p-6 md:flex-row md:items-center">
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Total estimado</span>
                        <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-2 sm:gap-3">
                          <h3 className="break-words font-sans text-3xl font-extrabold tabular-nums text-legal-gold sm:text-4xl">
                            ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </h3>
                          <span className="text-slate-400 font-bold text-sm">MXN</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-400">{dismissalLabels[dismissalType]}</p>
                        <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                          {[
                            { label: 'Finiquito', value: `$${results.finiquito.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                            { label: 'Liquidación', value: `$${results.liquidacion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                            { label: 'ISR estimado', value: `-$${results.isr.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                          ].map((item) => (
                            <div key={item.label} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.06] p-3">
                              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</span>
                              <strong className="mt-1 block break-words text-xs font-extrabold leading-5 text-white">{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => { setResults(null); setIsEditing(true); }}
                          aria-label="Reiniciar cálculo laboral"
                          title="Reiniciar cálculo"
                          className="rounded-lg bg-white/5 p-3 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>


                    <div className="flex flex-col">
                      <div className="space-y-4 overflow-visible p-5 sm:p-6">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Desglose</h4>
                        {[
                          { key: 'aguinaldo', label: 'Aguinaldo', val: results.aguinaldo, f: results.formulas.aguinaldo, art: 'Art. 87 LFT' },
                          { key: 'vacations', label: 'Vacaciones', val: results.vacations, f: results.formulas.vacations, art: 'Art. 76 LFT' },
                          { key: 'indemnity90', label: 'Indemnización 90 días', val: results.indemnity90, f: results.formulas.indemnity90, art: 'Art. 48 LFT' },
                          { key: 'indemnity20', label: 'Indemnización 20 días/año', val: results.indemnity20, f: results.formulas.indemnity20, art: 'Art. 50 LFT' },
                          { key: 'seniorityPremium', label: 'Prima de Antigüedad', val: results.seniorityPremium, f: results.formulas.seniorityPremium, art: 'Art. 162 LFT' },
                        ].filter(i => i.val > 0).map(item => (
                          <div key={item.key} className="group relative">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="min-w-0 text-xs font-bold text-slate-700 flex items-center gap-2">
                                {item.label}
                                <span className="relative group/tooltip flex items-center justify-center">
                                  <Info size={14} className="text-slate-400 hover:text-legal-gold cursor-help" />
                                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 w-max max-w-[200px] opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                                    <div className="rounded bg-slate-800 px-2 py-1 text-[10px] text-white shadow-lg">
                                      Fundamento: {item.art}
                                    </div>
                                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                  </div>
                                </span>
                              </span>
                              <span className={`shrink-0 text-sm font-serif font-bold ${item.key === 'isr' ? 'text-red-700' : 'text-slate-900'}`}>
                                {item.key === 'isr' ? '-' : ''}${item.val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </div>
                            <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
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
                            <div className="break-words rounded-lg border border-red-100 bg-red-50 p-3 font-mono text-xs leading-relaxed text-red-700/90 whitespace-pre-wrap">
                              {results.formulas.isr}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
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

                  {/* Caminos de Acción */}
                  <div className="mt-8">
                    <h4 className="text-center text-sm font-extrabold uppercase tracking-widest text-slate-900 mb-6">¿Qué deseas hacer ahora?</h4>
                    <div className="flex flex-col items-center gap-4">
                      {/* Acción Principal */}
                      <button
                        type="button"
                        onClick={() => setIsDocModalOpen(true)}
                        className="w-full max-w-md group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-amber-500/20 bg-amber-50/50 p-6 text-center shadow-sm transition-all hover:border-legal-gold hover:bg-amber-50 hover:shadow-md"
                      >
                        <div className="rounded-full bg-amber-100 p-3 text-amber-600 transition-transform group-hover:scale-110">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-base">Descargar Documento</h5>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 px-4">Elige entre 3 plantillas y descarga en PDF o Word (.docx) listo para firmar.</p>
                        </div>
                      </button>

                      {/* Acción Secundaria Sutil */}
                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        disabled={isOpeningWhatsApp}
                        className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 text-[13px] font-bold text-green-700 bg-green-50 hover:bg-green-100/80 rounded-full transition-colors border border-green-200/50 disabled:opacity-50"
                      >
                        {isOpeningWhatsApp ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        )}
                        {isOpeningWhatsApp ? 'Abriendo...' : 'Compartir resultado por WhatsApp'}
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      
      <DocumentExportModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onExport={handleDocumentExport}
        isExporting={isExporting}
      />

      <OnboardingTooltip />

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
