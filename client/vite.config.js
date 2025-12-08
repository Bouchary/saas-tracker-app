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
  // 🌟 NOUVELLE CONFIGURATION POUR ÉVITER L'ERREUR DE RÉSOLUTION ROLLUP 🌟
  build: {
    rollupOptions: {
      // Déclare expressément ces dépendances comme externes
      // afin que Rollup n'essaie pas de les bundler, évitant ainsi l'erreur de résolution.
      external: ['lucide-react'], 
    },
  },
})