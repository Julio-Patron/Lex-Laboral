
import { ChatMessage, AnalyzedDocumentHistory } from "../types";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
const BACKEND_URL = `${API_URL}/api/legal`;

export const streamLegalChat = async (
  history: ChatMessage[],
  newMessage: string,
  useThinking: boolean,
  userId: string,
  focusMode?: 'standard' | 'individual' | 'collective' | 'procedural',
  analysisHistory: AnalyzedDocumentHistory[] = []
) => {
  const response = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      history, 
      message: newMessage, 
      useThinking, 
      userId,
      focusMode,
      analysisHistory 
    })
  });

  if (!response.ok) throw new Error('Error en la respuesta del motor legal');
  const data = await response.json();
  
  // Return an object that mimics the stream response if needed, 
  // or just return the text. In this case, I'll adapt the UI to handle non-streaming for now 
  // to keep it simple, or I could use Server-Sent Events/JSON streams later.
  return {
    response: {
      text: () => data.text
    }
  };
};

export const analyzeLegalDocument = async (
  files: { base64: string; mimeType: string; name: string }[],
  prompt: string,
  userId: string
) => {
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, prompt, userId })
  });

  if (!response.ok) throw new Error('Error al analizar el documento');
  const data = await response.json();
  return data.text;
};

export const draftLegalDocument = async (requirements: string, userId: string) => {
  const response = await fetch(`${BACKEND_URL}/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirements, userId })
  });

  if (!response.ok) throw new Error('Error al generar el borrador');
  const data = await response.json();
  return data.text;
};
