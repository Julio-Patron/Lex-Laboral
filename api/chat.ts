import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateUser } from './_utils/auth';
import { checkChatUsage } from './_utils/usage';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { history, message, useThinking, focusMode } = req.body;

    await checkChatUsage(user.id);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const systemInstruction = SYSTEM_INSTRUCTION + (focusMode ? `\nENFOQUE PRIORITARIO: ${focusMode}` : '');

    const resultText = await executeWithGeminiFallback(genAI, systemInstruction, useThinking, async (model) => {
      const chat = model.startChat({ 
        history: history.slice(-10).map((h: any) => ({ 
          role: h.role, 
          parts: [{ text: h.text }] 
        })) 
      });
      const result = await chat.sendMessage(message);
      return (await result.response).text();
    });

    res.json({ text: resultText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    if (error.message && (error.message.includes('Límite') || error.message.includes('Saldo') || error.message === 'Unauthorized' || error.message === 'No token provided')) {
      return res.status(error.message === 'Unauthorized' ? 401 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
