
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const stripePromise = loadStripe(stripePublishableKey);

export const createCheckoutSession = async (userEmail: string, userId: string, priceId: string) => {
const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userEmail, userId, priceId }),
  });

  const session = await response.json();
  return session;
};

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await stripePromise;
  if (stripe) {
    const { error } = await (stripe as any).redirectToCheckout({ sessionId });
    if (error) {
      console.error('Stripe redirect error:', error);
    }
  }
};
