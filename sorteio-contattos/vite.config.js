import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Evita que o Vite suba diretórios e pegue o postcss.config.js /
  // tailwind.config.js do app Next.js na raiz do monorepo — este projeto
  // é standalone e não usa Tailwind.
  css: { postcss: {} },
});
