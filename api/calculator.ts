
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // For Pay-to-Go, we could add per-calculation payment check here if needed.
  res.json({ success: true });
}
