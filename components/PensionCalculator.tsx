import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Settings2,
  ChevronDown,
  TrendingUp,
  User,
  FileDown,
  Info,
  Building,
  Sparkles
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';
import { calculatePension73, calculatePension97, type PensionInput } from '../lib/calculators/pension';

type PensionRegime = '1973' | '1997';

const LazyBreakdownChart = React.lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart }))
);

export const PensionCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const [regime, setRegime] = useState<PensionRegime>('1973');
  const [age, setAge] = useState<number>(60);
  const [weeks, setWeeks] = useState<number>(500);
  const [averageSalary, setAverageSalary] = useState<number>(0);
  const [aforeBalance, setAforeBalance] = useState<number>(0);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);

  const [results, setResults] = useState<{
    monthlyPension: number;
    basicAmount: number;
    annualIncrementsAmount: number;
    familyAllowancesAmount: number;
    agePercentage: number;
    regimeUsed: string;
    formulas: {
      basic: string;
      increments: string;
      family: string;
      ageFactor: string;
    };
  } | null>(null);

  const loadExample = () => {
    setAge(65);
    if (regime === '1973') {
      setWeeks(1250);
      setAverageSalary(850);
      setAforeBalance(0);
      setHasSpouse(false);
      setChildrenCount(0);
    } else {
      setWeeks(1000);
      setAverageSalary(0);
      setAforeBalance(950000);
      setHasSpouse(false);
      setChildrenCount(0);
    }
    setShowAdvanced(false);
    setResults(null);
    notify('Ejemplo cargado para pensiones', 'info');
  };

  const calculatePension = () => {
    const input: PensionInput = {
      age,
      weeks,
      averageSalary,
      aforeBalance,
      hasSpouse,
      childrenCount,
      minWage,
      umaValue
    };

    let result = null;
    if (regime === '1973') {
      result = calculatePension73(input);
    } else {
      result = calculatePension97(input);
    }

    if (!result) {
      notify("Revisa los parámetros de entrada; faltan datos para realizar el cálculo.", "warning");
      return;
    }

    setResults(result);

    notify("Cálculo realizado exitosamente", "success");
    setTimeout(() => {
      if (typeof resultsRef.current?.scrollIntoView === 'function') {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    if (results.regimeUsed === '1997') {
      return [
        { name: 'Pensión AFORE', value: results.monthlyPension, color: '#0f172a' }
      ];
    }

    return [
      { name: 'Cuantía Básica', value: results.basicAmount, color: '#94a3b8' },
      { name: 'Incrementos Anuales', value: results.annualIncrementsAmount, color: '#64748b' },
      { name: 'Asignaciones Familiares', value: results.familyAllowancesAmount, color: '#d4af37' },
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
      doc.text('ESTIMACIÓN DE PENSIÓN IMSS', 20, 32);

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
      doc.text(`Régimen: Ley ${results.regimeUsed}`, 20, 50);

      const tableData = [
        ['Edad', `${age} años`],
        ['Semanas Cotizadas', `${weeks}`],
      ];

      if (results.regimeUsed === '1973') {
        tableData.push(['Salario Promedio (5 años)', `$${averageSalary.toFixed(2)}`]);
      } else {
        tableData.push(['Saldo AFORE', `$${aforeBalance.toFixed(2)}`]);
      }

      autoTable(doc, {
        startY: 60,
        head: [['Dato', 'Valor']],
        body: tableData,
        headStyles: { fillColor: primaryColor },
      });

      const bodyData = [];
      if (results.regimeUsed === '1973') {
        bodyData.push(['Cuantía Básica Mensual', `$${results.basicAmount.toFixed(2)}`]);
        bodyData.push(['Incrementos Anuales', `$${results.annualIncrementsAmount.toFixed(2)}`]);
        bodyData.push(['Asignaciones Familiares', `$${results.familyAllowancesAmount.toFixed(2)}`]);
        bodyData.push(['Factor de Edad', `${results.agePercentage}%`]);
      }
      bodyData.push(['PENSIÓN MENSUAL ESTIMADA', `$${results.monthlyPension.toFixed(2)}`]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Concepto', 'Monto (MXN)']],
        body: bodyData,
        headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
      });

      doc.save(`LexLaboral_Pension_${new Date().getTime()}.pdf`);
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora de Pensiones"
        title="Estimaciones IMSS"
        description="Calcula el estimado de tu pensión mensual bajo el régimen de 1973 o 1997."
        icon={<Building size={28} />}
        actions={
          <div className="w-full space-y-2 sm:min-w-[16rem] lg:w-auto">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Régimen de cálculo</p>
            <div className="ui-segmented grid-cols-2">
              {(['1973', '1997'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRegime(r);
                    setResults(null);
                  }}
                  className={`ui-segmented-option ${regime === r ? 'ui-segmented-option-active' : ''}`}
                >
                  Ley {r}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 space-y-5 lg:col-span-5">
          <WorkspacePanel className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="ui-icon-chip"><User size={18} className="text-legal-gold" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Datos de cotización</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">Régimen {regime}</p>
                </div>
              </div>
              <button type="button" onClick={loadExample} className="ui-secondary-action shrink-0">
                <Sparkles size={14} />
                Ejemplo
              </button>
            </div>

            <div className="space-y-5">
              <div className="ui-subtle-block p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Guía rápida</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {regime === '1973'
                    ? 'Usa Ley 73 si empezaste a cotizar antes del 1 de julio de 1997 y tienes salario promedio de las últimas 250 semanas.'
                    : 'Usa Ley 97 si tu pensión depende del saldo acumulado en tu cuenta individual AFORE.'}
                </p>
              </div>

              <div className="ui-form-grid">
                <div className="space-y-2">
                  <label className="ui-label">Edad al retiro</label>
                  <input type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value))} className="ui-input-lg w-full px-4" placeholder="60" min="60" />
                  <p className="px-1 text-xs leading-5 text-slate-500">Mínimo 60 años para cesantía; 65 para vejez.</p>
                </div>
                <div className="space-y-2">
                  <label className="ui-label">Semanas reconocidas</label>
                  <input type="number" value={weeks || ''} onChange={(e) => setWeeks(Number(e.target.value))} className="ui-input-lg w-full px-4" placeholder="500" />
                  <p className="px-1 text-xs leading-5 text-slate-500">
                    {regime === '1973' ? 'Ley 73 requiere al menos 500 semanas.' : 'Ley 97 requiere 875 semanas en 2026.'}
                  </p>
                </div>
              </div>

              {regime === '1973' ? (
                <div className="ui-subtle-block space-y-4 p-4">
                  <label className="ui-label">Salario diario promedio de las últimas 250 semanas</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-500">$</span>
                    <input type="number" value={averageSalary || ''} onChange={(e) => setAverageSalary(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Si tienes tu constancia de semanas, usa el promedio salarial que aparece como referencia.</p>
                </div>
              ) : (
                <div className="ui-subtle-block space-y-4 p-4">
                  <label className="ui-label">Saldo acumulado en AFORE</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-500">$</span>
                    <input type="number" value={aforeBalance || ''} onChange={(e) => setAforeBalance(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Captura el saldo total de la cuenta individual para estimar una mensualidad aproximada.</p>
                </div>
              )}

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-600 transition-all hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <Settings2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Configuración Adicional</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block grid grid-cols-1 gap-4 overflow-hidden p-4 sm:grid-cols-2">
                    {regime === '1973' && (
                      <>
                        <div className="space-y-2 col-span-2 flex items-center justify-between">
                          <label className="ui-label mb-0">Asignación por cónyuge</label>
                          <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-legal-gold focus:ring-legal-gold" />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="ui-label">Hijos con posible asignación familiar</label>
                          <input type="number" value={childrenCount === 0 ? '' : childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" placeholder="0" />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <label className="ui-label">Salario Mínimo</label>
                      <input type="number" value={minWage || ''} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="ui-label">Valor UMA</label>
                      <input type="number" value={umaValue || ''} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={calculatePension} className="ui-primary-action group">
                <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                <span className="tracking-wide">Calcular estimación</span>
              </button>
            </div>
          </WorkspacePanel>
        </div>

        <div ref={resultsRef} className="min-w-0 lg:col-span-7">
          <AnimatePresence mode="wait">
            {!results ? (
              <WorkspaceEmpty
                icon={<Building size={44} />}
                title="Estimación de Pensión"
                description="Ingresa tus datos para ver un estimado de tu pensión mensual según la ley seleccionada."
                className="lg:min-h-[520px]"
              />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <WorkspacePanel className="overflow-hidden">
                  <div className="flex flex-col items-start justify-between gap-5 border-b border-slate-800 bg-slate-950 p-5 text-white sm:p-6 md:flex-row md:items-center">
                    <div className="min-w-0">
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Pensión Mensual (Aprox)</span>
                      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-2 sm:gap-3">
                        <h3 className="break-words font-sans text-3xl font-extrabold tabular-nums text-legal-gold sm:text-4xl">
                          ${results.monthlyPension.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-slate-400 font-bold text-sm">MXN</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          `Ley ${results.regimeUsed}`,
                          `${age} años`,
                          `${weeks.toLocaleString('es-MX')} semanas`,
                        ].map((item) => (
                          <span key={item} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-extrabold text-white">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-3">
                      <button onClick={handleExportPDF} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95">
                        <FileDown size={18} /> <span>PDF</span>
                      </button>
                      <button onClick={() => setResults(null)} className="rounded-lg bg-white/5 p-3 text-slate-400 transition-all hover:bg-white/10">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="border-b border-slate-100 p-5 sm:p-6 md:border-b-0 md:border-r">
                      <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Composición</h4>
                      <div className="h-[280px]">
                        <React.Suspense fallback={<div className="h-full rounded-2xl bg-slate-50" />}>
                          <LazyBreakdownChart data={chartData} />
                        </React.Suspense>
                      </div>
                    </div>

                    <div className="space-y-4 overflow-visible p-5 sm:p-6">
                      <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Desglose</h4>

                      {results.regimeUsed === '1973' && (
                        <>
                          <div className="group">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-slate-700">Cuantía Básica</span>
                              <span className="shrink-0 text-sm font-serif font-bold text-slate-900">${results.basicAmount.toLocaleString()}</span>
                            </div>
                            <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
                              {results.formulas.basic}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-slate-700">Incrementos Anuales</span>
                              <span className="shrink-0 text-sm font-serif font-bold text-slate-900">${results.annualIncrementsAmount.toLocaleString()}</span>
                            </div>
                            <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
                              {results.formulas.increments}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-slate-700">Asignaciones Familiares / Asistencial</span>
                              <span className="shrink-0 text-sm font-serif font-bold text-slate-900">${results.familyAllowancesAmount.toLocaleString()}</span>
                            </div>
                            <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
                              {results.formulas.family}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <span className="text-xs font-bold text-slate-700">Factor de Edad ({age} años)</span>
                              <span className="shrink-0 text-sm font-serif font-bold text-slate-900">{results.agePercentage}%</span>
                            </div>
                            <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
                              {results.formulas.ageFactor}
                            </div>
                          </div>
                        </>
                      )}

                      {results.regimeUsed === '1997' && (
                        <div className="group">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-slate-700">Pensión Estimada</span>
                            <span className="shrink-0 text-sm font-serif font-bold text-slate-900">${results.monthlyPension.toLocaleString()}</span>
                          </div>
                          <div className="ui-detail-card break-words font-mono whitespace-pre-wrap">
                            {results.formulas.basic}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-orange-800 tracking-wide uppercase">Cálculo Estimado</span>
                          <p className="text-xs text-orange-600/80 mt-1 leading-relaxed">
                            Este resultado es una <strong>estimación</strong>. El cálculo oficial debe ser emitido por el Instituto Mexicano del Seguro Social. Se aplican redondeos y factores simplificados para propósitos ilustrativos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </WorkspacePanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SEOContentSection
        title="Calculadora de Pensiones IMSS (Ley 73 y 97)"
        intro="Estima tu pensión mensual del IMSS según el régimen al que pertenezcas. Si cotizaste antes del 1 de julio de 1997, puedes optar por la Ley del 73; si cotizaste después, te aplica la Ley del 97."
        highlights={[
          {
            title: 'Régimen de 1973',
            body: 'Basado en el promedio de tu salario de los últimos 5 años (250 semanas) y el total de semanas cotizadas. Entre más semanas y mayor salario, mejor pensión.',
          },
          {
            title: 'Régimen de 1997',
            body: 'Tu pensión depende enteramente de los recursos que hayas acumulado en tu cuenta individual de AFORE.',
          },
          {
            title: 'Edad de Retiro',
            body: 'La edad mínima para pensión por cesantía es de 60 años (obteniendo el 75% en Ley 73) y por vejez a los 65 años (100%).',
          },
        ]}
        faqs={[
          {
            question: '¿Qué régimen de pensión me corresponde?',
            answer: 'Si empezaste a cotizar al IMSS antes del 1 de julio de 1997, te corresponde la Ley del 73. Si empezaste después de esa fecha, te corresponde la Ley del 97.',
          },
          {
            question: '¿Cuántas semanas necesito para pensionarme?',
            answer: 'Para la Ley 73 necesitas un mínimo de 500 semanas. Para la Ley 97, en 2026 requieres 875 semanas.',
          }
        ]}
      />
    </WorkspacePage>
  );
};
