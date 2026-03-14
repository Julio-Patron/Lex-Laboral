import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeLegalDocument, streamLegalChat, draftLegalDocument } from '../gemini';
import { ChatMessage } from "../../types";

// Simulamos la configuración de firebase para evitar que intente conectarse de verdad
vi.mock('../firebase.config', () => ({
  ai: {}
}));

// Creamos funciones simuladas que podemos controlar en cada prueba
const mockGenerateContent = vi.fn();
const mockSendMessage = vi.fn();

// Simulamos el SDK de Firebase AI
vi.mock('firebase/ai', () => ({
  getGenerativeModel: vi.fn(() => ({
    generateContent: mockGenerateContent,
    startChat: vi.fn(() => ({
      sendMessage: mockSendMessage
    }))
  }))
}));

describe('gemini service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeLegalDocument', () => {
    it('should throw error when generateContent fails', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error al analizar el documento'));

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      await expect(analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken))
        .rejects
        .toThrow('Error al analizar el documento');
    });

    it('should return text when response is ok', async () => {
      const mockText = 'Analysis result';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => mockText
        }
      });

      const mockFiles = [{ base64: 'test', mimeType: 'text/plain', name: 'test.txt' }];
      const mockPrompt = 'Analyze this';
      const mockIdToken = 'token123';

      const result = await analyzeLegalDocument(mockFiles, mockPrompt, mockIdToken);

      expect(result).toBe(mockText);
    });
  });

  describe('streamLegalChat', () => {
    it('should throw error when sendMessage fails', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('Error en la respuesta del motor legal'));

      const mockHistory: ChatMessage[] = [];
      const mockNewMessage = 'Hello';
      const mockIdToken = 'token123';

      await expect(streamLegalChat(mockHistory, mockNewMessage, false, mockIdToken))
        .rejects
        .toThrow('Error en la respuesta del motor legal');
    });

    it('should return a stream-like object when response is ok', async () => {
      const mockText = 'Chat response';
      mockSendMessage.mockResolvedValueOnce({
        response: {
          text: () => mockText
        }
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
    it('should throw error when generateContent fails', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error al generar el borrador'));

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      await expect(draftLegalDocument(mockRequirements, mockIdToken))
        .rejects
        .toThrow('Error al generar el borrador');
    });

    it('should return text when response is ok', async () => {
      const mockText = 'Draft result';
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => mockText
        }
      });

      const mockRequirements = 'Create a contract';
      const mockIdToken = 'token123';

      const result = await draftLegalDocument(mockRequirements, mockIdToken);

      expect(result).toBe(mockText);
    });
  });
});
