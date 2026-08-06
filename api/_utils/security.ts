/**
 * Security utilities for API endpoints
 */

export function handlePreflight(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function setCorsHeaders(req: any, res: any): void {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function setSecurityHeaders(res: any): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove potentially dangerous characters but keep accented characters
  sanitized = sanitized.replace(/[<>\"']/g, '');
  
  return sanitized;
}

export function validateOrigin(req: any, res: any): boolean {
  // Accept requests from same origin or specified allowed origins
  const origin = req.headers.origin;
  if (!origin) return false;
  
  const allowedOrigins = [
    'https://lexlaboral.com.mx',
    'https://www.lexlaboral.com.mx',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  
  return !allowedOrigins.includes(origin);
}
