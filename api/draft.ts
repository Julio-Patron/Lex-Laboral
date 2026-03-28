
import { GoogleGenerativeAI } from '@google/generative-ai';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requirements, customInstructions } = req.body;

    // TODO: Add rate limiting or Stripe session validation here for Pay-to-Go

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const promptText = `TAREA: Proyecte instrumento jurídico.\n\nRequerimientos: ${requirements}\nInstrucciones extra: ${customInstructions || 'Ninguna'}`;

    const resultText = await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const result = await model.generateContent(promptText);
      return (await result.response).text();
    });

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Draft API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
