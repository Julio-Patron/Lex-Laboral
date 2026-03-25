import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateUser } from './_utils/auth';
import { checkUsage } from './_utils/usage';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { requirements, customInstructions } = req.body;

    await checkUsage(user.id, customInstructions ? 'draft_custom' : 'draft_basic');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const promptText = `TAREA: Proyecte instrumento jurídico.\n\nRequerimientos: ${requirements}\nInstrucciones extra: ${customInstructions || 'Ninguna'}`;

    const resultText = await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const result = await model.generateContent(promptText);
      return (await result.response).text();
    });

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Draft API Error:', error);
    if (error.message && (error.message.includes('Límite') || error.message.includes('Saldo') || error.message === 'Unauthorized')) {
      return res.status(error.message === 'Unauthorized' ? 401 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
