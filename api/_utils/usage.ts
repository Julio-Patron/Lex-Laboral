import { supabaseAdmin } from '../../lib/supabase-admin';

export const getTodayString = () => new Date().toISOString().split('T')[0];

export async function checkUsage(uid: string, type: 'audits' | 'draft_basic' | 'draft_custom') {
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*, user_credits(*)')
    .eq('id', uid)
    .single();

  if (userError || !userData) throw new Error('Usuario no encontrado');

  const isPremiumValid = userData.is_premium && (!userData.access_until || new Date(userData.access_until) >= new Date());
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // --- CALCULADORA (audits) ---
  if (type === 'audits') {
    if (isPremiumValid) {
      // Suscriptor: uso ilimitado
      return;
    } else {
      // Gratis solo una vez
      const { data: usageData } = await supabaseAdmin
        .from('user_usage')
        .select('*')
        .eq('user_id', uid)
        .eq('audits_free_used', true)
        .single();
      if (usageData) {
        // Ya usó la gratuita, solo puede con créditos
        const credits = userData.user_credits?.['audits_balance'] || 0;
        if (credits <= 0) {
          throw new Error('Ya usaste tu análisis gratuito. Compra un análisis individual o suscríbete.');
        }
        // Descuenta crédito
        await supabaseAdmin
          .from('user_credits')
          .update({ ['audits_balance']: credits - 1 })
          .eq('user_id', uid);
      } else {
        // Marca como usada la gratuita
        await supabaseAdmin
          .from('user_usage')
          .upsert({ user_id: uid, audits_free_used: true }, { onConflict: 'user_id' });
      }
    }
    return;
  }

  // --- ANALISIS Y GENERACION (draft_basic, draft_custom) ---
  // Solo suscriptores o créditos individuales
  if (isPremiumValid) {
    // Limite mensual de 15 por tipo
    const { data: usageData } = await supabaseAdmin
      .from('user_usage')
      .select('*')
      .eq('user_id', uid)
      .eq('month', currentMonth)
      .single();
    const field = type === 'draft_basic' ? 'draft_basic_month_count' : 'draft_custom_month_count';
    const currentUsage = (usageData as any)?.[field] || 0;
    if (currentUsage >= 15) {
      // Puede usar créditos individuales si tiene
      const credits = userData.user_credits?.[`${type}_balance`] || 0;
      if (credits <= 0) {
        throw new Error('Límite mensual alcanzado. Compra créditos individuales o espera la recarga el próximo mes.');
      }
      // Descuenta crédito
      await supabaseAdmin
        .from('user_credits')
        .update({ [`${type}_balance`]: credits - 1 })
        .eq('user_id', uid);
    } else {
      // Suma uso mensual
      await supabaseAdmin
        .from('user_usage')
        .upsert({ user_id: uid, month: currentMonth, [field]: currentUsage + 1 }, { onConflict: 'user_id,month' });
    }
  } else {
    // Solo créditos individuales
    const credits = userData.user_credits?.[`${type}_balance`] || 0;
    if (credits <= 0) {
      throw new Error('Solo disponible con créditos individuales o suscripción.');
    }
    // Descuenta crédito
    await supabaseAdmin
      .from('user_credits')
      .update({ [`${type}_balance`]: credits - 1 })
      .eq('user_id', uid);
  }
}

export async function checkChatUsage(uid: string) {
  const today = getTodayString();
  
  const { data: usageData } = await supabaseAdmin
    .from('user_usage')
    .select('*')
    .eq('user_id', uid)
    .eq('date', today)
    .single();

  const dailyChats = (usageData as any)?.chats_count || 0;
  
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('is_premium, access_until')
    .eq('id', uid)
    .single();

  const isPremiumValid = userData?.is_premium && (!userData.access_until || new Date(userData.access_until) >= new Date());
  const limit = isPremiumValid ? 100 : 5;

  if (dailyChats >= limit) {
    throw new Error(`Límite de consultas jurídicas ${isPremiumValid ? 'Premium' : 'gratuito'} alcanzado (${limit}).`);
  }

  await supabaseAdmin
    .from('user_usage')
    .upsert({ 
      user_id: uid, 
      date: today, 
      chats_count: dailyChats + 1 
    }, { onConflict: 'user_id,date' });
}
