import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        cors: true,
        allowedHosts: true
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-ai': ['@google/generative-ai'],
              'vendor-charts': ['recharts'],
              'vendor-pdf': ['jspdf', 'jspdf-autotable'],
              'vendor-ocr': ['tesseract.js'],
              'vendor-ui': ['framer-motion', 'lucide-react', 'react-markdown'],
            }
          }
        }
      }
    };
});
