import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'http';

const readRequestBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });

const createApiResponse = (res: ServerResponse) => {
  const apiRes = {
    setHeader(key: string, value: string) {
      res.setHeader(key, value);
      return apiRes;
    },
    status(code: number) {
      res.statusCode = code;
      return apiRes;
    },
    json(payload: unknown) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(payload));
      return apiRes;
    },
    end(payload?: string) {
      res.end(payload);
      return apiRes;
    },
  };

  return apiRes;
};

const localApiSearchPlugin = () => ({
  name: 'lex-local-api-search',
  configureServer(server: any) {
    server.middlewares.use('/api/search', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        next();
        return;
      }

      try {
        const rawBody = await readRequestBody(req);
        const { default: handler } = await import('./api/search');
        await handler(
          {
            method: req.method,
            headers: req.headers,
            body: rawBody ? JSON.parse(rawBody) : {},
          },
          createApiResponse(res)
        );
      } catch (error) {
        console.error('Local /api/search middleware failed:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify({ results: [], count: 0, message: 'Local search middleware failed.' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const exposeDevServer = env.VITE_EXPOSE_DEV_SERVER === 'true';
    return {
      server: {
        port: 5173,
        host: exposeDevServer ? '0.0.0.0' : '127.0.0.1',
        cors: exposeDevServer
          ? { origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }
          : false,
        allowedHosts: exposeDevServer ? true : ['localhost', '127.0.0.1']
      },
      plugins: [localApiSearchPlugin(), react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        modulePreload: {
          resolveDependencies(_, deps, context) {
            if (context.hostType !== 'html') return deps;

            return deps.filter((dep) =>
              !dep.includes('vendor-pdf') && !dep.includes('vendor-charts')
            );
          },
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                const normalizedId = id.replace(/\\/g, '/');
                if (
                  normalizedId.includes('/node_modules/react/') ||
                  normalizedId.includes('/node_modules/react-dom/') ||
                  normalizedId.includes('/node_modules/scheduler/')
                ) {
                  return 'vendor-react';
                }
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('jspdf')) return 'vendor-pdf';
                if (id.includes('framer-motion')) return 'vendor-motion';
                if (id.includes('lucide-react')) return 'vendor-icons';
              }
            }
          }
        }
      }
    };
});
