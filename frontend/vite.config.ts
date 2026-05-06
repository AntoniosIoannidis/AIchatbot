import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      drafts: {
        customMedia: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'lightningcss'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
