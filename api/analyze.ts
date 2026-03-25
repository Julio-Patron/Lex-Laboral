import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateUser } from './_utils/auth';
import { checkUsage } from './_utils/usage';
import { executeWithGeminiFallback, SYSTEM_INSTRUCTION } from './_utils/ai';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 5;
const MAX_PROMPT_LENGTH = 5000;
const MAX_TOTAL_SIZE_MB = 25;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { files, prompt } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Debe adjuntar al menos un archivo.' });
    }

    if (files.length > MAX_FILES) {
      return res.status(400).json({ error: `Máximo ${MAX_FILES} archivos permitidos.` });
    }

    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: `El texto de consulta excede ${MAX_PROMPT_LENGTH} caracteres.` });
    }

    for (const file of files) {
      if (!file.mimeType || !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
        return res.status(400).json({ error: `Tipo de archivo no permitido: ${file.mimeType}. Permitidos: PDF, JPG, PNG, GIF, WEBP.` });
      }

      if (!file.base64) {
        return res.status(400).json({ error: 'Archivo corrupto o vacío.' });
      }

      const fileSizeMB = (file.base64.length * 3) / 4 / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        return res.status(400).json({ error: `El archivo ${file.name || 'adjunto'} excede ${MAX_FILE_SIZE_MB}MB.` });
      }
    }

    const totalSizeMB = files.reduce((acc, f) => acc + (f.base64.length * 3) / 4 / (1024 * 1024), 0);
    if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
      return res.status(400).json({ error: `El total de archivos excede ${MAX_TOTAL_SIZE_MB}MB.` });
    }

    await checkUsage(user.id, 'audits');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const fileParts = files.map((f: any) => ({ 
      inlineData: { mimeType: f.mimeType, data: f.base64 } 
    }));
    const textPart = { text: `Realice un Dictamen de Auditoría Integral exhaustivo. Petición: ${prompt || 'Analice este documento.'}` };
    const parts = [...fileParts, textPart];

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
