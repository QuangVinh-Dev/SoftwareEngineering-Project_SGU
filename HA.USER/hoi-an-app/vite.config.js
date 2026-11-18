import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
      '/poi-images': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
});
