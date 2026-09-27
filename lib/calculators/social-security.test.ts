import { describe, expect, it } from 'vitest';
import { calculateAnnualRisk, calculateSocialSecurity, type SocialSecurityInput } from './social-security';

describe('Social Security Calculator', () => {
  describe('calculateSocialSecurity', () => {
    it('should calculate social security contributions correctly', () => {
      const input: SocialSecurityInput = {
        sbc: 3000,
        riskClass: 1.13065,
        days: 30,
        umaValue: 313.78,
        minWage: 248.93
      };

      const result = calculateSocialSecurity(input);
      
      expect(result.employer.total).toBeGreaterThan(0);
      expect(result.employee.total).toBeGreaterThan(0);
      expect(result.total).toBe(result.employer.total + result.employee.total);
    });

    it('should calculate risk contribution correctly', () => {
      const input: SocialSecurityInput = {
        sbc: 3000,
        riskClass: 4.65325,
        days: 30,
        umaValue: 313.78,
        minWage: 248.93
      };

      const result = calculateSocialSecurity(input);
      expect(result.employer.riesgo).toBeGreaterThan(0);
    });
  });

  describe('calculateAnnualRisk', () => {
    it('should calculate annual risk correctly', () => {
      // Using more realistic risk calculation parameters for a low-risk business
      const riskClass = calculateAnnualRisk({
        s_days: 0,      // No accident days
        v_factor: 0.5,  // Lower variation factor
        i_disability: 0,
        d_deaths: 0,
        f_factor: 0.43, // Minimum risk rate (0.43%)
        n_workers: 50,
        m_min: 0.0043   // Minimum risk contribution
      });

      expect(riskClass).toBeGreaterThan(0);
      expect(riskClass).toBeLessThan(1); // Should be less than 1% for low risk
    });
  });
});
