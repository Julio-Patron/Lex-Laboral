export interface SocialSecurityInput {
  sbc: number;
  riskClass: number;
  days: number;
  umaValue: number;
  minWage: number;
}

export interface SocialSecurityResult {
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
}

export interface RiskCalculationInput {
  s_days: number;
  v_factor: number;
  i_disability: number;
  d_deaths: number;
  f_factor: number;
  n_workers: number;
  m_min: number;
}

export const calculateAnnualRisk = (input: RiskCalculationInput): number => {
  const { s_days, v_factor, i_disability, d_deaths, f_factor, n_workers, m_min } = input;
  const calculatedRisk = (((s_days / 365) + v_factor * (i_disability + d_deaths)) * (f_factor / n_workers)) + m_min;
  return Number((calculatedRisk * 100).toFixed(5));
};

export const calculateSocialSecurity = (input: SocialSecurityInput): SocialSecurityResult => {
  const { sbc, riskClass, days, umaValue, minWage } = input;

  const fixed = (umaValue * 0.204) * days;
  const excedenteBase = Math.max(0, sbc - (3 * umaValue));
  const empExcedente = (excedenteBase * 0.011) * days;
  const empDinero = (sbc * 0.007) * days;
  const empPensionados = (sbc * 0.0105) * days;
  const empInvalidez = (sbc * 0.0175) * days;
  const empGuarderia = (sbc * 0.01) * days;
  const empRiesgo = (sbc * (riskClass / 100)) * days;
  const empRetiro = (sbc * 0.02) * days;
  
  const ratio = sbc / umaValue;
  let cesantiaRate = 0.0315; 
  
  if (sbc > minWage) {
    if (ratio <= 1.50) cesantiaRate = 0.03676;
    else if (ratio <= 2.00) cesantiaRate = 0.04851;
    else if (ratio <= 2.50) cesantiaRate = 0.05556;
    else if (ratio <= 3.00) cesantiaRate = 0.06026;
    else if (ratio <= 3.50) cesantiaRate = 0.06361;
    else if (ratio <= 4.00) cesantiaRate = 0.06613;
    else cesantiaRate = 0.07513; 
  }
  
  const empCesantia = (sbc * cesantiaRate) * days;
  const empInfonavit = (sbc * 0.05) * days;

  const empTotal = fixed + empExcedente + empDinero + empPensionados + empInvalidez + empGuarderia + empRiesgo + empRetiro + empCesantia + empInfonavit;

  const workerExcedente = (excedenteBase * 0.004) * days;
  const workerDinero = (sbc * 0.0025) * days;
  const workerPensionados = (sbc * 0.00375) * days;
  const workerInvalidez = (sbc * 0.00625) * days;
  const workerCesantia = (sbc * 0.01125) * days;

  const workerTotal = workerExcedente + workerDinero + workerPensionados + workerInvalidez + workerCesantia;

  return {
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
  };
};
