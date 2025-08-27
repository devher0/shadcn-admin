import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import api from 'vite-plugin-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    api(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/healthz': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/readyz': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
