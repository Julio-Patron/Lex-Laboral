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

    // Check credits
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('draft_basic_balance')
      .eq('user_id', guestId)
      .single();

    if (creditsError || !credits || credits.draft_basic_balance < 1) {
      // Check if they have a mensualidad (monthly pass)
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('is_premium, access_until')
        .eq('id', guestId)
        .single();
        
      const hasMensualidad = userRecord?.is_premium && new Date(userRecord.access_until) > new Date();
      
      if (!hasMensualidad) {
         return res.status(402).json({ error: 'Créditos agotados. Por favor, adquiera un nuevo documento o mensualidad.' });
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const promptText = `TAREA: Proyecta el siguiente instrumento jurídico con base en los requerimientos. ES ESTRICTAMENTE OBLIGATORIO que utilices la estructura de [Proemio, Prestaciones o Declaraciones, Hechos o Cláusulas, Derecho, Puntos Resolutivos y Firmas] aplicable al tipo de documento.

Requerimientos del usuario:
${requirements}

Instrucciones extra:
${customInstructions || 'Ninguna'}
`;

    const resultText = await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const result = await model.generateContent(promptText);
      return (await result.response).text();
    });

    // Deduct 1 credit if not a monthly pass
    if (credits && credits.draft_basic_balance > 0) {
      await supabaseAdmin
        .from('user_credits')
        .update({ draft_basic_balance: credits.draft_basic_balance - 1 })
        .eq('user_id', guestId);
    }

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Draft API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
