import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@allmyapps/ui': new URL('../../packages/ui/src/index.ts', import.meta.url)
        .pathname,
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
