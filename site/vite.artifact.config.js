import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.js'

// Same app, with every asset inlined and a single JS chunk, for build-artifact.py.
export default mergeConfig(base, defineConfig({
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { inlineDynamicImports: true } } },
}))
