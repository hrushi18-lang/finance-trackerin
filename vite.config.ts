import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', 'react-hook-form']
  },
  esbuild: {
    target: 'es2020',
    logLevel: 'error',
    keepNames: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          'form-vendor': ['react-hook-form'],
          'three-vendor': ['three', '@react-three/fiber', 'ogl'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false
    },
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https://qbskidyauxehvswgckrv.supabase.co https://api.exchangerate-api.com https://api.fixer.io https://v6.exchangerate-api.com https://api.exchangeratesapi.io; img-src 'self' data: blob: https:; font-src 'self' data:;"
    }
  },
  define: {
    global: 'globalThis'
  }
});