/**
 * Security utilities for API endpoints
 */

export const ALLOWED_ORIGINS = [
  'https://lexlaboral.com.mx',
  'https://www.lexlaboral.com.mx',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function handlePreflight(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function setCorsHeaders(req: any, res: any): void {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

export function setSecurityHeaders(res: any): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

export function sanitizeInput(input: string | undefined, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().substring(0, maxLength).replace(/[<>"']/g, '');
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  return Boolean(origin && ALLOWED_ORIGINS.includes(origin));
}

export function clientIp(req: { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
