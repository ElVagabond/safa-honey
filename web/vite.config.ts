import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Photos, the logo and the Remotion film are served straight from the repo's assets/ folder.
// `npm run build:single` bundles everything into one HTML file (tools/inline_assets.py then embeds the photos and film).
export default defineConfig(({mode}) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  publicDir: mode === 'single' ? false : '../assets',
  base: './',
  build: mode === 'single' ? {outDir: 'dist-single'} : {},
}));
