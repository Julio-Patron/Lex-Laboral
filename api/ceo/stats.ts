/**
 * CEO Dashboard API — Estadísticas de negocio
 * 
 * Este endpoint retorna métricas agregadas de tu negocio:
 * - Total de usuarios registrados
 * - Usuarios premium activos
 * - Documentos generados este mes
 * - Usuarios recientes
 * - Resumen de uso
 * 
 * PROTECCIÓN: Solo accesible si el userId corresponde al email del CEO
 * configurado en la variable de entorno VITE_CEO_EMAIL.
 */

import { supabaseAdmin } from '../../lib/supabase-admin';
import { applyRateLimit } from '../_utils/rateLimit';
import { handlePreflight, setSecurityHeaders } from '../_utils/security';

const CEO_EMAIL = process.env.VITE_CEO_EMAIL || process.env.CEO_EMAIL;

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit — max 30 requests per minute
  if (applyRateLimit(req, res, 30, 60_000)) return;

  try {
    // AUTH: Verify the requester is the CEO
    const authHeader = req.headers.authorization;
    const userId = req.headers['x-user-id'];

    if (!userId || !CEO_EMAIL) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    // Look up the user's email to verify it matches CEO_EMAIL
    const { data: userData, error: userErr } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userErr || !userData || userData.email !== CEO_EMAIL) {
      return res.status(403).json({ error: 'Acceso restringido. Solo el administrador puede ver estas métricas.' });
    }

    // === Fetch all metrics in parallel ===
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalUsersResult,
      premiumUsersResult,
      monthlyUsageResult,
      recentUsersResult,
      creditsResult,
    ] = await Promise.all([
      // Total users
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      // Premium users
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      // This month's usage
      supabaseAdmin.from('user_usage').select('*').eq('month', currentMonth),
      // Recent users (last 20)
      supabaseAdmin.from('users').select('id, email, is_premium, license_type, access_until, created_at').order('created_at', { ascending: false }).limit(20),
      // Credits snapshot
      supabaseAdmin.from('user_credits').select('*'),
    ]);

    // Aggregate monthly usage
    const monthlyUsage = monthlyUsageResult.data || [];
    const totalDocumentsThisMonth = monthlyUsage.reduce((sum: number, u: any) => sum + (u.draft_basic_month_count || 0), 0);
    const totalCalculatorsThisMonth = monthlyUsage.reduce((sum: number, u: any) => sum + (u.calculators_count || 0), 0);

    // Credits summary
    const allCredits = creditsResult.data || [];
    const totalCreditsIssued = allCredits.reduce((sum: number, c: any) => sum + (c.draft_basic_balance || 0) + (c.audits_balance || 0), 0);

    // Users with active premium
    const now2 = new Date();
    const recentUsers = (recentUsersResult.data || []).map((u: any) => ({
      ...u,
      isPremiumActive: u.is_premium && u.access_until && new Date(u.access_until) > now2,
    }));

    const stats = {
      overview: {
        totalUsers: totalUsersResult.count || 0,
        premiumUsers: premiumUsersResult.count || 0,
        documentsThisMonth: totalDocumentsThisMonth,
        calculatorsThisMonth: totalCalculatorsThisMonth,
        totalCreditsInSystem: totalCreditsIssued,
      },
      recentUsers,
      monthlyUsage: monthlyUsage.slice(0, 30),
      generatedAt: now.toISOString(),
    };

    res.json(stats);
  } catch (error: any) {
    console.error('CEO Stats API Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
}
