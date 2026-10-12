import { describe, expect, it } from 'vitest';
import { calculateLaborSettlement, calculateSDI, statutoryVacationDays, type LaborSettlementInput } from './labor';

describe('Labor Calculator', () => {
  describe('statutoryVacationDays', () => {
    it('follows LFT art. 76 after the 2023 reform', () => {
      expect(statutoryVacationDays(1)).toBe(12);
      expect(statutoryVacationDays(3)).toBe(16);
      expect(statutoryVacationDays(5)).toBe(20);
      expect(statutoryVacationDays(10)).toBe(22);
    });
  });

  describe('calculateSDI', () => {
    it('should calculate SDI correctly for monthly salary', () => {
      // 30000 monthly = 1000 daily; SDI applies benefits factor
      const sdi = calculateSDI(30000, 'monthly', 15, 12, 25);
      expect(sdi).toBeGreaterThan(1000); // SDI should be higher than base daily salary
      expect(sdi).toBeLessThan(1100); // But not unreasonably high
    });

    it('should calculate SDI correctly for daily salary', () => {
      const dailySalary = 1000;
      const sdi = calculateSDI(dailySalary, 'daily', 15, 12, 25);
      expect(sdi).toBeGreaterThan(dailySalary);
    });

    it('should return 0 for zero or negative salary', () => {
      const sdi = calculateSDI(0, 'monthly', 15, 12, 25);
      expect(sdi).toBe(0);
    });
  });

  describe('calculateLaborSettlement', () => {
    it('should calculate settlement correctly', () => {
      const input: LaborSettlementInput = {
        dailySalary: 500,
        yearsOfService: 5,
        daysOfService: 100,
        vacationDays: 12,
        vacationPremium: 25,
        aguinaldoDays: 15,
        doubleOvertimeHours: 10,
        tripleOvertimeHours: 0,
        hoursPerDay: 8,
        dismissalType: 'injustificado',
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculateLaborSettlement(input);
      
      expect(result.total).toBeGreaterThan(0);
      expect(result.finiquito).toBeGreaterThan(0);
      expect(result.liquidacion).toBeGreaterThan(0);
      expect(result.aguinaldo).toBeGreaterThan(0);
      expect(result.vacations).toBeGreaterThan(0);
    });

    it('should calculate without indemnity for renuncia without 15+ years', () => {
      const input: LaborSettlementInput = {
        dailySalary: 500,
        yearsOfService: 5,
        daysOfService: 100,
        vacationDays: 12,
        vacationPremium: 25,
        aguinaldoDays: 15,
        doubleOvertimeHours: 0,
        tripleOvertimeHours: 0,
        hoursPerDay: 8,
        dismissalType: 'renuncia',
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculateLaborSettlement(input);
      expect(result.indemnity90).toBe(0);
      expect(result.indemnity20).toBe(0);
    });

    it('pays a full last year of aguinaldo and vacations when leftover days are 0', () => {
      const result = calculateLaborSettlement({
        dailySalary: 500,
        yearsOfService: 5,
        daysOfService: 0,
        vacationDays: 12,
        vacationPremium: 25,
        aguinaldoDays: 15,
        doubleOvertimeHours: 0,
        tripleOvertimeHours: 0,
        hoursPerDay: 8,
        dismissalType: 'injustificado',
        minWage: 312.41,
        umaValue: 119.35,
      });

      expect(result.aguinaldo).toBe(7500);
      expect(result.vacations).toBe(6000);
      expect(result.vacationPremium).toBe(1500);
    });

    it('keeps finiquito, liquidacion and total equal to the visible line items', () => {
      const result = calculateLaborSettlement({
        dailySalary: 500,
        yearsOfService: 3,
        daysOfService: 180,
        vacationDays: 12,
        vacationPremium: 25,
        aguinaldoDays: 15,
        doubleOvertimeHours: 8,
        tripleOvertimeHours: 2,
        hoursPerDay: 8,
        dismissalType: 'injustificado',
        minWage: 312.41,
        umaValue: 119.35,
      });

      expect(result.finiquito).toBeCloseTo(
        result.aguinaldo + result.vacations + result.vacationPremium + result.overtime,
        2
      );
      expect(result.liquidacion).toBeCloseTo(
        result.indemnity90 + result.indemnity20 + result.seniorityPremium,
        2
      );
      expect(result.total).toBeCloseTo(result.finiquito + result.liquidacion - result.isr, 2);
      expect(result.overtime).toBeGreaterThan(0);
      expect(result.vacationPremium).toBeGreaterThan(0);
    });

    it('pays constitutional indemnity for worker-led rescission and not for employer-led rescission', () => {
      const base = {
        dailySalary: 500,
        yearsOfService: 2,
        daysOfService: 0,
        vacationDays: 14,
        vacationPremium: 25,
        aguinaldoDays: 15,
        doubleOvertimeHours: 0,
        tripleOvertimeHours: 0,
        hoursPerDay: 8,
        minWage: 312.41,
        umaValue: 119.35,
      } as const;

      const worker = calculateLaborSettlement({ ...base, dismissalType: 'rescision_trabajador' });
      const employer = calculateLaborSettlement({ ...base, dismissalType: 'rescision_patron' });

      expect(worker.indemnity90).toBe(45000);
      expect(worker.indemnity20).toBe(20000);
      expect(employer.indemnity90).toBe(0);
      expect(employer.indemnity20).toBe(0);
      expect(employer.seniorityPremium).toBeGreaterThan(0);
    });
  });
});
