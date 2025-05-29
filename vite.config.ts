import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

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
          const finalPath = `${newPath}${separator}apikey=${apiKey}`
          console.log('프록시 경로 변환:', { original: path, final: finalPath })
          return finalPath
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('프록시 에러:', {
              error: err.message,
              url: req.url,
              method: req.method
            })
            res.writeHead(500, {
              'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({ error: '프록시 서버 에러' }))
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('프록시 요청:', {
              method: req.method,
              url: req.url,
              headers: proxyReq.getHeaders()
            })
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('프록시 응답:', {
              statusCode: proxyRes.statusCode,
              url: req.url,
              headers: proxyRes.headers
            })
          })
        }
      } as ProxyOptions
    }
  }
})
