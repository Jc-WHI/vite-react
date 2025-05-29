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
        secure: false,
        rewrite: (path) => {
          const apiKey = 'o3VgpfcYb4BEcTQj4zhqweX8NCUGntYn'
          const newPath = path.replace(/^\/api/, '')
          const separator = newPath.includes('?') ? '&' : '?'
          return `${newPath}${separator}apikey=${apiKey}`
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('프록시 에러:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('프록시 요청:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('프록시 응답:', proxyRes.statusCode, req.url)
          })
        }
      }
    }
  }
})
