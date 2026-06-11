import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/users': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/extinguishers': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/inspections': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/reports': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '^/api$': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/'),
      },
    }
  }
})
