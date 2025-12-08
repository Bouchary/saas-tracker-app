// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Si nous utilisons le port 5174 dans package.json, définissons-le ici aussi
    port: 5174, 
    // Assurez-vous que le proxy est correctement fermé avec des virgules
    host: '127.0.0.1', 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})