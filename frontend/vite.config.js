import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Suppress "backend down" errors so the dev server doesn't crash
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // ECONNREFUSED is expected when backend is offline — swallow it silently
            if (err.code !== 'ECONNREFUSED') {
              console.error('[proxy /api error]', err.message);
            }
          });
        },
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
        // Swallow WS proxy errors when backend is offline.
        // Without this, every failed upgrade attempt throws an uncaught error
        // that bubbles into Vite's HMR client (the "Cannot read .send" crash).
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code !== 'ECONNREFUSED') {
              console.error('[proxy /ws error]', err.message);
            }
          });
        },
      },
    },
  },
})
