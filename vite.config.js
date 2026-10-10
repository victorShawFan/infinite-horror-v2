import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        rebuild: resolve(__dirname, 'index.html'),
        legacy: resolve(__dirname, 'legacy.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
