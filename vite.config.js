import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.VITE_SUPABASE_EDGE_URL ?? 'http://localhost:54321/functions/v1';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/functions/v1': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/functions\/v1/, '')
      }
    }
  },
  preview: {
    port: 3000
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true
  }
});

