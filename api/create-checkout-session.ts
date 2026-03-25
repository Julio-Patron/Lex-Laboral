import { authenticateUser } from './_utils/auth';
import { getStripe } from '../lib/stripe';

const PLAN_PRICES: Record<string, string> = {
  'analisis': process.env.VITE_STRIPE_PRICE_AUDIT || 'price_1TApWv36rYdwQu28DCjR7H5e',
  'draft_basic': process.env.VITE_STRIPE_PRICE_DRAFT || 'price_1TApYv36rYdwQu28o3LMAZjU',
  'mensualidad': process.env.VITE_STRIPE_PRICE_3_MONTHS || 'price_1TApaN36rYdwQu28h1Mfljni'
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { plan } = req.body;
    const priceId = PLAN_PRICES[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { plan: plan },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: plan === 'mensualidad' ? 'subscription' : 'payment',
      success_url: `${process.env.CLIENT_URL || 'https://lexmexl.vercel.app'}/#payment-success`,
      cancel_url: `${process.env.CLIENT_URL || 'https://lexmexl.vercel.app'}/#payment-cancelled`,
    });
    res.json({ id: session.id });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
