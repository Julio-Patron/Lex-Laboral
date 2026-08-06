export type DismissalType = 'injustificado' | 'renuncia' | 'rescision_patron' | 'rescision_trabajador';

export interface LaborSettlementInput {
  dailySalary: number;
  yearsOfService: number;
  daysOfService: number;
  vacationDays: number;
  vacationPremium: number;
  aguinaldoDays: number;
  doubleOvertimeHours: number;
  tripleOvertimeHours: number;
  hoursPerDay: number;
  dismissalType: DismissalType;
  minWage: number;
  umaValue: number;
}

export interface LaborSettlementResult {
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
}

const calculateMonthlyISR = (amount: number): number => {
  const limits = [
    { lower: 0.01, upper: 746.04, fixed: 0, percent: 0.0192 },
    { lower: 746.05, upper: 6332.05, fixed: 14.32, percent: 0.064 },
    { lower: 6332.06, upper: 11128.01, fixed: 371.83, percent: 0.1088 },
    { lower: 11128.02, upper: 12935.82, fixed: 893.63, percent: 0.16 },
    { lower: 12935.83, upper: 15487.71, fixed: 1182.88, percent: 0.1792 },
    { lower: 15487.72, upper: 31236.49, fixed: 1640.18, percent: 0.2136 },
    { lower: 31236.50, upper: 49233.00, fixed: 5004.12, percent: 0.2352 },
    { lower: 49233.01, upper: 93993.90, fixed: 9236.89, percent: 0.30 },
    { lower: 93993.91, upper: 125325.20, fixed: 22665.17, percent: 0.32 },
    { lower: 125325.21, upper: 375975.61, fixed: 32691.18, percent: 0.34 },
    { lower: 375975.62, upper: 9999999, fixed: 117912.32, percent: 0.35 }
  ];
  const bracket = limits.find(l => amount >= l.lower && amount <= l.upper) || limits[0];
  return bracket.fixed + ((amount - bracket.lower) * bracket.percent);
};

export const calculateSDI = (baseSalary: number, salaryPeriod: 'daily' | 'weekly' | 'biweekly' | 'monthly', aguinaldoDays: number, vacationDays: number, vacationPremium: number): number => {
  if (baseSalary <= 0) return 0;
  
  let daily = 0;
  if (salaryPeriod === 'daily') daily = baseSalary;
  else if (salaryPeriod === 'weekly') daily = baseSalary / 7;
  else if (salaryPeriod === 'biweekly') daily = baseSalary / 15;
  else if (salaryPeriod === 'monthly') daily = baseSalary / 30;

  const factor = 1 + (aguinaldoDays / 365.25) + (vacationDays * (vacationPremium / 100) / 365.25);
  const sdi = daily * factor;
  return Math.round(sdi * 100) / 100;
};

export const calculateLaborSettlement = (input: LaborSettlementInput): LaborSettlementResult => {
  const {
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
  } = input;

  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  const totalYears = yearsOfService + (daysOfService / 365.25);
  const hourlyRate = dailySalary / hoursPerDay;
  
  const proportionOfYear = daysOfService / 365.25;
  const aguinaldo = (dailySalary * aguinaldoDays) * proportionOfYear;
  const vacations = (dailySalary * vacationDays) * proportionOfYear;
  const vPremium = vacations * (vacationPremium / 100);
  const overtimeDouble = doubleOvertimeHours * (hourlyRate * 2);
  const overtimeTriple = tripleOvertimeHours * (hourlyRate * 3);
  const totalOvertime = overtimeDouble + overtimeTriple;

  const finiquito = aguinaldo + vacations + vPremium + totalOvertime;

  let indemnity90 = 0;
  let indemnity20 = 0;
  let seniorityPremium = 0;

  const cappedSalary = Math.min(dailySalary, minWage * 2);
  const shouldPaySeniority = dismissalType !== 'renuncia' || yearsOfService >= 15;

  if (shouldPaySeniority) {
    seniorityPremium = (cappedSalary * 12) * totalYears;
  }

  if (dismissalType === 'injustificado' || dismissalType === 'rescision_trabajador') {
    indemnity90 = dailySalary * 90;
    indemnity20 = (dailySalary * 20) * totalYears;
  }

  const liquidacion = indemnity90 + indemnity20 + seniorityPremium;
  
  // Cálculo de ISR (Estimación basada en Art. 95/96 LISR)
  const aguinaldoExento = Math.min(aguinaldo, 30 * umaValue);
  const primaVacacionalExenta = Math.min(vPremium, 15 * umaValue);
  const baseGravableFiniquito = Math.max(0, (aguinaldo - aguinaldoExento) + vacations + (vPremium - primaVacacionalExenta) + totalOvertime);
  const isrFiniquito = calculateMonthlyISR(baseGravableFiniquito);

  const exentoLiquidacion = 90 * umaValue * Math.floor(totalYears);
  const baseGravableLiquidacion = Math.max(0, liquidacion - exentoLiquidacion);

  const sueldoMensual = dailySalary * 30.4;
  const isrSueldoMensual = calculateMonthlyISR(sueldoMensual);
  const tasaEfectiva = sueldoMensual > 0 ? (isrSueldoMensual / sueldoMensual) : 0;
  
  const isrLiquidacion = baseGravableLiquidacion * tasaEfectiva;
  const totalISR = isrFiniquito + isrLiquidacion;

  return {
    aguinaldo: round(aguinaldo),
    vacations: round(vacations),
    vacationPremium: round(vPremium),
    indemnity90: round(indemnity90),
    indemnity20: round(indemnity20),
    seniorityPremium: round(seniorityPremium),
    overtime: round(totalOvertime),
    finiquito: round(finiquito),
    liquidacion: round(liquidacion),
    isr: round(totalISR),
    total: round(finiquito + liquidacion - totalISR),
    formulas: {
      aguinaldo: `Salario Diario: $${dailySalary.toFixed(2)}\nDías: ${aguinaldoDays}\n$${dailySalary.toFixed(2)} × ${aguinaldoDays} × ${(proportionOfYear).toFixed(2)} = $${round(aguinaldo).toFixed(2)}`,
      vacations: `Salario Diario: $${dailySalary.toFixed(2)}\nDías: ${vacationDays}\n$${dailySalary.toFixed(2)} × ${vacationDays} × ${(proportionOfYear).toFixed(2)} = $${round(vacations).toFixed(2)}`,
      vacationPremium: `Monto: $${round(vacations).toFixed(2)} × ${(vacationPremium / 100).toFixed(2)} = $${round(vPremium).toFixed(2)}`,
      indemnity90: `Salario Diario: $${dailySalary.toFixed(2)} × 90 = $${round(indemnity90).toFixed(2)}`,
      indemnity20: `Salario Diario: $${dailySalary.toFixed(2)} × 20 × ${totalYears.toFixed(2)} años = $${round(indemnity20).toFixed(2)}`,
      seniorityPremium: `Topado (Max 2 SMG): $${cappedSalary.toFixed(2)} × 12 × ${totalYears.toFixed(2)} años = $${round(seniorityPremium).toFixed(2)}`,
      overtime: `Salario por hora: $${hourlyRate.toFixed(2)} ($${(hourlyRate * 2).toFixed(2)}/hr x ${doubleOvertimeHours}) = $${round(totalOvertime).toFixed(2)}`,
      isr: `Base Gravable Finiquito: $${baseGravableFiniquito.toFixed(2)}\nISR Finiquito: $${isrFiniquito.toFixed(2)}\nBase Liq: $${baseGravableLiquidacion.toFixed(2)} (Tasa: ${(tasaEfectiva * 100).toFixed(2)}%)\nISR Liquidación: $${isrLiquidacion.toFixed(2)}\nRetención Total: $${totalISR.toFixed(2)}`,
    }
  };
};
