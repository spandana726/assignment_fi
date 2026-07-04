import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          let lastLoggedAt = 0;
          proxy.on('error', (err, _req, res) => {
            // Log at most once every 30 seconds to avoid console spam
            const now = Date.now();
            if (now - lastLoggedAt > 30_000) {
              console.warn('[proxy] Backend unavailable – is the server running on :8000?');
              lastLoggedAt = now;
            }
            // Send a clean error response instead of crashing
            if (res && 'writeHead' in res && !res.headersSent) {
              (res as import('http').ServerResponse).writeHead(502, { 'Content-Type': 'application/json' });
              (res as import('http').ServerResponse).end(JSON.stringify({ error: 'Backend unavailable' }));
            }
          });
        },
      },
    },
  },
})
