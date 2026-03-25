import { authenticateUser } from './_utils/auth';
import { checkChatUsage, checkUsage } from './_utils/usage';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await authenticateUser(req);
    const { type } = req.body; // 'chat' or 'audits'

    if (type === 'chat') {
      await checkChatUsage(user.id);
    } else if (type === 'audits') {
      await checkUsage(user.id, 'audits');
    } else {
      return res.status(400).json({ error: 'Invalid usage type requested.' });
    }
    res.json({ success: true, message: 'Usage verified and deducted.' });
  } catch (error: any) {
    console.error('Verify Usage API Error:', error);
    if (error.message.includes('Límite') || error.message.includes('Saldo') || error.message === 'Unauthorized') {
      return res.status(error.message === 'Unauthorized' ? 401 : 403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
