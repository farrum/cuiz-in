import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mcpPlugin(),
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
      "@": path.resolve(__dirname, "./src"),
    },
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
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Minification settings
    minify: 'esbuild',
    // Source maps for production debugging (optional)
    sourcemap: false,
  },
  // Build stamp sent to the backend as x-app-version so we can tell which
  // build produced a given request (legacy clients send no header at all).
  define: {
    __APP_BUILD_ID__: JSON.stringify(
      new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    ),
  },
}));
