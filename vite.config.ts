import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.neople.co.kr/df',
        changeOrigin: true,
        rewrite: (path) => {
          const apiKey = 'o3VgpfcYb4BEcTQj4zhqweX8NCUGntYn'
          const newPath = path.replace(/^\/api/, '')
          const separator = newPath.includes('?') ? '&' : '?'
          return `${newPath}${separator}apikey=${apiKey}`
        }
      }
    }
  }
})
