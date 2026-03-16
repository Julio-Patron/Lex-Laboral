
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not defined. Stripe features will be disabled.');
}
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);

// Map your plan names to Stripe Price IDs here
const PRICE_IDS = {
  'audit': import.meta.env.VITE_STRIPE_PRICE_AUDIT || 'price_placeholder_audit',
  'draft_basic': import.meta.env.VITE_STRIPE_PRICE_DRAFT_BASIC || 'price_placeholder_draft_basic',
  'draft_custom': import.meta.env.VITE_STRIPE_PRICE_DRAFT_CUSTOM || 'price_placeholder_draft_custom',
  '3-months': import.meta.env.VITE_STRIPE_PRICE_3_MONTHS || 'price_placeholder_3mo',
};

export const createCheckoutSession = async (userEmail: string, userId: string, plan: 'audit' | 'draft_basic' | 'draft_custom' | '3-months') => {
  // Use configured API URL for Firebase Functions or local dev server
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/studio-6462708856-c0f94/us-central1/api';
  
  const response = await fetch(`${API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      userEmail, 
      userId, 
      priceId: PRICE_IDS[plan],
      plan: plan
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
