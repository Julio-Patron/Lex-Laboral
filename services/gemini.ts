import { ai } from "../firebase.config";
import { getGenerativeModel } from "firebase/ai";
import { ChatMessage, AnalyzedDocumentHistory } from "../types";

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

export const streamLegalChat = async (
  history: ChatMessage[],
  newMessage: string,
  useThinking: boolean,
  idToken: string, // Kept for signature compatibility
  focusMode?: 'standard' | 'individual' | 'collective' | 'procedural',
  analysisHistory: AnalyzedDocumentHistory[] = []
) => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_INSTRUCTION + (focusMode ? `\nENFOQUE PRIORITARIO: ${focusMode}` : '')
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    })),
  });

  const result = await chat.sendMessage(newMessage);
  const response = await result.response;
  
  return {
    response: {
      text: () => response.text()
    }
  };
};

export const analyzeLegalDocument = async (
  files: { base64: string; mimeType: string; name: string }[],
  prompt: string,
  idToken: string // Kept for signature compatibility
) => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const promptPart = {
    text: `Realice un Dictamen de Auditoría Integral exhaustivo sobre los instrumentos proporcionados. Petición técnica: ${prompt}`
  };

  const fileParts = files.map(file => ({
    inlineData: { mimeType: file.mimeType, data: file.base64 }
  }));

  const result = await model.generateContent([promptPart, ...fileParts]);
  const response = await result.response;
  return response.text();
};

export const draftLegalDocument = async (
  requirements: string, 
  idToken: string // Kept for signature compatibility
) => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-pro",
    systemInstruction: SYSTEM_INSTRUCTION
  });

  const promptText = `TAREA: Proyecte el instrumento jurídico formal completo siguiendo la técnica legislativa y contractual mexicana.\n\nRequerimientos: ${requirements}`;
  const result = await model.generateContent([promptText]);
  const response = await result.response;
  return response.text();
};
