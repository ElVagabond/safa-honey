import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Photos, the logo and the Remotion film are served straight from the repo's assets/ folder.
export default defineConfig({
  plugins: [react()],
  publicDir: '../assets',
  base: './',
});
