import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/decentralized-lms/', // 👈 MUST match your repo name
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:4943`, // 👈 Adjust to your backend server}`,
        changeOrigin: true,
      },
    },
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  }
})
