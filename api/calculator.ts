import { authenticateUser } from './_utils/auth';
import { supabaseAdmin } from '../lib/supabase-admin';
import { getTodayString } from './_utils/usage';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) throw new Error('Usuario no encontrado');

    const isPremiumValid = userData.is_premium && (!userData.access_until || new Date(userData.access_until) >= new Date());
    
    if (!isPremiumValid) {
      const today = getTodayString();
      const { data: usageData } = await supabaseAdmin
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const dailyCalcs = (usageData as any)?.calculators_count || 0;
      if (dailyCalcs >= 2) return res.status(403).json({ error: "Límite diario de calculadora gratuito alcanzado (2)." });
      
      await supabaseAdmin
        .from('user_usage')
        .upsert({ 
          user_id: user.id, 
          date: today, 
          calculators_count: dailyCalcs + 1 
        }, { onConflict: 'user_id,date' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Calculator API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
