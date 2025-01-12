import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process', // Ensure the 'process' package is resolved correctly
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  define: {
    global: 'window', // Polyfill for global object
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream-browserify', 'util'],
  },
  build: {
    rollupOptions: {
      external: ['buffer'],
    },
  },
});
