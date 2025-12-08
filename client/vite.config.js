// client/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // 🌟 NOUVEL IMPORT NÉCESSAIRE POUR path.resolve 🌟

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
  
  // 🌟 MODIFICATION CRITIQUE : AJOUT DE L'ALIAS 🌟
  resolve: {
    alias: {
      // Dit à Rollup/Vite que "lucide-react" doit être résolu à partir 
      // du chemin absolu 'node_modules/lucide-react' DANS le dossier 'client'.
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
  },
})