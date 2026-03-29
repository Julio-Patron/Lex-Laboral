import { buffer } from 'micro';
import { supabaseAdmin } from '../../lib/supabase-admin';
import { getStripe } from '../../lib/stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      console.error('Webhook error: Missing userId or plan', { userId, plan });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      if (plan === 'analisis') {
        const { data: existingData } = await supabaseAdmin
          .from('user_credits')
          .select('audits_balance')
          .eq('user_id', userId)
          .single();
        
        if (existingData) {
          await supabaseAdmin
            .from('user_credits')
            .update({ audits_balance: (existingData.audits_balance || 0) + 1 })
            .eq('user_id', userId);
        } else {
          await supabaseAdmin
            .from('user_credits')
            .insert({ user_id: userId, audits_balance: 1 });
        }
      } else if (plan === 'draft_basic') {
        const { data: existingData } = await supabaseAdmin
          .from('user_credits')
          .select('draft_basic_balance')
          .eq('user_id', userId)
          .single();
        
        if (existingData) {
          await supabaseAdmin
            .from('user_credits')
            .update({ draft_basic_balance: (existingData.draft_basic_balance || 0) + 1 })
            .eq('user_id', userId);
        } else {
          await supabaseAdmin
            .from('user_credits')
            .insert({ user_id: userId, draft_basic_balance: 1 });
        }
      } else if (plan === 'mensualidad' || plan === 'trimestralidad') {
        const expiresAt = new Date();
        if (plan === 'mensualidad') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        }

        await supabaseAdmin.from('users').update({ 
          is_premium: true, 
          license_type: plan,
          access_until: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', userId);
        // Reset usage mensual
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await supabaseAdmin.from('user_usage').upsert({
          user_id: userId,
          month: currentMonth,
          draft_basic_month_count: 0,
          draft_custom_month_count: 0
        }, { onConflict: 'user_id,month' });
        await supabaseAdmin.from('user_usage').upsert({
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
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
