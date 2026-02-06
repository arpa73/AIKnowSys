import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.{ts,js}'],  // Exclude .cjs (node:test files)
    exclude: ['**/node_modules/**', '**/dist/**', 'test/types/**'],  // Exclude type-only tests
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'node_modules/', 'test/']
    }
  }
});
