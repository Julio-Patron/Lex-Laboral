import { getStripe } from '../lib/stripe';
import { applyRateLimit } from './_utils/rateLimit';
import { handlePreflight, validateOrigin, setSecurityHeaders } from './_utils/security';

const PLAN_PRICES: Record<string, string> = {
  'draft_basic': process.env.STRIPE_PRICE_DOCUMENTO || 'price_1TEn5q36rYdwQu28uuqFOdEP',
  'mensualidad': process.env.STRIPE_PRICE_MENSUALIDAD || 'price_1TEn3v36rYdwQu28YW1qKo0a',
  'trimestralidad': process.env.STRIPE_PRICE_TRIMESTRAL || 'price_trimestral_dummy_dev'
};

export default async function handler(req: any, res: any) {
  // Security: CORS preflight
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Security: Rate limit — max 10 requests per minute per IP
  if (applyRateLimit(req, res, 10, 60_000)) return;

  // Security: Origin validation
  if (validateOrigin(req, res)) return;

  try {
    const { plan, userEmail, userId } = req.body;
    const priceId = PLAN_PRICES[plan];

    console.log(`[Stripe] Creating session for plan: ${plan}, priceId: ${priceId}, userId: ${userId}`);

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated to purchase.' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe] STRIPE_SECRET_KEY is missing in env vars.');
      return res.status(500).json({ error: 'Error de configuración en el servidor (Secret Key missing).' });
    }

    if (!priceId) {
      console.error(`[Stripe] No Price ID found for plan: ${plan}. Check PLAN_PRICES mapping.`);
      return res.status(400).json({ error: `El plan '${plan}' no tiene un ID de precio configurado.` });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: { plan: plan },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: (plan === 'mensualidad' || plan === 'trimestralidad') ? 'subscription' : 'payment',
      success_url: `${process.env.CLIENT_URL || 'https://lexmexl.vercel.app'}/#payment-success`,
      cancel_url: `${process.env.CLIENT_URL || 'https://lexmexl.vercel.app'}/#payment-cancelled`,
    });

    res.json({ id: session.id });
  } catch (error: any) {
    console.error('[Stripe] Session Creation Failure:', error);
    const errorMessage = error?.message || 'Error interno al contactar con Stripe.';
    res.status(500).json({ error: errorMessage });
  }
}
