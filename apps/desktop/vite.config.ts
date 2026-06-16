import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
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
  resolve: {
    alias: [
      {
        find: '@labyrinth/editor-ui/styles.css',
        replacement: fileURLToPath(
          new URL('../../packages/editor-ui/src/styles/workbench.css', import.meta.url)
        )
      },
      {
        find: '@labyrinth/core',
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
      },
      {
        find: '@labyrinth/editor-ui',
        replacement: fileURLToPath(
          new URL('../../packages/editor-ui/src/index.ts', import.meta.url)
        )
      },
      {
        find: '@labyrinth/exporters',
        replacement: fileURLToPath(
          new URL('../../packages/exporters/src/index.ts', import.meta.url)
        )
      },
      {
        find: '@labyrinth/rulesets',
        replacement: fileURLToPath(
          new URL('../../packages/rulesets/src/index.ts', import.meta.url)
        )
      },
      {
        find: '@labyrinth/schema',
        replacement: fileURLToPath(new URL('../../packages/schema/src/index.ts', import.meta.url))
      },
      {
        find: '@labyrinth/workbench',
        replacement: fileURLToPath(
          new URL('../../packages/workbench/src/index.ts', import.meta.url)
        )
      }
    ]
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  }
});
