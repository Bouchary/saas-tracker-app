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
  build: {
    // 🌟 CORRECTION CRITIQUE : RETIRER ROLLUPOPTIONS.EXTERNAL 🌟
    // Retirer 'external: ['lucide-react']' force Rollup à bundler Lucide, 
    // ce qui est souvent plus fiable que de le laisser en 'externe' dans certains environnements.
    // L'option rollupOptions vide suffit si nous n'avons pas d'autres besoins spécifiques.
    // rollupOptions: {
    //   external: ['lucide-react'], 
    // },
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  }
})