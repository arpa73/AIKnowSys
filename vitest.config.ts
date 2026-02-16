import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.{ts,js}'],  // Exclude .cjs (node:test files)
    exclude: ['**/node_modules/**', '**/dist/**', 'test/types/**'],  // Exclude type-only tests
    setupFiles: ['./vitest.setup.ts'],
    cache: false,  // Disable caching to avoid stale module issues
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'node_modules/', 'test/']
    },
    projects: [
      {
        test: {
          name: 'source-tests',
          globals: true,
          environment: 'node',
          include: ['test/**/*.test.{ts,js}'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'test/types/**',
            // Tests that require built artifacts (dist/)
            'test/events/event-embedding-storage.test.ts',
            'test/embeddings/semantic-search.test.ts'
          ],
          setupFiles: ['./vitest.setup.ts'],
          cache: false
        }
      },
      {
        test: {
          name: 'post-build-tests',
          globals: true,
          environment: 'node',
          include: [
            // Tests that import from dist/ (require build first)
            'test/events/event-embedding-storage.test.ts',
            'test/embeddings/semantic-search.test.ts'
          ],
          setupFiles: ['./vitest.setup.ts'],
          cache: false
        }
      }
    ]
  }
});
