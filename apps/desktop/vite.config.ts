import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@xyflow')) {
            return 'flow';
          }

          if (id.includes('lucide-react')) {
            return 'icons';
          }

          if (id.includes('react')) {
            return 'react-vendor';
          }

          return undefined;
        }
      }
    }
  },
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
});
