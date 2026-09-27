import { Redis } from '@upstash/redis';

// Inicializar cliente Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Orígenes permitidos (producción + desarrollo local)
const ALLOWED_ORIGINS = [
  'https://lexlaboral.com.mx',
  'https://www.lexlaboral.com.mx',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Tamaño máximo del payload del escenario (50 KB)
const MAX_SCENARIO_SIZE = 50 * 1024;

export default async function handler(req: any, res: any) {
  // CORS restrictivo: solo orígenes autorizados
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verificar si KV está configurado
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({ error: 'La base de datos (Redis) no está configurada.' });
  }

  if (req.method === 'POST') {
    try {
      const { scenario } = req.body;
      if (!scenario) {
        return res.status(400).json({ error: 'Falta el payload del escenario' });
      }

      // Validar tamaño del payload para evitar abuso
      if (typeof scenario === 'string' && scenario.length > MAX_SCENARIO_SIZE) {
        return res.status(413).json({ error: 'El escenario excede el tamaño máximo permitido' });
      }

      // Generar un hash corto único (6 caracteres)
      const hash = Math.random().toString(36).substring(2, 8);
      
      // Guardar en Redis KV con un tiempo de expiración de 30 días (2592000 segundos)
      await redis.set(`link:${hash}`, scenario, { ex: 2592000 });

      return res.status(200).json({ hash });
    } catch (error) {
      console.error('Error al guardar el enlace:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { hash } = req.query;
      if (!hash || typeof hash !== 'string' || hash.length > 10) {
        return res.status(400).json({ error: 'Hash no proporcionado o inválido' });
      }

      const scenario = await redis.get(`link:${hash}`);
      if (!scenario) {
        return res.status(404).json({ error: 'Enlace expirado o no encontrado' });
      }

      return res.status(200).json({ scenario });
    } catch (error) {
      console.error('Error al recuperar el enlace:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
