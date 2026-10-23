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
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});
