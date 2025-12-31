import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['pdfjs-dist'], // Inclure pdfjs-dist dans l'optimisation
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: true, // Ouvre automatiquement le navigateur
  },
  // Configuration pour supporter les workers
  worker: {
    format: 'es',
    plugins: () => [],
  },
});
