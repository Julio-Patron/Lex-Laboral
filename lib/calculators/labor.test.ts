import { describe, expect, it } from 'vitest';
import { calculateLaborSettlement, calculateSDI, type LaborSettlementInput } from './labor';

describe('Labor Calculator', () => {
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
  });
});
