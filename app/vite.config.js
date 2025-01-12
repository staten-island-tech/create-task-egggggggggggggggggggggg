import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Alias to ensure `buffer` is resolved correctly
      buffer: 'buffer',
      // Add other Node.js polyfills if needed
      process: 'process/browser',
      stream: 'stream-browserify',  // Add this if you're using 'stream' in any package
      util: 'util', // Polyfill for util module
    },
  },
  define: {
    // Polyfill 'global' for the browser environment
    global: 'window',
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream-browserify', 'util'], // Explicitly include necessary modules
  },
  build: {
    rollupOptions: {
      external: ['buffer'], // Ensures 'buffer' doesn't get bundled
    },
  },
});
