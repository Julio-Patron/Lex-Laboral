
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ChatMessage, AnalyzedFile, AnalyzedDocumentHistory } from "../types";

const SYSTEM_INSTRUCTION = `
Eres "LexLaboral", un motor de inteligencia jurídica de alto nivel en México especializado exclusivamente en Derecho Laboral Mexicano.

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

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

export const streamLegalChat = async (
  history: ChatMessage[],
  newMessage: string,
  useThinking: boolean,
  focusMode?: 'standard' | 'individual' | 'collective' | 'procedural',
  analysisHistory: AnalyzedDocumentHistory[] = []
) => {
  const ai = getAIClient();
  const model = 'gemini-3.1-pro-preview';

  let specializedInstruction = SYSTEM_INSTRUCTION;
  
  if (analysisHistory.length > 0) {
    specializedInstruction += "\n\nCONTEXTO DE AUDITORÍAS RECIENTES:";
    analysisHistory.slice(0, 3).forEach((analysis, idx) => {
      specializedInstruction += `\nAuditoría ${idx + 1} (${analysis.timestamp.toLocaleDateString()}):
      - Resumen: ${analysis.result.summary}
      - Riesgo: ${analysis.result.riskScore}/10
      - Hallazgos: ${analysis.result.risks.join(', ')}`;
    });
    specializedInstruction += "\nUtiliza este contexto si el usuario hace referencia a documentos analizados previamente.";
  }

  if (focusMode === 'individual') {
    specializedInstruction += "\nENFOQUE PRIORITARIO: Relaciones individuales, condiciones de trabajo, despidos, finiquitos y liquidaciones.";
  } else if (focusMode === 'collective') {
    specializedInstruction += "\nENFOQUE PRIORITARIO: Derecho Colectivo, libertad sindical, legitimación de CCT y conflictos colectivos.";
  } else if (focusMode === 'procedural') {
    specializedInstruction += "\nENFOQUE PRIORITARIO: Derecho Procesal Laboral, etapa conciliatoria, demanda laboral, pruebas y audiencias ante Tribunales.";
  }

  const config: any = {
    systemInstruction: specializedInstruction,
    tools: [{ googleSearch: {} }], 
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH }; 
  }

  const formattedHistory: any[] = [];
  for (const msg of history) {
    const parts: any[] = [];
    if (msg.text) parts.push({ text: msg.text });

    const lastEntry = formattedHistory[formattedHistory.length - 1];
    if (lastEntry && lastEntry.role === msg.role) {
        lastEntry.parts.push(...parts);
    } else {
        formattedHistory.push({ role: msg.role, parts: parts });
    }
  }

  const chat = ai.chats.create({ model, config, history: formattedHistory });
  return await chat.sendMessageStream({ message: newMessage });
};

export const analyzeLegalDocument = async (
  files: { base64: string; mimeType: string; name: string }[],
  prompt: string
) => {
  const ai = getAIClient();
  const parts: any[] = files.map(file => ({
    inlineData: { mimeType: file.mimeType, data: file.base64 }
  }));

  parts.push({
    text: `Realice un Dictamen de Auditoría Integral exhaustivo sobre los siguientes instrumentos: ${files.map(f => f.name).join(', ')}.
    Petición técnica de enfoque: ${prompt}`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts: parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          riskScore: { type: Type.NUMBER },
          pillars: {
            type: Type.OBJECT,
            properties: {
              individual: { type: Type.STRING, description: "Análisis de la relación individual de trabajo y LFT" },
              colectivo: { type: Type.STRING, description: "Análisis de implicaciones sindicales o colectivas" },
              seguridad_social: { type: Type.STRING, description: "Análisis de IMSS, INFONAVIT y previsión social" }
            },
            required: ["individual", "colectivo", "seguridad_social"]
          },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendation: { type: Type.STRING }
        },
        required: ["summary", "riskScore", "pillars", "risks", "recommendation"]
      }
    }
  });

  return response.text;
};

export const draftLegalDocument = async (requirements: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: requirements,
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\nTAREA: Proyecte el instrumento jurídico formal completo siguiendo la técnica legislativa y contractual mexicana.`,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } 
    }
  });
  return response.text;
};
