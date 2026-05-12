import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  // Use relative asset paths so the app works under GitHub Pages project URLs.
  base: command === 'build' ? './' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: '/#/login',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
