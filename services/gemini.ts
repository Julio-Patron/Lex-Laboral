import { ChatMessage, AnalyzedDocumentHistory } from "../types";
import Tesseract from 'tesseract.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const streamLegalChat = async (
  history: ChatMessage[],
  newMessage: string,
  useThinking: boolean,
  accessToken: string,
  focusMode?: 'standard' | 'individual' | 'collective' | 'procedural',
  analysisHistory: AnalyzedDocumentHistory[] = []
) => {
  const latestMessage = history[history.length - 1];
  const hasAttachment = latestMessage.attachment && latestMessage.attachment.type === 'file' && latestMessage.attachment.data;

  // We move the AI logic to the server, so we just call our new API
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      history,
      message: newMessage,
      useThinking,
      focusMode,
      hasAttachment // Hint for usage tracking if needed, though server checks it too
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate response');
  }

  const data = await response.json();
  return {
    response: {
      text: () => data.text
    }
  };
};

export const analyzeLegalDocument = async (
  files: { base64: string; mimeType: string; name: string }[],
  prompt: string,
  accessToken: string
) => {
  // Keep OCR extraction for images on client side
  let extractedTexts = "";
  for (const file of files) {
    if (file.mimeType.startsWith('image/')) {
      try {
        const { data: { text } } = await Tesseract.recognize(
          `data:${file.mimeType};base64,${file.base64}`,
          'spa', 
          { logger: m => console.log(m) }
        );
        extractedTexts += `\n--- TEXTO EXTRAÍDO DE ${file.name} ---\n${text}\n`;
      } catch (ocrError) {
        console.error(`Error de OCR en ${file.name}:`, ocrError);
      }
    }
  }

  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      files,
      prompt: `${extractedTexts ? `Utilice este texto extraído por OCR como referencia primaria: ${extractedTexts}` : ''} ${prompt}`
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze document');
  }

  const data = await response.json();
  return data.text;
};

export const draftLegalDocument = async (
  requirements: string, 
  accessToken: string
) => {
  const response = await fetch(`${API_URL}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ requirements })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to draft document');
  }

  const data = await response.json();
  return data.text;
};
