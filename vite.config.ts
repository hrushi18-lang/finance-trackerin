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
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and core libraries
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // Charts and visualization
          if (id.includes('recharts') || id.includes('chart')) {
            return 'chart-vendor';
          }
          // Internationalization
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }
          // Forms and validation
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'form-vendor';
          }
          // 3D libraries
          if (id.includes('three') || id.includes('@react-three/fiber') || id.includes('ogl')) {
            return 'three-vendor';
          }
          // Supabase
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'supabase-vendor';
          }
          // UI libraries
          if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind')) {
            return 'ui-vendor';
          }
          // Query and state management
          if (id.includes('@tanstack') || id.includes('react-query')) {
            return 'query-vendor';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          // Large utility libraries
          if (id.includes('uuid') || id.includes('isomorphic-dompurify')) {
            return 'utils-vendor';
          }
          // If it's a large node_modules package, put it in vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(js)$/.test(assetInfo.name)) {
            return `assets/js/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
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