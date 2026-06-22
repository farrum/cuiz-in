// vite.config.ts
import { defineConfig } from "file:///D:/Customers/cuiz.in/CuizIN/cuiz-in/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Customers/cuiz.in/CuizIN/cuiz-in/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///D:/Customers/cuiz.in/CuizIN/cuiz-in/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\Customers\\cuiz.in\\CuizIN\\cuiz-in";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
    // Bundle analyzer - generates stats.html in project root
    /* mode === 'production' && visualizer({
      filename: 'bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }), */
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        /* manualChunks: {
          // Core React vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI library chunk
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
          ],
          // Supabase chunk
          'vendor-supabase': ['@supabase/supabase-js'],
          // Charts chunk (only loaded on pages that need it)
          'vendor-charts': ['recharts'],
          // Form handling chunk
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        }, */
      }
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Minification settings
    minify: "esbuild",
    // Source maps for production debugging (optional)
    sourcemap: false
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxDdXN0b21lcnNcXFxcY3Vpei5pblxcXFxDdWl6SU5cXFxcY3Vpei1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcQ3VzdG9tZXJzXFxcXGN1aXouaW5cXFxcQ3VpeklOXFxcXGN1aXotaW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0N1c3RvbWVycy9jdWl6LmluL0N1aXpJTi9jdWl6LWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgLy8gQnVuZGxlIGFuYWx5emVyIC0gZ2VuZXJhdGVzIHN0YXRzLmh0bWwgaW4gcHJvamVjdCByb290XHJcbiAgICAvKiBtb2RlID09PSAncHJvZHVjdGlvbicgJiYgdmlzdWFsaXplcih7XHJcbiAgICAgIGZpbGVuYW1lOiAnYnVuZGxlLXN0YXRzLmh0bWwnLFxyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgZ3ppcFNpemU6IHRydWUsXHJcbiAgICAgIGJyb3RsaVNpemU6IHRydWUsXHJcbiAgICAgIHRlbXBsYXRlOiAndHJlZW1hcCcsIC8vICdzdW5idXJzdCcsICd0cmVlbWFwJywgJ25ldHdvcmsnXHJcbiAgICB9KSwgKi9cclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gT3B0aW1pemUgY2h1bmtzIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvKiBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIENvcmUgUmVhY3QgdmVuZG9yIGNodW5rXHJcbiAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxyXG4gICAgICAgICAgLy8gVUkgbGlicmFyeSBjaHVua1xyXG4gICAgICAgICAgJ3ZlbmRvci11aSc6IFtcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRhYnMnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvYXN0JyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIFN1cGFiYXNlIGNodW5rXHJcbiAgICAgICAgICAndmVuZG9yLXN1cGFiYXNlJzogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcclxuICAgICAgICAgIC8vIENoYXJ0cyBjaHVuayAob25seSBsb2FkZWQgb24gcGFnZXMgdGhhdCBuZWVkIGl0KVxyXG4gICAgICAgICAgJ3ZlbmRvci1jaGFydHMnOiBbJ3JlY2hhcnRzJ10sXHJcbiAgICAgICAgICAvLyBGb3JtIGhhbmRsaW5nIGNodW5rXHJcbiAgICAgICAgICAndmVuZG9yLWZvcm1zJzogWydyZWFjdC1ob29rLWZvcm0nLCAnQGhvb2tmb3JtL3Jlc29sdmVycycsICd6b2QnXSxcclxuICAgICAgICB9LCAqL1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIEVuYWJsZSBDU1MgY29kZSBzcGxpdHRpbmdcclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXHJcbiAgICAvLyBNaW5pZmljYXRpb24gc2V0dGluZ3NcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgLy8gU291cmNlIG1hcHMgZm9yIHByb2R1Y3Rpb24gZGVidWdnaW5nIChvcHRpb25hbClcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFTLFNBQVMsb0JBQW9CO0FBQ2xVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUzVDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BcUJSO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxjQUFjO0FBQUE7QUFBQSxJQUVkLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsUUFBUTtBQUFBO0FBQUEsSUFFUixXQUFXO0FBQUEsRUFDYjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
