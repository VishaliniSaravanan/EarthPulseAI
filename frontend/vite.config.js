import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:5001/api'

  // Derive the backend target for the local dev proxy
  const proxyTarget = apiBase.endsWith('/api')
    ? apiBase.slice(0, -4)
    : apiBase

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      // Local dev proxy — only active in dev mode, ignored in production build
      proxy: {
        '/api': {
          target: proxyTarget || 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: parseInt(process.env.PORT || '4173'),
      host: '0.0.0.0',
    },
  }
})