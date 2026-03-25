import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateUser } from './_utils/auth';
import { checkChatUsage } from './_utils/usage';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

const ALLOWED_FOCUS_MODES = ['standard', 'individual', 'collective', 'procedural'];
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LENGTH = 20;

function sanitizeFocusMode(mode: string | undefined): string | undefined {
  if (!mode) return undefined;
  const normalized = mode.toLowerCase().trim();
  return ALLOWED_FOCUS_MODES.includes(normalized) ? normalized : undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    let { history, message, useThinking, focusMode } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `El mensaje excede ${MAX_MESSAGE_LENGTH} caracteres.` });
    }

    const sanitizedFocusMode = sanitizeFocusMode(focusMode);
    const historyArray = Array.isArray(history) ? history.slice(-MAX_HISTORY_LENGTH) : [];

    await checkChatUsage(user.id);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    let systemInstruction = SYSTEM_INSTRUCTION;
    
    if (sanitizedFocusMode) {
      const focusDescriptions: Record<string, string> = {
        standard: 'General - Análisis integral de todos los aspectos laborales.',
        individual: 'Individual - Enfoque en relaciones individuales de trabajo (contratos, rescisiones, prestaciones).',
        collective: 'Colectivo - Enfoque en derecho colectivo (sindicatos, contratos colectivos, huelgas).',
        procedural: 'Procedimental - Enfoque en procesos laborales (demandas, conciliación, juicios).'
      };
      systemInstruction += `\n\nENFOQUE PRIORITARIO: ${focusDescriptions[sanitizedFocusMode]}`;
    }

    const resultText = await executeWithGeminiFallback(genAI, systemInstruction, useThinking, async (model) => {
      const chat = model.startChat({ 
        history: historyArray.map((h: any) => ({ 
          role: h.role, 
          parts: [{ text: h.text?.substring(0, 2000) || '' }] 
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
