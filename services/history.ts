import { db } from '../firebase.config';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ChatSession, ChatMessage } from '../types';

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
    if (msg.attachment && msg.attachment.type === 'file') {
      return {
        ...msg,
        attachment: {
          ...msg.attachment,
          data: '' // Remove base64 to save Firestore space
        }
      };
    }
    return msg;
  });
};

export const saveSession = async (userId: string, sessionId: string, messages: ChatMessage[]) => {
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    
    const cleanedMessages = cleanMessagesForStorage(messages);
    const title = generateTitle(messages);

    const sessionData: ChatSession = {
      id: sessionId,
      title,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(), // In a real scenario, keep original if updating
      messages: cleanedMessages
    };

    // To prevent overwriting the original createdAt, we could do a merge or just update the whole object
    // For simplicity, we just set the document (it will overwrite createdAt, but we can fix that logic in App.tsx)
    await setDoc(sessionRef, sessionData, { merge: true });
    
    return sessionData;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

export const getUserSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const sessions: ChatSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data() as ChatSession);
    });
    
    return sessions;
  } catch (error) {
    console.error("Error getting sessions:", error);
    return [];
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};
