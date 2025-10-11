// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
    include: ["react", "react-dom", "react-router-dom", "react-hook-form"]
  },
  esbuild: {
    target: "es2020",
    logLevel: "error",
    keepNames: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
            return "react-vendor";
          }
          if (id.includes("recharts") || id.includes("chart")) {
            return "chart-vendor";
          }
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n-vendor";
          }
          if (id.includes("react-hook-form") || id.includes("zod")) {
            return "form-vendor";
          }
          if (id.includes("three") || id.includes("@react-three/fiber") || id.includes("ogl")) {
            return "three-vendor";
          }
          if (id.includes("@supabase") || id.includes("supabase")) {
            return "supabase-vendor";
          }
          if (id.includes("lucide-react") || id.includes("clsx") || id.includes("tailwind")) {
            return "ui-vendor";
          }
          if (id.includes("@tanstack") || id.includes("react-query")) {
            return "query-vendor";
          }
          if (id.includes("date-fns")) {
            return "date-vendor";
          }
          if (id.includes("uuid") || id.includes("isomorphic-dompurify")) {
            return "utils-vendor";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/\.(js)$/.test(assetInfo.name)) {
            return `assets/js/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
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
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https://qbskidyauxehvswgckrv.supabase.co https://api.exchangerate-api.com https://api.fixer.io https://v6.exchangerate-api.com https://api.exchangeratesapi.io; img-src 'self' data: blob: https:; font-src 'self' data:;"
    }
  },
  define: {
    global: "globalThis"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbScsICdyZWFjdC1ob29rLWZvcm0nXVxuICB9LFxuICBlc2J1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICBsb2dMZXZlbDogJ2Vycm9yJyxcbiAgICBrZWVwTmFtZXM6IHRydWVcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgIC8vIFJlYWN0IGFuZCBjb3JlIGxpYnJhcmllc1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3JlYWN0LXZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIENoYXJ0cyBhbmQgdmlzdWFsaXphdGlvblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSB8fCBpZC5pbmNsdWRlcygnY2hhcnQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdjaGFydC12ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBJbnRlcm5hdGlvbmFsaXphdGlvblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnaTE4bmV4dCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1pMThuZXh0JykpIHtcbiAgICAgICAgICAgIHJldHVybiAnaTE4bi12ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBGb3JtcyBhbmQgdmFsaWRhdGlvblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtaG9vay1mb3JtJykgfHwgaWQuaW5jbHVkZXMoJ3pvZCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Zvcm0tdmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gM0QgbGlicmFyaWVzXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd0aHJlZScpIHx8IGlkLmluY2x1ZGVzKCdAcmVhY3QtdGhyZWUvZmliZXInKSB8fCBpZC5pbmNsdWRlcygnb2dsJykpIHtcbiAgICAgICAgICAgIHJldHVybiAndGhyZWUtdmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gU3VwYWJhc2VcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BzdXBhYmFzZScpIHx8IGlkLmluY2x1ZGVzKCdzdXBhYmFzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3N1cGFiYXNlLXZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFVJIGxpYnJhcmllc1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ2Nsc3gnKSB8fCBpZC5pbmNsdWRlcygndGFpbHdpbmQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBRdWVyeSBhbmQgc3RhdGUgbWFuYWdlbWVudFxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXF1ZXJ5JykpIHtcbiAgICAgICAgICAgIHJldHVybiAncXVlcnktdmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRGF0ZSB1dGlsaXRpZXNcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2RhdGUtZm5zJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnZGF0ZS12ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBMYXJnZSB1dGlsaXR5IGxpYnJhcmllc1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygndXVpZCcpIHx8IGlkLmluY2x1ZGVzKCdpc29tb3JwaGljLWRvbXB1cmlmeScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3V0aWxzLXZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIElmIGl0J3MgYSBsYXJnZSBub2RlX21vZHVsZXMgcGFja2FnZSwgcHV0IGl0IGluIHZlbmRvclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0SW5mby5uYW1lLnNwbGl0KCcuJyk7XG4gICAgICAgICAgY29uc3QgZXh0ID0gaW5mb1tpbmZvLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGlmICgvXFwuKGNzcykkLy50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvY3NzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL1xcLihqcykkLy50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBhc3NldHMvanMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBgYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcydcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsXG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2VcbiAgICB9LFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6IFwiZGVmYXVsdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIGRhdGE6IGJsb2I6OyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly9xYnNraWR5YXV4ZWh2c3dnY2tydi5zdXBhYmFzZS5jbyBodHRwczovL2FwaS5leGNoYW5nZXJhdGUtYXBpLmNvbSBodHRwczovL2FwaS5maXhlci5pbyBodHRwczovL3Y2LmV4Y2hhbmdlcmF0ZS1hcGkuY29tIGh0dHBzOi8vYXBpLmV4Y2hhbmdlcmF0ZXNhcGkuaW87IGltZy1zcmMgJ3NlbGYnIGRhdGE6IGJsb2I6IGh0dHBzOjsgZm9udC1zcmMgJ3NlbGYnIGRhdGE6O1wiXG4gICAgfVxuICB9LFxuICBkZWZpbmU6IHtcbiAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJ1xuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxJQUN4QixTQUFTLENBQUMsU0FBUyxhQUFhLG9CQUFvQixpQkFBaUI7QUFBQSxFQUN2RTtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsVUFBVTtBQUFBLElBQ1YsV0FBVztBQUFBLEVBQ2I7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxJQUNYLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWMsQ0FBQyxPQUFPO0FBRXBCLGNBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDbkYsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxPQUFPLEdBQUc7QUFDbkQsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDMUQsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsaUJBQWlCLEtBQUssR0FBRyxTQUFTLEtBQUssR0FBRztBQUN4RCxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLG9CQUFvQixLQUFLLEdBQUcsU0FBUyxLQUFLLEdBQUc7QUFDbkYsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxVQUFVLEdBQUc7QUFDdkQsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsY0FBYyxLQUFLLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLFVBQVUsR0FBRztBQUNqRixtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGFBQWEsR0FBRztBQUMxRCxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxVQUFVLEdBQUc7QUFDM0IsbUJBQU87QUFBQSxVQUNUO0FBRUEsY0FBSSxHQUFHLFNBQVMsTUFBTSxLQUFLLEdBQUcsU0FBUyxzQkFBc0IsR0FBRztBQUM5RCxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLFFBQ0EsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixnQkFBTSxPQUFPLFVBQVUsS0FBSyxNQUFNLEdBQUc7QUFDckMsZ0JBQU0sTUFBTSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQ2hDLGNBQUksV0FBVyxLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQ25DLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksVUFBVSxLQUFLLFVBQVUsSUFBSSxHQUFHO0FBQ2xDLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLDJCQUEyQjtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
