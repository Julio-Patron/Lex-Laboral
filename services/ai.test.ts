import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateLegalResponse } from './ai';

describe('AI Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);

    // Reset fetch mock before each test
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate legal response successfully', async () => {
    // Vitest automatically maps process.env to import.meta.env
    process.env.VITE_API_URL = 'http://test-api-url';

    const mockResponseText = 'This is a mocked legal response.';
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: mockResponseText }),
    });

    const prompt = 'Test prompt';
    const result = await generateLegalResponse(prompt);

    expect(mockFetch).toHaveBeenCalledWith('http://test-api-url/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    expect(result).toBe(mockResponseText);
  });

  it('should throw error when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
    });

    const prompt = 'Test prompt';

    await expect(generateLegalResponse(prompt)).rejects.toThrow('Failed to generate response');
  });

  it('should re-throw network errors', async () => {
    const networkError = new Error('Network failure');
    mockFetch.mockRejectedValue(networkError);

    const prompt = 'Test prompt';

    await expect(generateLegalResponse(prompt)).rejects.toThrow('Network failure');
  });
});
