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
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileText,
  User,
  FileDown,
  CheckCircle2,
  Settings2,
  Sparkles
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { BreakdownChart } from './BreakdownChart';

type DismissalType = 'injustificado' | 'renuncia' | 'rescision_patron' | 'rescision_trabajador';

export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  user?: any;
  userData?: any;
  onAuthRequired?: () => void;
  isSimplified?: boolean;
}> = ({ notify, user, userData, onAuthRequired, isSimplified = false }) => {
  const [step, setStep] = useState(1);
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
  const [tripleOvertimeHours, setTripleOvertimeHours] = useState<number>(0);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [dismissalType, setDismissalType] = useState<DismissalType>('injustificado');
  const [minWage, setMinWage] = useState<number>(312.41); // Salario Mínimo General Vigente 2026 (Proyectado)
  const [showErrors, setShowErrors] = useState(false);

  // Sincronización de Antigüedad basada en fechas
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
    formulas: {
      aguinaldo: string;
      vacations: string;
      vacationPremium: string;
      indemnity90: string;
      indemnity20: string;
      seniorityPremium: string;
      overtime: string;
    };
  } | null>(null);

  const calculate = async () => {
    // Validaciones preventivas
    if (dailySalary <= 0 || (yearsOfService <= 0 && daysOfService <= 0)) {
      setShowErrors(true);
      notify("Complete los campos obligatorios marcados para generar el cálculo", "warning");
      return;
    }
    setShowErrors(false);

    const isPremiumValid = userData?.isPremium && (!userData?.expiresAt || (userData.expiresAt.toDate ? userData.expiresAt.toDate() : new Date(userData.expiresAt)) >= new Date());
    
    if (!isPremiumValid) {
      if (!user) {
        const usageKey = `lex_laboral_calc_anon`;
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
    
    // Cálculo de antigüedad exacta promediada
    // Se usa 365.25 para considerar el ciclo bisiesto en proporciones de larga duración
    const totalYears = yearsOfService + (daysOfService / 365.25);
    const hourlyRate = dailySalary / hoursPerDay;
    
    // 1. Finiquito (Siempre se paga)
    const proportionOfYear = daysOfService / 365.25;
    const aguinaldo = (dailySalary * aguinaldoDays) * proportionOfYear;
    const vacations = (dailySalary * vacationDays) * proportionOfYear;
    const vPremium = vacations * (vacationPremium / 100);
    const overtimeDouble = doubleOvertimeHours * (hourlyRate * 2);
    const overtimeTriple = tripleOvertimeHours * (hourlyRate * 3);
    const totalOvertime = overtimeDouble + overtimeTriple;

    const finiquito = aguinaldo + vacations + vPremium + totalOvertime;

    // 2. Liquidación (Depende del tipo de despido)
    let indemnity90 = 0;
    let indemnity20 = 0;
    let seniorityPremium = 0;

    // Prima de Antigüedad (Art. 162 LFT)
    // Tope: 2 veces el salario mínimo (Art. 486 LFT)
    const cappedSalary = Math.min(dailySalary, minWage * 2);
    
    const shouldPaySeniority = 
      dismissalType !== 'renuncia' || (dismissalType === 'renuncia' && yearsOfService >= 15);

    if (shouldPaySeniority) {
      // 12 días por cada año laborado
      seniorityPremium = (cappedSalary * 12) * totalYears;
    }

    if (dismissalType === 'injustificado' || dismissalType === 'rescision_trabajador') {
      indemnity90 = dailySalary * 90;
      // Indemnización de 20 días por año (Art. 50 LFT)
      indemnity20 = (dailySalary * 20) * totalYears;
    }

    const liquidacion = indemnity90 + indemnity20 + seniorityPremium;

    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    setResults({
      aguinaldo: round(aguinaldo),
      vacations: round(vacations),
      vacationPremium: round(vPremium),
      indemnity90: round(indemnity90),
      indemnity20: round(indemnity20),
      seniorityPremium: round(seniorityPremium),
      overtime: round(totalOvertime),
      finiquito: round(finiquito),
      liquidacion: round(liquidacion),
      total: round(finiquito + liquidacion),
      formulas: {
        aguinaldo: `Salario Diario: $${dailySalary.toFixed(2)}\nDías de aguinaldo: ${aguinaldoDays}\nProporción del año: ${(proportionOfYear).toFixed(2)}\n$${dailySalary.toFixed(2)} × ${aguinaldoDays} × ${(proportionOfYear).toFixed(2)} = $${round(aguinaldo).toFixed(2)}`,
        vacations: `Salario Diario: $${dailySalary.toFixed(2)}\nDías de vacaciones: ${vacationDays}\nProporción del año: ${(proportionOfYear).toFixed(2)}\n$${dailySalary.toFixed(2)} × ${vacationDays} × ${(proportionOfYear).toFixed(2)} = $${round(vacations).toFixed(2)}`,
        vacationPremium: `Monto vacaciones: $${round(vacations).toFixed(2)}\nPorcentaje de prima: ${vacationPremium}%\n$${round(vacations).toFixed(2)} × ${(vacationPremium / 100).toFixed(2)} = $${round(vPremium).toFixed(2)}`,
        indemnity90: `Salario Diario: $${dailySalary.toFixed(2)}\nDías de indemnización: 90\n$${dailySalary.toFixed(2)} × 90 = $${round(indemnity90).toFixed(2)}`,
        indemnity20: `Salario Diario: $${dailySalary.toFixed(2)}\nDías por año: 20\nAños laborados (exactos): ${totalYears.toFixed(2)}\n$${dailySalary.toFixed(2)} × 20 × ${totalYears.toFixed(2)} = $${round(indemnity20).toFixed(2)}`,
        seniorityPremium: `Salario Topado (Max 2 SMG): $${cappedSalary.toFixed(2)}\nDías por año: 12\nAños laborados (exactos): ${totalYears.toFixed(2)}\n$${cappedSalary.toFixed(2)} × 12 × ${totalYears.toFixed(2)} = $${round(seniorityPremium).toFixed(2)}`,
        overtime: `Salario por hora: $${hourlyRate.toFixed(2)}\nHoras dobles: ${doubleOvertimeHours} ($${(hourlyRate * 2).toFixed(2)}/hr)\nHoras triples: ${tripleOvertimeHours} ($${(hourlyRate * 3).toFixed(2)}/hr)\n($${hourlyRate.toFixed(2)} × 2 × ${doubleOvertimeHours}) + ($${hourlyRate.toFixed(2)} × 3 × ${tripleOvertimeHours}) = $${round(totalOvertime).toFixed(2)}`,
      }
    });
    
    notify("Cálculo generado", "success");
  };

  // Auto-recálculo cuando cambian parámetros clave y ya hay resultados
  React.useEffect(() => {
    if (results) {
      calculate();
    }
  }, [dismissalType, yearsOfService, daysOfService, dailySalary]);

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
    ].filter(d => d.value > 0);
  }, [results]);

  const handleExportPDF = async () => {
    if (!results) return;
    
    try {
      notify("Iniciando generación de dictamen PDF...", "info");
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [30, 41, 59]; // slate-900
      const goldColor: [number, number, number] = [212, 175, 55]; // legal-gold

      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LEXLABORAL', 20, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('DICTAMEN TÉCNICO DE LIQUIDACIÓN LABORAL', 20, 32);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
      doc.text(`Tipo: ${dismissalType.toUpperCase().replace('_', ' ')}`, 20, 50);

      // Input Data Table
      autoTable(doc, {
        startY: 60,
        head: [['Concepto de Entrada', 'Valor']],
        body: [
          ['Fecha de Ingreso', startDate || 'No especificada'],
          ['Fecha de Baja', endDate || 'No especificada'],
          ['Antigüedad', `${yearsOfService} años, ${daysOfService} días`],
          ['Salario Diario Integrado (SDI)', `$${dailySalary.toFixed(2)}`],
          ['Salario Mínimo (Tope)', `$${minWage.toFixed(2)}`],
          ['Días Aguinaldo', `${aguinaldoDays}`],
          ['Días Vacaciones', `${vacationDays}`],
        ],
        headStyles: { fillColor: primaryColor },
        theme: 'striped',
      });

      // Results Table
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Desglose de Prestaciones', 'Monto (MXN)', 'Fundamento']],
        body: [
          ['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`, 'Art. 87 LFT'],
          ['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`, 'Art. 76 LFT'],
          ['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`, 'Art. 80 LFT'],
          ['Horas Extras', `$${results.overtime.toFixed(2)}`, 'Art. 67/68 LFT'],
          ['Indemnización Constitucional (90 días)', `$${results.indemnity90.toFixed(2)}`, 'Art. 48 LFT'],
          ['Indemnización (20 días por año)', `$${results.indemnity20.toFixed(2)}`, 'Art. 50 LFT'],
          ['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`, 'Art. 162 LFT'],
        ],
        headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' },
          2: { fontStyle: 'italic', fontSize: 8 }
        }
      });

      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GLOBAL ESTIMADO:', 20, finalY);
      doc.text(`$${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 140, finalY);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const footerText = 'Este documento es una simulación técnica generada por LexLaboral. No constituye asesoría legal vinculante.';
      doc.text(footerText, 105, 285, { align: 'center' });

      doc.save(`Dictamen_LexLaboral_${new Date().getTime()}.pdf`);
      notify("Reporte PDF generado satisfactoriamente", "success");
    } catch (error) {
      console.error("PDF Export Error:", error);
      notify("Error al generar el PDF. Intente nuevamente.", "error");
    }
  };

  const handleExport = () => {
    if (!results) return;
    const content = `SIMULACIÓN DE DESPIDO / FINIQUITO - LEXLABORAL
Fecha: ${new Date().toLocaleDateString()}
Tipo de Movimiento: ${dismissalType.toUpperCase().replace('_', ' ')}

DATOS DE ENTRADA:
Salario Diario: $${dailySalary.toFixed(2)}
Antigüedad: ${yearsOfService} años, ${daysOfService} días
Salario Mínimo (Tope): $${minWage.toFixed(2)}

DESGLOSE DE FINIQUITO:
- Aguinaldo Proporcional: $${results.aguinaldo.toFixed(2)}
- Vacaciones Proporcionales: $${results.vacations.toFixed(2)}
- Prima Vacacional: $${results.vacationPremium.toFixed(2)}
- Horas Extras: $${results.overtime.toFixed(2)}
SUBTOTAL FINIQUITO: $${results.finiquito.toFixed(2)}

DESGLOSE DE LIQUIDACIÓN:
- Indemnización Constitucional (90 días): $${results.indemnity90.toFixed(2)}
- Indemnización (20 días por año): $${results.indemnity20.toFixed(2)}
- Prima de Antigüedad (Tope 2 SM): $${results.seniorityPremium.toFixed(2)}
SUBTOTAL LIQUIDACIÓN: $${results.liquidacion.toFixed(2)}

TOTAL GLOBAL ESTIMADO: $${results.total.toFixed(2)}

---
FUNDAMENTACIÓN LEGAL:
- Aguinaldo: Art. 87 LFT
- Vacaciones: Art. 76 LFT
- Prima Vacacional: Art. 80 LFT
- Indemnización 90 días: Art. 123 Const. / Art. 48 LFT
- Indemnización 20 días: Art. 50 LFT
- Prima Antigüedad: Art. 162 LFT (Tope Art. 486)

Este documento es una simulación técnica. No constituye asesoría legal vinculante.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Simulacion_Despido_${new Date().getTime()}.txt`;
    link.click();
    notify("Simulación exportada (TXT)", "success");
  };

  const renderProfessionalView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Panel de Entradas */}
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-slate-900 mb-2">
                <User size={18} className="text-legal-gold" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Datos del Trabajador</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Asistente de Salario Base</label>
                      <button 
                         onClick={() => {
                            setBaseSalary(0);
                            setIsSdiCalculated(false);
                         }}
                         className="text-[10px] font-bold text-legal-gold hover:text-legal-800 uppercase tracking-tight"
                      >
                         Reiniciar
                      </button>
                   </div>
                   
                      <div className="space-y-3">
                         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                               <button 
                                  key={p}
                                  onClick={() => setSalaryPeriod(p)}
                                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${salaryPeriod === p ? 'bg-legal-950 text-white shadow' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                               >
                                  {p === 'daily' ? 'Día' : p === 'weekly' ? 'Semana' : p === 'biweekly' ? 'Quincena' : 'Mes'}
                               </button>
                            ))}
                         </div>
                         <div className="flex gap-3">
                            <div className="relative flex-1 group">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-legal-gold transition-colors">$</span>
                               <input 
                                  type="number" 
                                  placeholder="Monto de salario base"
                                  value={baseSalary || ''}
                                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold transition-all"
                               />
                            </div>
                         </div>
                         {isSdiCalculated && baseSalary > 0 ? (
                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                               <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">SDI Integrado Automáticamente</p>
                                  <p className="text-lg font-serif font-bold text-emerald-900">${dailySalary.toFixed(2)}</p>
                               </div>
                               <CheckCircle2 className="text-emerald-500" size={20} />
                            </div>
                         ) : (
                            <p className="text-[10px] text-slate-500 italic">Escriba su salario antes de impuestos. El cálculo se hará automáticamente.</p>
                         )}
                      </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Salario Diario Integrado Final</label>
                    <div className="group relative">
                      <Info size={12} className="text-slate-300 hover:text-legal-gold cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-800 text-[11px] text-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Suma de salario diario más proporciones de aguinaldo y prima vacacional (Art. 84 LFT).
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-legal-gold transition-colors">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={dailySalary || ''} 
                      onChange={(e) => {
                        setDailySalary(Number(e.target.value));
                        setIsSdiCalculated(true);
                      }}
                      className={`w-full pl-8 pr-4 py-3.5 bg-slate-50 border rounded-xl text-sm outline-none transition-all shadow-sm ${
                        (showErrors && dailySalary <= 0) || dailySalary < 0
                          ? 'border-red-500 ring-4 ring-red-500/10'
                          : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold focus:bg-white'
                      }`}
                      placeholder="0.00"
                    />
                    {showErrors && dailySalary <= 0 && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 absolute -bottom-5 right-0">Ingrese un salario</span>
                    )}
                  </div>
                  {dailySalary < 0 && (
                    <p className="text-[11px] text-red-500 font-bold animate-pulse mt-1">El salario no puede ser negativo</p>
                  )}
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                    <div className="space-y-3 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={14} className="text-legal-gold" />
                        Fecha de Ingreso
                      </label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm text-slate-700 outline-none transition-all shadow-sm ${
                          showErrors && !startDate
                            ? 'border-red-500 ring-4 ring-red-500/10'
                            : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold focus:bg-white'
                        }`}
                      />
                      {showErrors && !startDate && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 absolute -bottom-5 left-0">Requerido</span>
                      )}
                    </div>
                    <div className="space-y-3 relative">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={14} className="text-legal-gold" />
                        Fecha de Baja
                      </label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-sm text-slate-700 outline-none transition-all shadow-sm ${
                          showErrors && !endDate
                            ? 'border-red-500 ring-4 ring-red-500/10'
                            : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold focus:bg-white'
                        }`}
                      />
                      {showErrors && !endDate && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 absolute -bottom-5 left-0">Requerido</span>
                      )}
                    </div>
                  </div>

                  {yearsOfService > 0 || daysOfService > 0 ? (
                    <div className="bg-legal-gold/5 border border-legal-gold/10 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-legal-gold/10 flex items-center justify-center">
                          <Zap size={16} className="text-legal-gold" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Antigüedad Calculada</p>
                          <p className="text-xs font-bold text-legal-950">
                            {yearsOfService} {yearsOfService === 1 ? 'año' : 'años'} y {daysOfService} {daysOfService === 1 ? 'día' : 'días'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
              </div>

              {user && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings2 size={18} className="text-legal-gold" />
                      <div className="text-left">
                        <span className="block text-sm font-bold text-slate-900">Ajustar prestaciones y detalles</span>
                        <span className="block text-[11px] text-slate-500">Modo avanzado</span>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-slate-100 space-y-6">
                      <div className="flex items-center gap-2 text-slate-900 mb-2">
                        <FileText size={18} className="text-legal-gold" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Prestaciones</h3>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                        <p className="text-[11px] text-slate-500 mb-4">
                          Valores prellenados con los mínimos de ley (LFT). Puedes ajustarlos si tu empresa ofrece prestaciones superiores.
                        </p>

                        <div className="grid grid-cols-2 gap-5 mb-5">
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aguinaldo (Días)</label>
                            <input
                              type="number"
                              min="0"
                              value={aguinaldoDays}
                              onChange={(e) => setAguinaldoDays(Number(e.target.value))}
                              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all shadow-sm ${
                                aguinaldoDays < 0
                                  ? 'border-red-500 ring-4 ring-red-500/10'
                                  : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold'
                              }`}
                            />
                            {aguinaldoDays < 0 && (
                              <p className="text-[11px] text-red-500 font-bold mt-1">No puede ser negativo</p>
                            )}
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vacaciones (Días)</label>
                            <input
                              type="number"
                              min="0"
                              value={vacationDays}
                              onChange={(e) => setVacationDays(Number(e.target.value))}
                              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all shadow-sm ${
                                vacationDays < 0
                                  ? 'border-red-500 ring-4 ring-red-500/10'
                                  : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold'
                              }`}
                            />
                            {vacationDays < 0 && (
                              <p className="text-[11px] text-red-500 font-bold mt-1">No puede ser negativo</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Prima Vacacional (%)</label>
                            <input
                              type="number"
                              min="0"
                              value={vacationPremium}
                              onChange={(e) => setVacationPremium(Number(e.target.value))}
                              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all shadow-sm ${
                                vacationPremium < 0
                                  ? 'border-red-500 ring-4 ring-red-500/10'
                                  : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold'
                              }`}
                            />
                            {vacationPremium < 0 && (
                              <p className="text-[11px] text-red-500 font-bold mt-1">No puede ser negativo</p>
                            )}
                          </div>
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Horas Extras</label>
                            <input
                              type="number"
                              min="0"
                              value={doubleOvertimeHours || ''}
                              onChange={(e) => setDoubleOvertimeHours(Number(e.target.value))}
                              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all shadow-sm ${
                                doubleOvertimeHours < 0
                                  ? 'border-red-500 ring-4 ring-red-500/10'
                                  : 'border-slate-200 focus:ring-4 focus:ring-legal-gold/10 focus:border-legal-gold'
                              }`}
                              placeholder="0"
                            />
                            {doubleOvertimeHours < 0 && (
                              <p className="text-[11px] text-red-500 font-bold mt-1">No puede ser negativo</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={calculate}
                disabled={dailySalary <= 0 || (yearsOfService <= 0 && daysOfService <= 0)}
                className="w-full py-4 bg-legal-950 text-legal-gold rounded-xl font-bold shadow-lg shadow-legal-950/20 hover:bg-legal-900 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <TrendingUp size={18} />
                <span>Calcular Liquidación</span>
              </button>
            </section>

            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
              <AlertCircle className="text-blue-500 shrink-0" size={20} />
              <p className="text-[11px] text-blue-800 leading-relaxed">
                <strong>Nota Legal:</strong> El cálculo de la Prima de Antigüedad está topado a 2 salarios mínimos (${(minWage * 2).toFixed(2)}) según el Art. 486 de la LFT.
              </p>
            </div>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-300 bg-gradient-to-b from-white to-slate-50 rounded-[2rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-slate-50 opacity-50 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-100 z-10"
                  >
                    <div className="w-16 h-16 bg-legal-gold/10 rounded-full flex items-center justify-center">
                      <Calculator size={32} className="text-legal-gold" />
                    </div>
                  </motion.div>

                  <h4 className="text-2xl font-serif font-bold text-slate-900 mb-3 z-10">Proyección Legal Lista</h4>
                  <p className="text-sm text-slate-500 text-center max-w-md leading-relaxed z-10">
                    Complete la información del trabajador en el panel izquierdo para generar un dictamen técnico detallado de finiquito e indemnizaciones.
                  </p>

                  <div className="mt-8 flex gap-4 opacity-40 grayscale pointer-events-none blur-[1px]">
                     <div className="w-32 h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col p-3">
                        <div className="w-1/2 h-2 bg-slate-200 rounded mb-2"></div>
                        <div className="w-3/4 h-4 bg-slate-300 rounded"></div>
                     </div>
                     <div className="w-32 h-20 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col p-3">
                        <div className="w-1/2 h-2 bg-slate-200 rounded mb-2"></div>
                        <div className="w-3/4 h-4 bg-slate-300 rounded"></div>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Resumen Principal */}
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Global Estimado</span>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                          <h3 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mt-1">
                            ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <span className="text-slate-400 font-medium text-sm">MXN</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setResults(null)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] border border-slate-200 active:scale-95">
                          <RefreshCw size={12} /> <span className="hidden xs:inline">Reiniciar</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all text-[10px] border border-slate-200 active:scale-95">
                          <Download size={12} /> <span className="hidden xs:inline">TXT</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-legal-950 text-legal-gold font-bold rounded-xl shadow-md hover:bg-legal-900 hover:shadow-lg hover:-translate-y-0.5 transition-all text-[10px] active:scale-95">
                          <FileDown size={14} /> <span>PDF</span>
                        </button>
                      </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Gráfico */}
                      <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Distribución de Prestaciones</h4>
                        <div className="h-[240px] w-full">
                          <BreakdownChart data={chartData} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {chartData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-[10px] font-medium text-slate-500 truncate">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desglose Detallado con Fórmulas */}
                      <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Desglose del cálculo</h4>
                        </div>

                        <div className="space-y-3">
                          {[
                            { key: 'aguinaldo', label: 'Aguinaldo proporcional', value: results.aguinaldo, formula: results.formulas.aguinaldo },
                            { key: 'vacations', label: 'Vacaciones proporcionales', value: results.vacations, formula: results.formulas.vacations },
                            { key: 'vacationPremium', label: 'Prima vacacional', value: results.vacationPremium, formula: results.formulas.vacationPremium },
                            { key: 'indemnity90', label: '3 meses de indemnización', value: results.indemnity90, formula: results.formulas.indemnity90 },
                            { key: 'indemnity20', label: '20 días por año trabajado', value: results.indemnity20, formula: results.formulas.indemnity20 },
                            { key: 'seniorityPremium', label: 'Prima de antigüedad', value: results.seniorityPremium, formula: results.formulas.seniorityPremium },
                            { key: 'overtime', label: 'Horas extras', value: results.overtime, formula: results.formulas.overtime }
                          ].filter(item => item.value > 0).map((item) => (
                            <div key={item.key} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all">
                              <button
                                onClick={() => setExpandedBreakdown(expandedBreakdown === item.key ? null : item.key)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors text-left"
                              >
                                <div>
                                  <span className="block text-sm font-bold text-slate-800">{item.label}</span>
                                  <span className="text-[10px] font-medium text-legal-gold flex items-center gap-1 mt-0.5">
                                    Ver cálculo <ChevronDown size={12} className={`transition-transform ${expandedBreakdown === item.key ? 'rotate-180' : ''}`} />
                                  </span>
                                </div>
                                <span className="font-bold text-slate-900">
                                  ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </button>

                              <AnimatePresence>
                                {expandedBreakdown === item.key && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-200 bg-white"
                                  >
                                    <div className="p-4 bg-slate-50/50">
                                      <pre className="text-[11px] text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                                        {item.formula}
                                      </pre>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust / Credibility Footer */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-legal-gold/10 flex items-center justify-center">
                        <Scale size={20} className="text-legal-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Basado en la Ley Federal del Trabajo de México</p>
                        <p className="text-[11px] text-slate-500">Estimación informativa, no sustituye asesoría legal oficial.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Analizar contrato
                      </button>
                      <button className="flex-1 md:flex-none px-4 py-2.5 bg-legal-950 text-legal-gold text-xs font-bold rounded-xl hover:bg-legal-900 shadow-sm transition-colors flex items-center justify-center gap-2">
                        Preguntar a Lexi
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
    </div>
  );

  const renderSimplifiedStepper = () => (
    <div className="max-w-3xl mx-auto border border-slate-200 rounded-[2rem] bg-white shadow-xl overflow-hidden min-h-[600px] flex flex-col">
      {/* Stepper Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-legal-950 text-legal-gold shadow-lg' : 'bg-white border border-slate-200 text-slate-400'}`}>
              {step > s ? <CheckCircle2 size={18} /> : s}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest hidden md:block ${step === s ? 'text-slate-900' : 'text-slate-400'}`}>
              {s === 1 ? 'Sueldo y Fechas' : s === 2 ? 'Motivo de Baja' : 'Resultado'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 rounded-full hidden md:block ${step > s ? 'bg-legal-950' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 p-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-900">Configure su Salario</h3>
                <p className="text-sm text-slate-500">Ingrese su salario bruto antes de impuestos.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                    <button key={p} onClick={() => setSalaryPeriod(p)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${salaryPeriod === p ? 'bg-legal-950 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {p === 'daily' ? 'Día' : p === 'weekly' ? 'Semana' : p === 'biweekly' ? 'Quincena' : 'Mes'}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value))} className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none focus:ring-4 focus:ring-legal-gold/10" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha de Ingreso</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha de Baja</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-900">Motivo del Término</h3>
                <p className="text-sm text-slate-500">Seleccione la causa que mejor describa su salida.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'injustificado', title: 'Despido Injustificado', desc: 'La empresa terminó la relación sin causa legal.' },
                  { id: 'renuncia', title: 'Renuncia Voluntaria', desc: 'Usted decidió dejar el empleo voluntariamente.' },
                  { id: 'rescision_patron', title: 'Rescisión Justificada', desc: 'La empresa terminó la relación por una falta cometida.' }
                ].map((m) => (
                  <button key={m.id} onClick={() => setDismissalType(m.id as DismissalType)} className={`p-6 rounded-2xl border-2 text-left transition-all ${dismissalType === m.id ? 'border-legal-gold bg-legal-gold/5 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}>
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && results && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center py-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-bold text-slate-900">Total Proyectado</h3>
                <p className="text-5xl font-serif font-bold text-legal-gold mt-2">
                  ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-400 font-medium">Pesos Mexicanos (MXN)</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4">
                <div className="text-left bg-white p-4 rounded-xl shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Finiquito</p>
                   <p className="text-lg font-bold text-slate-800">${results.finiquito.toLocaleString()}</p>
                </div>
                <div className="text-left bg-white p-4 rounded-xl shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Liquidación</p>
                   <p className="text-lg font-bold text-slate-800">${results.liquidacion.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                 <button onClick={onAuthRequired} className="w-full py-4 bg-legal-950 text-legal-gold rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    <Sparkles size={18} />
                    <span>Obtener Dictamen PDF Completo</span>
                 </button>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Inicie sesión para descargar el desglose técnico</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-between items-center">
        {step > 1 && step < 3 && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
            Anterior
          </button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <button 
            onClick={() => {
              if (step === 1) {
                if (dailySalary > 0 && startDate && endDate) setStep(2);
                else notify("Complete los datos requeridos", "warning");
              } else if (step === 2) {
                calculate();
                setStep(3);
              }
            }} 
            className="px-8 py-3.5 bg-legal-950 text-legal-gold rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>{step === 2 ? 'Ver Resultados' : 'Siguiente'}</span>
            <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={() => { setResults(null); setStep(1); }} className="px-8 py-3.5 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all">
            Nuevo Cálculo
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-legal-gold">
               <Calculator size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {isSimplified ? 'Asistente de Liquidación' : 'Cálculo de Liquidación LFT'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {isSimplified ? 'Proyección simplificada de finiquitos legales.' : 'Determinación técnica de indemnizaciones y finiquitos legales.'}
              </p>
            </div>
          </div>
          
          {!isSimplified && user && (
            <div className="flex flex-wrap bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start gap-1">
              {(['injustificado', 'renuncia', 'rescision_patron'] as DismissalType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDismissalType(type)}
                  className={`flex-1 min-w-[100px] px-3 md:px-5 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all transform active:scale-95 ${
                    dismissalType === type 
                      ? 'bg-legal-950 text-legal-gold shadow-lg ring-2 ring-legal-gold/20 scale-[1.02]' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type === 'injustificado' ? 'Injustificado' : type === 'renuncia' ? 'Renuncia' : 'Rescisión'}
                </button>
              ))}
            </div>
          )}
        </header>

        {isSimplified ? renderSimplifiedStepper() : renderProfessionalView()}
      </div>
    </div>
  );
};
