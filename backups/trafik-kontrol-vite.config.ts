import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(), // React plugin for JSX support
    pages()
  ],
  build: {
    outDir: 'dist'
  },
  // React ile uyumluluk için
  esbuild: {
    jsx: 'automatic'
  }
})
