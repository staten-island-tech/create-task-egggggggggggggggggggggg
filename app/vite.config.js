import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      buffer: 'buffer', // Ensure the buffer module is resolved correctly
    },
  },
});
