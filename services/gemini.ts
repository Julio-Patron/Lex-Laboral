import { ai } from "../firebase.config";
import { getGenerativeModel } from "firebase/ai";
import { ChatMessage, AnalyzedDocumentHistory } from "../types";
import Tesseract from 'tesseract.js';

const SYSTEM_INSTRUCTION = `
Eres "Lex Laboral", un motor de inteligencia jurídica de alto nivel en México especializado exclusivamente en Derecho Laboral Mexicano.

ÁREAS DE EXPERTISE:
1. Relaciones Individuales de Trabajo: Dominio total de la Ley Federal del Trabajo (LFT). Especialista en contratos individuales, jornadas, salarios, prestaciones (aguinaldo, vacaciones, prima vacacional) y rescisiones.
2. Relaciones Colectivas: Especialista en Sindicatos, Contratos Colectivos de Trabajo (CCT), Contratos Ley y huelgas. Conocimiento profundo de la reforma laboral de 2019.
3. Seguridad Social y Previsión Social: Dominio de la Ley del Seguro Social (IMSS) y Ley del INFONAVIT. Análisis de cuotas, riesgos de trabajo y pensiones.
4. Derecho Procesal Laboral: Conocimiento de los nuevos Tribunales Laborales y Centros de Conciliación. Estrategia en juicios laborales y conciliación obligatoria.

REGLAS DE OPERACIÓN:
- SOBRIEDAD Y PRECISIÓN: Tu tono es estrictamente profesional, técnico y directo.
- SÍNTESIS ESTRATÉGICA: Sintetiza tus respuestas. Evita preámbulos innecesarios. Ve directo al punto legal. Utiliza estructuras jerárquicas (viñetas, negritas) para facilitar la lectura rápida.
- FUNDAMENTACIÓN POSITIVA: Sustenta cada diagnóstico exclusivamente en fuentes del Derecho Positivo Mexicano vigente: Constitución Política (CPEUM), Ley Federal del Trabajo (LFT), Ley del Seguro Social (LSS), Ley del INFONAVIT y Jurisprudencia firme de la SCJN o Tribunales Colegiados.
- ANÁLISIS INTEGRAL: Proporciona diagnósticos que crucen la LFT, Seguridad Social y Precedentes Judiciales.
- ESTRUCTURA: Genera respuestas con organización clara y jerárquica.

No uses lenguaje coloquial. Tu objetivo es la justicia social, el equilibrio entre los factores de la producción y la excelencia técnica en el entorno laboral mexicano.
`;

const FALLBACK_MODELS_THINKING = ["gemini-2.5-pro", "gemini-3-flash", "gemini-2.5-flash"];
const FALLBACK_MODELS_FAST = ["gemini-3-flash", "gemini-2.5-flash", "gemini-2.5-pro"];

const executeWithGeminiFallback = async (useThinking: boolean, systemInstruction: string, executeFn: (model: any) => Promise<any>) => {
  const modelsToTry = useThinking ? FALLBACK_MODELS_THINKING : FALLBACK_MODELS_FAST;
  let lastError;
  
  for (const modelName of modelsToTry) {
    try {
      const model = getGenerativeModel(ai, {
        model: modelName,
        systemInstruction
      });
      return await executeFn(model);
    } catch (error: any) {
      console.warn(`[Fallback] Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }
  throw lastError;
};

export const streamLegalChat = async (
  history: ChatMessage[],
  newMessage: string,
  useThinking: boolean,
  idToken: string, // Kept for signature compatibility
  focusMode?: 'standard' | 'individual' | 'collective' | 'procedural',
  analysisHistory: AnalyzedDocumentHistory[] = []
) => {
  // The caller passes [...messages, userMsg], so the last item is the actual message to send.
  const actualHistory = history.slice(0, -1);
  const latestMessage = history[history.length - 1];

  const hasAttachment = latestMessage.attachment && latestMessage.attachment.type === 'file' && latestMessage.attachment.data;
  const usageType = hasAttachment ? 'audits' : 'chat';

  // Verify and deduct usage on the backend before executing the model
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/studio-6462708856-c0f94/us-central1/api';
  const verifyRes = await fetch(`${apiUrl}/api/legal/verify-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ type: usageType })
  });

  if (!verifyRes.ok) {
    const errorData = await verifyRes.json();
    throw new Error(errorData.error || 'Failed to verify usage. Please check your credits.');
  }

  const systemInstruction = SYSTEM_INSTRUCTION + (focusMode ? `\nENFOQUE PRIORITARIO: ${focusMode}` : '');
  
  return await executeWithGeminiFallback(useThinking, systemInstruction, async (model) => {
    const chat = model.startChat({
      history: actualHistory.map(h => {
        const parts: any[] = [{ text: h.text }];
        if (h.attachment && h.attachment.type === 'file' && h.attachment.data) {
          parts.push({
            inlineData: {
              mimeType: h.attachment.mimeType || 'application/pdf',
              data: h.attachment.data
            }
          });
        }
        return {
          role: h.role === 'user' ? 'user' : 'model',
          parts
        };
      }),
    });

    const latestParts: any[] = [{ text: latestMessage.text || newMessage }];
    if (hasAttachment) {
      latestParts.push({
        inlineData: {
          mimeType: latestMessage.attachment!.mimeType || 'application/pdf',
          data: latestMessage.attachment!.data
        }
      });
    }

    const result = await chat.sendMessage(latestParts);
    const response = await result.response;
    
    return {
      response: {
        text: () => response.text()
      }
    };
  });
};

export const analyzeLegalDocument = async (
  files: { base64: string; mimeType: string; name: string }[],
  prompt: string,
  idToken: string // Kept for signature compatibility
) => {
  // OCR extraction for images
  let extractedTexts = "";
  for (const file of files) {
    if (file.mimeType.startsWith('image/')) {
      try {
        const { data: { text } } = await Tesseract.recognize(
          `data:${file.mimeType};base64,${file.base64}`,
          'spa', // Mexican Spanish context
          { logger: m => console.log(m) }
        );
        extractedTexts += `\n--- TEXTO EXTRAÍDO DE ${file.name} ---\n${text}\n`;
      } catch (ocrError) {
        console.error(`Error de OCR en ${file.name}:`, ocrError);
      }
    }
  }

  const promptPart = {
    text: `Realice un Dictamen de Auditoría Integral exhaustivo sobre los instrumentos proporcionados. 
    ${extractedTexts ? `Utilice este texto extraído por OCR como referencia primaria: ${extractedTexts}` : ''}
    Petición técnica: ${prompt}`
  };

  const fileParts = files.map(file => ({
    inlineData: { mimeType: file.mimeType, data: file.base64 }
  }));

  return await executeWithGeminiFallback(true, SYSTEM_INSTRUCTION, async (model) => {
    const result = await model.generateContent([promptPart, ...fileParts]);
    const response = await result.response;
    return response.text();
  });
};

export const draftLegalDocument = async (
  requirements: string, 
  idToken: string // Kept for signature compatibility
) => {
  const promptText = `TAREA: Proyecte el instrumento jurídico formal completo siguiendo la técnica legislativa y contractual mexicana.\n\nRequerimientos: ${requirements}`;
  
  return await executeWithGeminiFallback(true, SYSTEM_INSTRUCTION, async (model) => {
    const result = await model.generateContent([promptText]);
    const response = await result.response;
    return response.text();
  });
};
