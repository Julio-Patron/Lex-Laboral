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
  TrendingUp,
  FileText,
  User,
  FileDown,
  CheckCircle2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type DismissalType = 'injustificado' | 'renuncia' | 'rescision_patron' | 'rescision_trabajador';

export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const [dailySalary, setDailySalary] = useState<number>(0);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryPeriod, setSalaryPeriod] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [isSdiCalculated, setIsSdiCalculated] = useState(false);

  const calculateSDI = () => {
    let daily = 0;
    if (salaryPeriod === 'daily') daily = baseSalary;
    else if (salaryPeriod === 'weekly') daily = baseSalary / 7;
    else if (salaryPeriod === 'biweekly') daily = baseSalary / 15;
    else if (salaryPeriod === 'monthly') daily = baseSalary / 30;

    // Integración base (Ley Federal del Trabajo):
    // Aguinaldo (15 días) + Prima Vacacional (25% de 12 días mínimo)
    // Factor = 1 + (15/365) + (12 * 0.25 / 365) = 1.0493
    const factor = 1 + (aguinaldoDays / 365.25) + (vacationDays * (vacationPremium / 100) / 365.25);
    const sdi = daily * factor;
    setDailySalary(Math.round(sdi * 100) / 100);
    setIsSdiCalculated(true);
    notify(`Salario Integrado calculado: $${sdi.toFixed(2)}`, "info");
  };
  const [yearsOfService, setYearsOfService] = useState<number>(0);
  const [daysOfService, setDaysOfService] = useState<number>(0);
  const [vacationDays, setVacationDays] = useState<number>(12);
  const [vacationPremium, setVacationPremium] = useState<number>(25);
  const [aguinaldoDays, setAguinaldoDays] = useState<number>(15);
  const [doubleOvertimeHours, setDoubleOvertimeHours] = useState<number>(0);
  const [tripleOvertimeHours, setTripleOvertimeHours] = useState<number>(0);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [dismissalType, setDismissalType] = useState<DismissalType>('injustificado');
  const [minWage, setMinWage] = useState<number>(312.41); // Salario Mínimo General Vigente 2026 (Proyectado)

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
  } | null>(null);

  const calculate = () => {
    // Validaciones preventivas
    if (dailySalary <= 0) {
      notify("Ingrese un Salario Diario Integrado válido (mayor a 0)", "warning");
      return;
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
      total: round(finiquito + liquidacion)
    });
    
    notify("Dictamen técnico generado con precisión actualizada", "success");
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
          ['Salario Diario Integrado (SDI)', `$${dailySalary.toFixed(2)}`],
          ['Antigüedad', `${yearsOfService} años, ${daysOfService} días`],
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

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
               <Calculator className="text-legal-gold" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Cálculo de Liquidación LFT</h2>
              <p className="text-slate-500 text-sm font-medium">Determinación técnica de indemnizaciones y finiquitos legales.</p>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
            {(['injustificado', 'renuncia', 'rescision_patron'] as DismissalType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDismissalType(type)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  dismissalType === type 
                    ? 'bg-legal-950 text-legal-gold shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type === 'injustificado' ? 'Injustificado' : type === 'renuncia' ? 'Renuncia' : 'Rescisión'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Panel de Entradas */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-slate-900 mb-2">
                <User size={18} className="text-legal-gold" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Datos del Trabajador</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asistente de Salario Base</label>
                      <button 
                         onClick={() => setIsSdiCalculated(false)} 
                         className="text-[9px] font-bold text-legal-gold hover:text-legal-800 uppercase tracking-tighter"
                      >
                         Reiniciar
                      </button>
                   </div>
                   
                   {!isSdiCalculated ? (
                      <div className="space-y-3">
                         <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                            {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                               <button 
                                  key={p}
                                  onClick={() => setSalaryPeriod(p)}
                                  className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${salaryPeriod === p ? 'bg-legal-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                               >
                                  {p === 'daily' ? 'Día' : p === 'weekly' ? 'Sem' : p === 'biweekly' ? 'Quinc' : 'Mes'}
                               </button>
                            ))}
                         </div>
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs">$</span>
                               <input 
                                  type="number" 
                                  placeholder="Monto"
                                  value={baseSalary || ''}
                                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-legal-gold/20"
                               />
                            </div>
                            <button 
                               onClick={calculateSDI}
                               disabled={baseSalary <= 0}
                               className="px-3 py-2 bg-legal-gold text-legal-950 rounded-lg text-[10px] font-bold hover:bg-legal-goldhover transition-all disabled:opacity-50"
                            >
                               Integrar
                            </button>
                         </div>
                         <p className="text-[9px] text-slate-400 italic">Escriba su salario antes de impuestos.</p>
                      </div>
                   ) : (
                      <div className="bg-white p-3 rounded-xl border border-legal-gold/20 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SDI Calculado</p>
                            <p className="text-lg font-serif font-bold text-legal-950">${dailySalary.toFixed(2)}</p>
                         </div>
                         <CheckCircle2 className="text-emerald-500" size={20} />
                      </div>
                   )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salario Diario Integrado Final</label>
                    <div className="group relative">
                      <Info size={12} className="text-slate-300 hover:text-legal-gold cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[9px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Suma de salario diario más prestaciones (Art. 84 LFT).
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold group-focus-within:text-legal-gold transition-colors">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={dailySalary || ''} 
                      onChange={(e) => {
                        setDailySalary(Number(e.target.value));
                        setIsSdiCalculated(true);
                      }}
                      className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        dailySalary < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {dailySalary < 0 && (
                    <p className="text-[10px] text-red-500 font-bold animate-pulse">El salario no puede ser negativo</p>
                  )}
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Años</label>
                      <input 
                        type="number" 
                        min="0"
                        value={yearsOfService || ''} 
                        onChange={(e) => setYearsOfService(Number(e.target.value))}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                          yearsOfService < 0 
                            ? 'border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                        }`}
                        placeholder="0"
                      />
                      {yearsOfService < 0 && (
                        <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días Extra</label>
                      <input 
                        type="number" 
                        min="0"
                        value={daysOfService || ''} 
                        onChange={(e) => setDaysOfService(Number(e.target.value))}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                          daysOfService < 0 
                            ? 'border-red-500 focus:ring-red-500/20' 
                            : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                        }`}
                        placeholder="0"
                      />
                      {daysOfService < 0 && (
                        <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                      )}
                    </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 mb-2">
                  <FileText size={18} className="text-legal-gold" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Prestaciones</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguinaldo (Días)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={aguinaldoDays} 
                      onChange={(e) => setAguinaldoDays(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        aguinaldoDays < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                    />
                    {aguinaldoDays < 0 && (
                      <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacaciones (Días)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={vacationDays} 
                      onChange={(e) => setVacationDays(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        vacationDays < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                    />
                    {vacationDays < 0 && (
                      <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prima Vacacional (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={vacationPremium} 
                      onChange={(e) => setVacationPremium(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        vacationPremium < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                    />
                    {vacationPremium < 0 && (
                      <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horas Extras (Dobles)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={doubleOvertimeHours || ''} 
                      onChange={(e) => setDoubleOvertimeHours(Number(e.target.value))}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                        doubleOvertimeHours < 0 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-legal-gold/20 focus:border-legal-gold'
                      }`}
                      placeholder="0"
                    />
                    {doubleOvertimeHours < 0 && (
                      <p className="text-[9px] text-red-500 font-bold">No puede ser negativo</p>
                    )}
                  </div>
                </div>
              </div>

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
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-300 bg-white rounded-[2rem] border border-slate-200 p-12 border-dashed"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Coins size={40} className="text-slate-200" />
                  </div>
                  <h4 className="text-slate-900 font-bold mb-2">Esperando Datos</h4>
                  <p className="text-sm text-slate-400 text-center max-w-xs">Complete la información del trabajador para generar la proyección legal detallada.</p>
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
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-5xl font-serif font-bold text-slate-900 mt-1">
                            ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <span className="text-slate-400 font-medium text-sm">MXN</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setResults(null)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] border border-slate-200 active:scale-95">
                          <RefreshCw size={12} /> Reiniciar
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all text-[10px] border border-slate-200 active:scale-95">
                          <Download size={12} /> TXT
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-legal-950 text-legal-gold font-bold rounded-xl shadow-md hover:bg-legal-900 hover:shadow-lg hover:-translate-y-0.5 transition-all text-[10px] active:scale-95">
                          <FileDown size={14} /> Exportar PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Gráfico */}
                      <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Distribución de Prestaciones</h4>
                        <div className="h-[240px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
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

                      {/* Desglose Detallado */}
                      <div className="p-8 space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finiquito</h4>
                            <span className="text-sm font-bold text-slate-900">${results.finiquito.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Aguinaldo y Vacaciones</span>
                              <span>${(results.aguinaldo + results.vacations + results.vacationPremium).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Horas Extras</span>
                              <span>${results.overtime.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Liquidación</h4>
                            <span className="text-sm font-bold text-legal-950">${results.liquidacion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Indemnización 90 días</span>
                              <span>${results.indemnity90.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {results.indemnity20 > 0 && (
                              <div className="flex justify-between text-xs text-slate-500 bg-legal-gold/5 p-1 rounded">
                                <span className="font-bold">Indemnización 20 días/año</span>
                                <span className="font-bold">${results.indemnity20.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Prima de Antigüedad</span>
                              <span>${results.seniorityPremium.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarjetas de Fundamentación */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: "Indemnización", art: "Art. 48 LFT", desc: "90 días de salario integrado por despido injustificado." },
                      { title: "Antigüedad", art: "Art. 162 LFT", desc: "12 días por año laborado, topado a 2 salarios mínimos." },
                      { title: "Finiquito", art: "Art. 76/87 LFT", desc: "Parte proporcional de aguinaldo y vacaciones devengadas." },
                    ].map((item, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.art}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
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
