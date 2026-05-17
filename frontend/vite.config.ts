import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router-dom') || id.includes('react-dom')) return 'vendor';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'ui';
            if (id.includes('@tanstack') || id.includes('axios') || id.includes('zustand')) return 'data';
            if (id.includes('@supabase')) return 'supabase';
            return 'vendor';
          }
        },
      },
    },
  },
})
