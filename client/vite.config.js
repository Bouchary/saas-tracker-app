// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  build: {
    rollupOptions: {
      // Pour une meilleure compatibilité avec le déploiement Netlify
      // On maintient l'externalisation.
      external: ['lucide-react'], 
    },
    // Le dossier 'dist' est nécessaire car 'base' est 'client'
    outDir: 'dist',
  },
  // L'ajout de l'option de résolution peut parfois aider
  resolve: {
    // Permet à Vite de trouver correctement les dépendances
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  }
})