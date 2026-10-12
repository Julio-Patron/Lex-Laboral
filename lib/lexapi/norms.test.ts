import { describe, expect, it } from 'vitest';
import { isLaborSlug, LABOR_SLUGS, toUiNorm, uiNormToSlug } from './norms';

describe('uiNormToSlug', () => {
  it('maps LFT to lft', () => {
    expect(uiNormToSlug('LFT')).toBe('lft');
  });

  it('maps IMSS and LSS to lss', () => {
    expect(uiNormToSlug('IMSS')).toBe('lss');
    expect(uiNormToSlug('LSS')).toBe('lss');
  });

  it('maps INFONAVIT to ley_infonavit', () => {
    expect(uiNormToSlug('INFONAVIT')).toBe('ley_infonavit');
  });

  it('omits the norma query param for all', () => {
    expect(uiNormToSlug('all')).toBeUndefined();
    expect(uiNormToSlug(undefined)).toBeUndefined();
  });
});

describe('toUiNorm', () => {
  it('maps labor slugs back to UI codes', () => {
    expect(toUiNorm('lft')).toBe('LFT');
    expect(toUiNorm('lss')).toBe('LSS');
    expect(toUiNorm('ley_infonavit')).toBe('INFONAVIT');
    expect(toUiNorm('reg_lss_macerf')).toBe('R_LSS');
    expect(toUiNorm('reg_infonavit_tai')).toBe('R_INFONAVIT');
  });
});

describe('labor allowlist', () => {
  it('keeps the five labor slugs', () => {
    expect(LABOR_SLUGS).toEqual([
      'lft',
      'lss',
      'ley_infonavit',
      'reg_lss_macerf',
      'reg_infonavit_tai',
    ]);
  });

  it('accepts labor slugs and rejects others', () => {
    expect(isLaborSlug('lft')).toBe(true);
    expect(isLaborSlug('cpf')).toBe(false);
  });
});
