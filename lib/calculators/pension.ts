export interface PensionInput {
  age: number;
  weeks: number;
  averageSalary: number;
  aforeBalance: number;
  hasSpouse: boolean;
  childrenCount: number;
  minWage: number;
  umaValue: number;
}

export interface PensionResult {
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
}

const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const calculatePension73 = (input: PensionInput): PensionResult | null => {
  const { age, weeks, averageSalary, hasSpouse, childrenCount, minWage, umaValue } = input;

  // Age percentage
  let agePercentage = 0;
  if (age === 60) agePercentage = 0.75;
  else if (age === 61) agePercentage = 0.80;
  else if (age === 62) agePercentage = 0.85;
  else if (age === 63) agePercentage = 0.90;
  else if (age === 64) agePercentage = 0.95;
  else if (age >= 65) agePercentage = 1.00;
  else {
    return null;
  }

  if (weeks < 500) {
    return null;
  }

  if (averageSalary <= 0) {
    return null;
  }

  // Salary divided by UMA to find factors
  const salaryUMA = averageSalary / umaValue;

  // Simplified table logic (approximation)
  let basicPercentage = 0;
  let incrementPercentage = 0;

  if (salaryUMA <= 1) {
    basicPercentage = 0.80;
    incrementPercentage = 0.00563;
  } else if (salaryUMA <= 2) {
    basicPercentage = 0.70;
    incrementPercentage = 0.01;
  } else if (salaryUMA <= 3) {
    basicPercentage = 0.60;
    incrementPercentage = 0.015;
  } else if (salaryUMA <= 4) {
    basicPercentage = 0.50;
    incrementPercentage = 0.02;
  } else if (salaryUMA <= 5) {
    basicPercentage = 0.40;
    incrementPercentage = 0.022;
  } else if (salaryUMA <= 6) {
    basicPercentage = 0.35;
    incrementPercentage = 0.023;
  } else {
    basicPercentage = 0.20;
    incrementPercentage = 0.0245;
  }

  // Topado a 25 UMAS
  const cappedSalary = Math.min(averageSalary, umaValue * 25);

  const basicAmountAnnual = cappedSalary * 365 * basicPercentage;
  const basicAmountMonthly = basicAmountAnnual / 12;

  const extraWeeks = Math.max(0, weeks - 500);
  const incrementYears = Math.floor(extraWeeks / 52);

  const annualIncrementsAmountYearly = cappedSalary * 365 * incrementPercentage * incrementYears;
  const annualIncrementsAmountMonthly = annualIncrementsAmountYearly / 12;

  const subtotal = basicAmountMonthly + annualIncrementsAmountMonthly;

  // Asignaciones familiares
  let familyFactor = 0;
  if (hasSpouse) familyFactor += 0.15;
  familyFactor += (childrenCount * 0.10);

  // Asistencia asistencial si no tiene dependientes (15% por ley)
  if (familyFactor === 0) familyFactor = 0.15;

  const familyAllowancesAmount = subtotal * familyFactor;

  const totalBeforeAge = subtotal + familyAllowancesAmount;

  let monthlyPension = totalBeforeAge * agePercentage;

  // Garantía de pensión mínima
  const minPension = minWage * 30;
  if (monthlyPension < minPension) {
    monthlyPension = minPension;
  }

  return {
    monthlyPension: round(monthlyPension),
    basicAmount: round(basicAmountMonthly),
    annualIncrementsAmount: round(annualIncrementsAmountMonthly),
    familyAllowancesAmount: round(familyAllowancesAmount),
    agePercentage: agePercentage * 100,
    regimeUsed: '1973',
    formulas: {
      basic: `Salario Promedio: $${cappedSalary.toFixed(2)}\n% Cuantía Básica: ${(basicPercentage*100).toFixed(2)}%\nTotal: $${round(basicAmountMonthly).toFixed(2)}`,
      increments: `Semanas extra: ${extraWeeks}\nAños de incremento: ${incrementYears}\n% Incremento: ${(incrementPercentage*100).toFixed(2)}%\nTotal: $${round(annualIncrementsAmountMonthly).toFixed(2)}`,
      family: `Factor asignaciones: ${(familyFactor*100).toFixed(0)}%\nTotal: $${round(familyAllowancesAmount).toFixed(2)}`,
      ageFactor: `Edad: ${age} años\nPorcentaje aplicado: ${(agePercentage*100).toFixed(0)}%`,
    }
  };
};

export const calculatePension97 = (input: PensionInput): PensionResult | null => {
  const { age, weeks, aforeBalance, minWage } = input;

  const minWeeksRequired = 875;

  if (age < 60) {
    return null;
  }

  if (weeks < minWeeksRequired) {
    return null;
  }

  if (aforeBalance <= 0) {
    return null;
  }

  // Simplificación extrema: Tasa de retiro programado/anualidad aprox 5% anual sobre saldo
  const estimatedAnnualRate = 0.05;
  const estimatedAnnualPension = aforeBalance * estimatedAnnualRate;
  let monthlyPension = estimatedAnnualPension / 12;

  // Garantizada
  const guaranteedPension = minWage * 30;

  if (monthlyPension < guaranteedPension) {
     monthlyPension = guaranteedPension;
  }

  return {
    monthlyPension: round(monthlyPension),
    basicAmount: round(monthlyPension),
    annualIncrementsAmount: 0,
    familyAllowancesAmount: 0,
    agePercentage: 100,
    regimeUsed: '1997',
    formulas: {
      basic: `Saldo AFORE: $${aforeBalance.toLocaleString()}\nTasa estimada (simplificada): ${(estimatedAnnualRate*100)}%\nPensión Mensual: $${round(monthlyPension).toFixed(2)}`,
      increments: 'No aplica en Régimen 97',
      family: 'No aplica directamente (se descuenta del saldo)',
      ageFactor: `Edad: ${age} años (Cumple requisito)`,
    }
  };
};
