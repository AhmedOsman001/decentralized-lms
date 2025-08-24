import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // 👈 MUST match your repo name
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.CANISTER_ID_ROUTER_CANISTER': JSON.stringify(process.env.CANISTER_ID_ROUTER_CANISTER || 'u6s2n-gx777-77774-qaaba-cai'),
  },
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
    host: '0.0.0.0', // Allow access from any IP
    port: 3000,
    // Allow access via subdomain.lms.localhost
    allowedHosts: [
      'localhost',
      '.lms.localhost',
      '127.0.0.1',
      '.localhost'
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '.lms.localhost', 
      '127.0.0.1',
      '.localhost'
    ]
  }
})
