
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const stripePromise = loadStripe(stripePublishableKey);

// Map your plan names to Stripe Price IDs here
const PRICE_IDS = {
  '3-months': import.meta.env.VITE_STRIPE_PRICE_3_MONTHS || 'price_placeholder_3mo',
  '6-months': import.meta.env.VITE_STRIPE_PRICE_6_MONTHS || 'price_placeholder_6mo',
};

export const createCheckoutSession = async (userEmail: string, userId: string, plan: '3-months' | '6-months') => {
  // Use relative path for Vercel proxy
  const API_URL = import.meta.env.VITE_API_URL || '';
  
  const response = await fetch(`${API_URL}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      userEmail, 
      userId, 
      priceId: PRICE_IDS[plan] 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const session = await response.json();
  return session;
};

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await stripePromise;
  if (stripe) {
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  }
};
