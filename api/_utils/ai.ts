import { GoogleGenerativeAI } from '@google/generative-ai';

export const SYSTEM_INSTRUCTION = `
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

const REQUEST_TIMEOUT_MS = 60000;

export async function executeWithGeminiFallback(genAI: any, systemInstruction: string, useThinking: boolean, executeFn: (model: any) => Promise<any>) {
  const modelsToTry = useThinking ? FALLBACK_MODELS_THINKING : FALLBACK_MODELS_FAST;
  let lastError;
  const failedModels: string[] = [];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemInstruction });
      return await withTimeout(executeFn(model), REQUEST_TIMEOUT_MS, modelName);
    } catch (error: any) {
      failedModels.push(modelName);
      console.warn(`[Fallback] Model ${modelName} failed:`, error.message);
      lastError = error;
      if (error.message.includes('Límite') || error.message.includes('Saldo') || error.message.includes('timeout')) {
        throw error;
      }
    }
  }
  console.error(`[AI] All models failed: ${failedModels.join(', ')}`);
  throw lastError;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, modelName: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout de ${ms/1000}s en modelo ${modelName}`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
