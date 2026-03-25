import { supabaseAdmin } from '../../lib/supabase-admin';

export const getTodayString = () => new Date().toISOString().split('T')[0];

export async function checkUsage(uid: string, type: 'audits' | 'draft_basic' | 'draft_custom') {
  try {
    if (type === 'audits') {
      const { data, error } = await supabaseAdmin.rpc('use_audit_credit', { p_user_id: uid });
      if (error) throw error;
      if (!data) {
        throw new Error('Ya usaste tu análisis gratuito. Compra un análisis individual o suscríbete.');
      }
      return;
    }

    const { data, error } = await supabaseAdmin.rpc('use_draft_credit', {
      p_user_id: uid,
      p_draft_type: type
    });
    if (error) throw error;
    if (!data) {
      throw new Error('Límite mensual alcanzado. Compra créditos individuales o espera la recarga el próximo mes.');
    }
  } catch (error: any) {
    if (error.code === '42883') {
      throw new Error('Función de crédito no configurada. Contacta a soporte.');
    }
    throw error;
  }
}

export async function checkChatUsage(uid: string) {
  try {
    const { data, error } = await supabaseAdmin.rpc('use_chat_credit', { p_user_id: uid });
    if (error) throw error;
    if (!data) {
      throw new Error('Límite de consultas jurídicas gratuito alcanzado (5).');
    }
  } catch (error: any) {
    if (error.code === '42883') {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('is_premium, access_until')
        .eq('id', uid)
        .single();

      const isPremiumValid = userData?.is_premium && (!userData?.access_until || new Date(userData.access_until) >= new Date());
      const limit = isPremiumValid ? 100 : 5;
      throw new Error(`Límite de consultas jurídicas ${isPremiumValid ? 'Premium' : 'gratuito'} alcanzado (${limit}).`);
    }
    throw error;
  }
}
