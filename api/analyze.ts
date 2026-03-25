import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateUser } from './_utils/auth';
import { checkUsage } from './_utils/usage';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { files, prompt } = req.body;

    await checkUsage(user.id, 'audits');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const parts = files.map((f: any) => ({ 
      inlineData: { mimeType: f.mimeType, data: f.base64 } 
    }));
    parts.push({ text: `Realice un Dictamen de Auditoría Integral exhaustivo. Petición: ${prompt}` });

    const resultText = await executeWithGeminiFallback(genAI, SYSTEM_INSTRUCTION, true, async (model) => {
      const result = await model.generateContent(parts);
      return (await result.response).text();
    });

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    if (error.message && (error.message.includes('Límite') || error.message.includes('Saldo') || error.message === 'Unauthorized')) {
      return res.status(error.message === 'Unauthorized' ? 401 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
