// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', 
  
  server: {
    port: 5174, 
    host: '127.0.0.1', 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // 🌟 RETOUR À LA CONFIGURATION PROPRE 🌟
  // Les options complexes ont introduit des erreurs ENOENT/Rollup.
  // Laissons Rollup/Vite gérer la résolution des modules par défaut.
  build: {
    outDir: 'dist',
  },
  
  // Supprimer optimizeDeps et resolve.alias
  // resolve: { /* ... */ }, 
  // optimizeDeps: { /* ... */ },
})