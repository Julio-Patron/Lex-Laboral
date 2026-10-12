export const LABOR_SLUGS = [
  'lft',
  'lss',
  'ley_infonavit',
  'reg_lss_macerf',
  'reg_infonavit_tai',
] as const;

export type LaborSlug = (typeof LABOR_SLUGS)[number];

const UI_TO_SLUG: Record<string, LaborSlug> = {
  LFT: 'lft',
  IMSS: 'lss',
  LSS: 'lss',
  INFONAVIT: 'ley_infonavit',
};

const SLUG_TO_UI: Record<string, string> = {
  lft: 'LFT',
  lss: 'LSS',
  ley_infonavit: 'INFONAVIT',
  reg_lss_macerf: 'R_LSS',
  reg_infonavit_tai: 'R_INFONAVIT',
};

export function uiNormToSlug(norm?: string): string | undefined {
  if (!norm || norm === 'all') return undefined;
  return UI_TO_SLUG[norm];
}

export function toUiNorm(slug: string): string {
  return SLUG_TO_UI[slug] ?? slug.toUpperCase();
}

export function isLaborSlug(slug: string): boolean {
  return (LABOR_SLUGS as readonly string[]).includes(slug);
}
