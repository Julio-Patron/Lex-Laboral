import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeLegalDocument, streamLegalChat, draftLegalDocument } from '../gemini';
import { ChatMessage } from "../../types";

describe('gemini service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('analyzeLegalDocument', () => {
    it('should throw error when fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error al analizar el documento' })
      } as Response);

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      await expect(analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken))
        .rejects
        .toThrow('Error al analizar el documento');
    });

    it('should return text when response is ok', async () => {
      const mockText = 'Analysis result';
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: mockText })
      } as Response);

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      const result = await analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken);

      expect(result).toBe(mockText);
    });
  });

  describe('streamLegalChat', () => {
    it('should throw error when fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error en la respuesta del motor legal' })
      } as Response);

      const mockHistory: ChatMessage[] = [{ role: 'user', text: 'Hello' }];
      const mockNewMessage = 'Hello';
      const mockIdToken = 'token123';

      await expect(streamLegalChat(mockHistory, mockNewMessage, false, mockIdToken))
        .rejects
        .toThrow('Error en la respuesta del motor legal');
    });

    it('should return a stream-like object when response is ok', async () => {
      const mockText = 'Respuesta de prueba';
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: mockText })
      } as Response);

      const mockHistory: ChatMessage[] = [{ role: 'user', text: 'Hello' }];
      const mockNewMessage = 'Hello';
      const mockIdToken = 'token123';

      const result = await streamLegalChat(mockHistory, mockNewMessage, false, mockIdToken);

      expect(result).toHaveProperty('response');
      expect(typeof result.response.text).toBe('function');
      expect(result.response.text()).toBe(mockText);
    });
  });

  describe('draftLegalDocument', () => {
    it('should throw error when fetch fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error al generar el borrador' })
      } as Response);

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      await expect(draftLegalDocument(mockRequirements, mockIdToken))
        .rejects
        .toThrow('Error al generar el borrador');
    });

    it('should return text when response is ok', async () => {
      const mockText = 'Draft result';
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: mockText })
      } as Response);

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      const result = await draftLegalDocument(mockRequirements, mockIdToken);

      expect(result).toBe(mockText);
    });
  });
});
