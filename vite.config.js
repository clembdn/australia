import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split('\\').join('/')
          if (!normalizedId.includes('/node_modules/')) return undefined

          if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) {
            return 'react-vendor'
          }
          if (normalizedId.includes('/firebase/')) {
            return 'firebase'
          }
          if (normalizedId.includes('/recharts/') || normalizedId.includes('/d3-')) {
            return 'charts'
          }
          if (normalizedId.includes('/lucide-react/')) {
            return 'icons'
          }
          return 'vendor'
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
      },
    },
  },
})
