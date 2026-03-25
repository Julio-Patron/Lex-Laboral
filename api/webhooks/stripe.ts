import Stripe from 'stripe';
import { buffer } from 'micro';
import { supabaseAdmin } from '../../lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27-acacia' as any
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;

    try {
      if (plan === 'audit') {
        const { data } = await supabaseAdmin.from('user_credits').select('audits_balance').eq('user_id', userId).single();
        await supabaseAdmin.from('user_credits').update({ audits_balance: (data?.audits_balance || 0) + 1 }).eq('user_id', userId);
      } else if (plan === 'draft_basic') {
        const { data } = await supabaseAdmin.from('user_credits').select('draft_basic_balance').eq('user_id', userId).single();
        await supabaseAdmin.from('user_credits').update({ draft_basic_balance: (data?.draft_basic_balance || 0) + 1 }).eq('user_id', userId);
      } else if (plan === 'draft_custom') {
        const { data } = await supabaseAdmin.from('user_credits').select('draft_custom_balance').eq('user_id', userId).single();
        await supabaseAdmin.from('user_credits').update({ draft_custom_balance: (data?.draft_custom_balance || 0) + 1 }).eq('user_id', userId);
      } else if (plan === '3-months') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await supabaseAdmin.from('users').update({ 
          is_premium: true, 
          license_type: '3-months',
          access_until: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', userId);
        
        // Reset usage on new subscription
        await supabaseAdmin.from('user_usage').upsert({
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          chats_count: 0,
          audits_count: 0,
          calculators_count: 0
        }, { onConflict: 'user_id,date' });
      }
    } catch (error) {
      console.error('Error updating Supabase from webhook:', error);
      return res.status(500).json({ error: 'Database update failed' });
    }
  }

  res.json({ received: true });
}
