import { describe, it, expect } from 'vitest';
import { calculatePension73, calculatePension97, type PensionInput } from './pension';

describe('Pension Calculator', () => {
  describe('calculatePension73', () => {
    it('should calculate pension for Law 73 correctly', () => {
      const input: PensionInput = {
        age: 65,
        weeks: 750,
        averageSalary: 5000,
        aforeBalance: 100000,
        hasSpouse: true,
        childrenCount: 2,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension73(input);
      expect(result).not.toBeNull();
      expect(result?.monthlyPension).toBeGreaterThan(0);
      expect(result?.agePercentage).toBe(100); // Age 65 should give 100%
    });

    it('should return null for age below 60', () => {
      const input: PensionInput = {
        age: 55,
        weeks: 750,
        averageSalary: 5000,
        aforeBalance: 100000,
        hasSpouse: false,
        childrenCount: 0,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension73(input);
      expect(result).toBeNull();
    });

    it('should return null for weeks less than 500', () => {
      const input: PensionInput = {
        age: 65,
        weeks: 400,
        averageSalary: 5000,
        aforeBalance: 100000,
        hasSpouse: false,
        childrenCount: 0,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension73(input);
      expect(result).toBeNull();
    });
  });

  describe('calculatePension97', () => {
    it('should calculate pension for Law 97 correctly', () => {
      const input: PensionInput = {
        age: 65,
        weeks: 900,
        averageSalary: 5000,
        aforeBalance: 500000,
        hasSpouse: true,
        childrenCount: 1,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension97(input);
      expect(result).not.toBeNull();
      expect(result?.monthlyPension).toBeGreaterThan(0);
      expect(result?.regimeUsed).toBe('1997');
    });

    it('should return null for age below 60', () => {
      const input: PensionInput = {
        age: 55,
        weeks: 900,
        averageSalary: 5000,
        aforeBalance: 500000,
        hasSpouse: false,
        childrenCount: 0,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension97(input);
      expect(result).toBeNull();
    });

    it('should return null for zero AFORE balance', () => {
      const input: PensionInput = {
        age: 65,
        weeks: 900,
        averageSalary: 5000,
        aforeBalance: 0,
        hasSpouse: false,
        childrenCount: 0,
        minWage: 248.93,
        umaValue: 313.78
      };

      const result = calculatePension97(input);
      expect(result).toBeNull();
    });
  });
});
