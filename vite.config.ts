import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/evolink': {
        target: 'https://api.evolink.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/evolink/, '/v1'),
      },
    },
  },
})
