import { applyRateLimit } from './_utils/rateLimit.js';
import { handlePreflight, setSecurityHeaders } from './_utils/security.js';

export default async function handler(req: any, res: any) {
  // Security: CORS preflight
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Security: Rate limit — max 20 requests per minute per IP
  if (applyRateLimit(req, res, 20, 60_000)) return;

  // For Pay-to-Go, we could add per-calculation payment check here if needed.
  res.json({ success: true });
}
