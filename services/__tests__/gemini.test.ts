import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeLegalDocument, streamLegalChat, draftLegalDocument } from '../gemini';
import { ChatMessage, AnalyzedDocumentHistory } from "../../types";

// Mock fetch
global.fetch = vi.fn();

describe('gemini service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeLegalDocument', () => {
    it('should throw "Error al analizar el documento" when response is not ok', async () => {
      // Mock a failed fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      await expect(analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken))
        .rejects
        .toThrow('Error al analizar el documento');

      // Verify fetch was called with correct arguments
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockIdToken}`
          },
          body: JSON.stringify({ files: mockFiles, prompt: mockPrompt })
        })
      );
    });

    it('should return text when response is ok', async () => {
      // Mock a successful fetch response
      const mockText = 'Analysis result';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: mockText })
      });

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      const result = await analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken);

      expect(result).toBe(mockText);
    });
  });

  describe('streamLegalChat', () => {
    it('should throw "Error en la respuesta del motor legal" when response is not ok', async () => {
      // Mock a failed fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const mockHistory: ChatMessage[] = [];
      const mockNewMessage = 'Hello';
      const mockIdToken = 'token123';

      await expect(streamLegalChat(mockHistory, mockNewMessage, false, mockIdToken))
        .rejects
        .toThrow('Error en la respuesta del motor legal');
    });

    it('should return a stream-like object when response is ok', async () => {
      // Mock a successful fetch response
      const mockText = 'Chat response';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: mockText })
      });

      const mockHistory: ChatMessage[] = [];
      const mockNewMessage = 'Hello';
      const mockIdToken = 'token123';

      const result = await streamLegalChat(mockHistory, mockNewMessage, false, mockIdToken);

      expect(result).toHaveProperty('response');
      expect(typeof result.response.text).toBe('function');
      expect(result.response.text()).toBe(mockText);
    });
  });

  describe('draftLegalDocument', () => {
    it('should throw "Error al generar el borrador" when response is not ok', async () => {
      // Mock a failed fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      await expect(draftLegalDocument(mockRequirements, mockIdToken))
        .rejects
        .toThrow('Error al generar el borrador');
    });

    it('should return text when response is ok', async () => {
      // Mock a successful fetch response
      const mockText = 'Draft result';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: mockText })
      });

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      const result = await draftLegalDocument(mockRequirements, mockIdToken);

      expect(result).toBe(mockText);
    });
  });
});
