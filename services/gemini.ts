
import { ChatMessage, AnalyzedDocumentHistory } from "../types";

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface StreamResponse {
  response: {
    text: () => string;
  };
}

// NOTE: chat and analyze functions are deprecated and will be removed in next cleanup.

export const draftLegalDocument = async (
  requirements: string, 
  customInstructions?: string
) => {
  const response = await fetch(`${API_URL}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requirements, customInstructions })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to draft document';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.text;
};

export const checkCalculatorUsage = async () => {
  const response = await fetch(`${API_URL}/calculator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.ok;
};
