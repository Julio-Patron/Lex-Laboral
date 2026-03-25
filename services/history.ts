import { supabase } from '../lib/supabase';
import { ChatSession, ChatMessage } from '../types';

const SESSION_CACHE_TTL = 60000;
const sessionCache = new Map<string, { data: ChatSession[]; timestamp: number }>();

// Utility to generate a concise title from the first user message
const generateTitle = (messages: ChatMessage[]): string => {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (!firstUserMsg) return 'Nueva Consulta Legal';
  const text = firstUserMsg.text.trim();
  if (text.length <= 40) return text;
  return text.substring(0, 40) + '...';
};

// Utility to clean up Base64 data from attachments before saving
const cleanMessagesForStorage = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.map(msg => {
    const cleanMsg = { ...msg };
    
    // Remove base64 to save DB space
    if (cleanMsg.attachment && cleanMsg.attachment.type === 'file') {
      cleanMsg.attachment = {
        ...cleanMsg.attachment,
        data: '' 
      };
    }
    
    return cleanMsg;
  });
};

export const saveSession = async (userId: string, sessionId: string, messages: ChatMessage[]) => {
  try {
    const cleanedMessages = cleanMessagesForStorage(messages);
    const title = generateTitle(messages);

    const { error } = await supabase
      .from('chat_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        title,
        messages: cleanedMessages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    
    return { id: sessionId, title, messages: cleanedMessages };
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

export const getUserSessions = async (userId: string, limit = 20): Promise<ChatSession[]> => {
  const cached = sessionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL) {
    return cached.data.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    const sessions = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messages: row.messages
    }));

    sessionCache.set(userId, { data: sessions, timestamp: Date.now() });
    
    return sessions.slice(0, limit);
  } catch (error) {
    console.error("Error getting sessions:", error);
    return [];
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  try {
    sessionCache.delete(userId);
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const clearSessionCache = (userId?: string) => {
  if (userId) {
    sessionCache.delete(userId);
  } else {
    sessionCache.clear();
  }
};
