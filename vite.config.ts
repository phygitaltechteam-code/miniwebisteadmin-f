import {defineConfig} from 'vite';
import viteReact from '@vitejs/plugin-react';
import {resolve} from 'path';

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    // Fixed port: card links in .env (VITE_CARD_BASE_URL) point at this PC on :5175
    port: 5175,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});
