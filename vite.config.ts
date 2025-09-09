import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from the decks folder
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // UI libraries
          'ui-vendor': ['lucide-react'],
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild', // Use esbuild instead of terser
  },
});
