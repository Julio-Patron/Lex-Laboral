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

  if (isPremiumValid) {
    // Premium usage tracking in user_usage
    const today = getTodayString();
    const { data: usageData } = await supabaseAdmin
      .from('user_usage')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today)
      .single();

    const currentUsage = (usageData as any)?.[`${type}_count`] || 0;
    if (currentUsage >= 100) {
      throw new Error('Límite de uso Premium alcanzado para esta función.');
    }

    // Upsert usage
    await supabaseAdmin
      .from('user_usage')
      .upsert({ 
        user_id: uid, 
        date: today, 
        [`${type}_count`]: currentUsage + 1 
      }, { onConflict: 'user_id,date' });
  } else {
    // Non-premium credits check
    const credits = userData.user_credits?.[`${type}_balance`] || 0;
    if (credits <= 0) {
      throw new Error('No cuenta con créditos suficientes para esta acción.');
    }

    // Deduct credit
    await supabaseAdmin
      .from('user_credits')
      .update({ [`${type}_balance`]: credits - 1 })
      .eq('user_id', uid);
  }
}

export async function checkChatUsage(uid: string) {
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (userError || !userData) throw new Error('Usuario no encontrado');

  const isPremiumValid = userData.is_premium && (!userData.access_until || new Date(userData.access_until) >= new Date());
  const today = getTodayString();

  if (!isPremiumValid) {
    // Free usage check
    const { data: usageData } = await supabaseAdmin
      .from('user_usage')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today)
      .single();

    const dailyChats = (usageData as any)?.chats_count || 0;
    if (dailyChats >= 5) {
      throw new Error('Límite diario de consultas jurídicas gratuito alcanzado (5).');
    }

    await supabaseAdmin
      .from('user_usage')
      .upsert({ 
        user_id: uid, 
        date: today, 
        chats_count: dailyChats + 1 
      }, { onConflict: 'user_id,date' });
  } else {
    // Premium usage tracking
    const { data: usageData } = await supabaseAdmin
      .from('user_usage')
      .select('*')
      .eq('user_id', uid)
      .eq('date', today)
      .single();

    const dailyChats = (usageData as any)?.chats_count || 0;
    if (dailyChats >= 100) {
      throw new Error('Límite de consultas jurídicas Premium alcanzado.');
    }

    await supabaseAdmin
      .from('user_usage')
      .upsert({ 
        user_id: uid, 
        date: today, 
        chats_count: dailyChats + 1 
      }, { onConflict: 'user_id,date' });
  }
}
