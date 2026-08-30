import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // sockjs-client referencia `global` (Node) — mapeia pro browser
  define: {
    global: 'globalThis',
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
})