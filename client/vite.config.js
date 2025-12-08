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
  
  // 🌟 CORRECTION DÉFINITIVE : OPTIMISATION ET DÉPENDANCES 🌟
  optimizeDeps: {
    // Force la pré-bundling de 'lucide-react' pour le rendre plus simple pour Rollup
    include: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // S'assurer que les chemins sont gérés correctement pour l'environnement Netlify
    }
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  }
})