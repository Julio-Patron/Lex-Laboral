import { getStripe } from '../lib/stripe';

const PLAN_PRICES: Record<string, string> = {
  'draft_basic': process.env.STRIPE_PRICE_DRAFT || 'price_1TEn5q36rYdwQu28uuqFOdEP',
  'mensualidad': process.env.STRIPE_PRICE_MENSUALIDAD || 'price_1TEn3v36rYdwQu28YW1qKo0a',
  'trimestralidad': process.env.STRIPE_PRICE_TRIMESTRAL || 'price_trimestral_dummy_dev'
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan, userEmail, userId } = req.body;
    const priceId = PLAN_PRICES[plan];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated to purchase.' });
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
    console.error('Stripe Session Error:', error);
    const errorMessage = error?.message || 'Internal Server Error';
    res.status(500).json({ error: errorMessage });
  }
}
