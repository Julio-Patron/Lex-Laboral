import { getStripeConfigDiagnostics, getStripePriceId, getStripeSecretKey } from '../lib/stripe-config';
import { getStripe } from '../lib/stripe';
import { applyRateLimit } from './_utils/rateLimit';
import { handlePreflight, validateOrigin, setSecurityHeaders } from './_utils/security';

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { plan, userEmail, userId } = body;
    const validPlans = new Set(['draft_basic', 'mensualidad', 'trimestralidad']);

    if (!validPlans.has(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const priceResolution = getStripePriceId(plan);
    const priceId = priceResolution.value;
    const secretKeyResolution = getStripeSecretKey();
    const clientUrl = process.env.CLIENT_URL?.trim() || process.env.VITE_CLIENT_URL?.trim() || 'https://lexmexl.vercel.app';

    console.log(
      `[Stripe] Creating session for plan: ${plan}, priceSource: ${priceResolution.source || 'missing'}, userId: ${userId}`
    );

    if (!priceId) {
      const diagnostics = getStripeConfigDiagnostics();
      console.error('[Stripe] Missing price ID for selected plan.', { plan, diagnostics });
      return res.status(500).json({
        error: `Falta configurar el price ID para el plan '${plan}' en Vercel.`,
        code: 'stripe_price_missing',
        plan
      });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated to purchase.' });
    }

    if (!secretKeyResolution.value) {
      const diagnostics = getStripeConfigDiagnostics();
      console.error('[Stripe] Secret key missing in environment.', diagnostics);
      return res.status(500).json({
        error: 'Falta STRIPE_SECRET_KEY en las variables del proyecto de Vercel.',
        code: 'stripe_secret_missing'
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      client_reference_id: userId,
      metadata: { plan: plan },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: (plan === 'mensualidad' || plan === 'trimestralidad') ? 'subscription' : 'payment',
      success_url: `${clientUrl}/#payment-success`,
      cancel_url: `${clientUrl}/#payment-cancelled`,
    });

    res.json({ id: session.id });
  } catch (error: any) {
    console.error('[Stripe] Session Creation Failure:', error);
    const errorMessage = error?.message || 'Error interno al contactar con Stripe.';
    res.status(500).json({ error: errorMessage });
  }
}
