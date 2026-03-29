import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';
import { supabaseAdmin } from '../lib/supabase-admin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requirements, customInstructions, guestId } = req.body;

    // SECURITY: Pay-to-Go Validation
    if (!guestId) {
      return res.status(401).json({ error: 'No autorizado. Se requiere un plan activo para generar dictámenes.' });
    }

    // Determine access level
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_premium, access_until, license_type')
      .eq('id', guestId)
      .single();
      
    const hasActiveSub = userRecord?.is_premium && new Date(userRecord.access_until) > new Date();

    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('draft_basic_balance')
      .eq('user_id', guestId)
      .single();

    let isUsingFreeCredit = false;

    if (hasActiveSub) {
      // Check Fair Use Policy: Max 100 documents per month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      let usageData;
      const usageFetch = await supabaseAdmin
        .from('user_usage')
        .select('draft_basic_month_count')
        .eq('user_id', guestId)
        .eq('month', currentMonth)
        .maybeSingle();
        
      if (usageFetch.error && usageFetch.error.code !== 'PGRST116') {
         // ignore missing row
      } else {
         usageData = usageFetch.data;
      }

      const count = usageData?.draft_basic_month_count || 0;
      if (count >= 100) {
        return res.status(429).json({ error: 'Has alcanzado el límite de Uso Justo (100 dictámenes al mes). Por favor renueva tu plan o contacta a soporte.' });
      }

      // Increment Usage
      await supabaseAdmin.from('user_usage').upsert({
        user_id: guestId,
        month: currentMonth,
        draft_basic_month_count: count + 1
      }, { onConflict: 'user_id,month' });
      
    } else {
      // No active sub, rely on credits
      if (creditsError || !credits || credits.draft_basic_balance < 1) {
        return res.status(402).json({ error: 'Créditos agotados. Por favor, adquiere un Pase Mensual o Documento Individual.' });
      }
      isUsingFreeCredit = true;
      // Deduct 1 credit
      await supabaseAdmin
        .from('user_credits')
        .update({ draft_basic_balance: credits.draft_basic_balance - 1 })
        .eq('user_id', guestId);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const promptText = `TAREA: Proyecta el siguiente instrumento jurídico con base en los requerimientos. ES ESTRICTAMENTE OBLIGATORIO que utilices la estructura de [Proemio, Prestaciones o Declaraciones, Hechos o Cláusulas, Derecho, Puntos Resolutivos y Firmas] aplicable al tipo de documento.

Requerimientos del usuario:
${requirements}

Instrucciones extra:
${customInstructions || 'Ninguna'}
`;

    let resultText = await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const result = await model.generateContent(promptText);
      return (await result.response).text();
    });

    if (isUsingFreeCredit) {
      resultText += '\n\n---\n*Generado con Inteligencia Artificial por Lex Laboral. Obtén documentos ilimitados sin marca de agua en lexmexl.vercel.app*';
    }

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Draft API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
