import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative base: works at koan-shdw.github.io/koan-site AND on the custom
  // domain root once it's attached — no rebuild needed between the two
  base: './',
  // PORT comes from the preview harness (autoPort); 5273 is the manual fallback
  server: { port: Number(process.env.PORT) || 5273, strictPort: true },
});
