
export interface Attachment {
  type: 'file' | 'text';
  mimeType?: string;
  data: string; // base64 for files, string content for text
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  attachment?: Attachment;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export enum AppView {
  CHAT = 'CHAT',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  DRAFTING = 'DRAFTING',
  CALCULATOR = 'CALCULATOR',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}

export interface AnalysisResult {
  summary: string;
  riskScore: number;
  pillars: {
    individual: string;
    colectivo: string;
    seguridad_social: string;
  };
  risks: string[];
  recommendation: string;
}

export interface AnalyzedFile {
  fileName: string;
  fileBase64: string;
  mimeType: string;
  previewUrl: string | null;
}

export interface AnalyzedDocumentHistory {
  id: string;
  timestamp: Date;
  result: AnalysisResult;
  files: AnalyzedFile[];
  customInstruction: string;
}

export interface SavedCase {
  id: string;
  name: string;
  date: string;
  messages: ChatMessage[];
  analysisHistory: AnalyzedDocumentHistory[];
}

export interface DemoUsage {
  messagesSent: number;
  docsAnalyzed: number;
  draftsGenerated: number;
}

export interface DraftingState {
  prompt: string;
  generatedDoc: string;
}

export interface DocumentAnalysisState {
  files: AnalyzedFile[];
  result: AnalysisResult | null;
  customInstruction: string;
}

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
}
