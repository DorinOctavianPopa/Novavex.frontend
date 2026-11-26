import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // NovavexWA (LoginController.cs) does not configure CORS, so requests to /api/* are
      // proxied to the backend in dev to avoid cross-origin failures. Override the target
      // with VITE_BACKEND_URL if the backend runs on a different host/port.
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL ?? 'https://localhost:7150',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
