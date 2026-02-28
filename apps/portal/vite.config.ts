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
});
