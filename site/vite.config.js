import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Product photos live in ../assets (shared with the original single-file concept).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@assets': fileURLToPath(new URL('../assets', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
})
