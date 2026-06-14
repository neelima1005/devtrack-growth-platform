import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Force Vite server restart/reload
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
