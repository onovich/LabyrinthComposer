import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@labyrinth/core': resolve(rootDir, 'packages/core/src/index.ts'),
      '@labyrinth/editor-ui': resolve(rootDir, 'packages/editor-ui/src/index.ts'),
      '@labyrinth/schema': resolve(rootDir, 'packages/schema/src/index.ts'),
      '@labyrinth/test-fixtures': resolve(rootDir, 'packages/test-fixtures/src/index.ts'),
      '@labyrinth/workbench': resolve(rootDir, 'packages/workbench/src/index.ts')
    }
  },
  test: {
    coverage: {
      reporter: ['text', 'html']
    },
    environment: 'node',
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx'
    ]
  }
});
