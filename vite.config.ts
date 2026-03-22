import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              id.includes(`${path.sep}react${path.sep}`)
            ) {
              return 'react-vendor';
            }

            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }

            if (id.includes('lucide-react')) {
              return 'icon-vendor';
            }

            if (id.includes('html-to-image')) {
              return 'image-vendor';
            }
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify; file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
});
