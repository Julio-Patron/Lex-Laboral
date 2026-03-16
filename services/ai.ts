
export const generateLegalResponse = async (prompt: string) => {
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/studio-6462708856-c0f94/us-central1/api';
  try {
    const response = await fetch(`${API_URL}/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};
