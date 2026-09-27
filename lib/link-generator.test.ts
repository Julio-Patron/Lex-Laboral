import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';

describe('Link Generator (lz-string algorithm)', () => {
  it('should perfectly compress and decompress a complex scenario state', () => {
    const mockScenario = {
      salary: 15000,
      salaryPeriod: 'monthly',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      dismissalType: 'unjustified',
      hasVacation: true,
      pendingVacationDays: 5,
      hasAguinaldo: true,
      vacationPremium: 25,
      aguinaldoDays: 15
    };

    const payload = JSON.stringify(mockScenario);
    
    // Compress
    const encoded = LZString.compressToEncodedURIComponent(payload);
    
    // Decompress
    const decoded = LZString.decompressFromEncodedURIComponent(encoded);
    
    expect(decoded).toBeDefined();
    if (decoded) {
      const parsedScenario = JSON.parse(decoded);
      expect(parsedScenario).toEqual(mockScenario);
    }
  });

  it('should return null for corrupted or invalid encoded strings', () => {
    const invalidEncoded = 'this-is-not-valid-lz-string-data!';
    const decoded = LZString.decompressFromEncodedURIComponent(invalidEncoded);
    expect(decoded).toBeNull();
  });
});
