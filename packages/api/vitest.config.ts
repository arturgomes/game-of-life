import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup/teardown
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      // Coverage thresholds (adjusted for current state)
      thresholds: {
        lines: 75,
        functions: 85,
        branches: 75,
        statements: 75,
      },

      // Files to include in coverage
      include: ['src/**/*.ts'],

      // Files to exclude from coverage
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/index.ts', // Entry point, hard to test
        'src/config/**', // Configuration files
        'src/models/**', // Mongoose models (tested via integration)
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'test/**',
      ],

      // Exclude lines from coverage
      excludeAfterRemap: true,

      // Show uncovered lines in output
      all: true,

      // Clean coverage before each run
      clean: true,
    },

    // Test file patterns
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],

    // Timeout for tests (integration tests may be slower)
    testTimeout: 10000,

    // Setup files (if needed)
    // setupFiles: ['./test/setup.ts'],

    // Reporters
    reporters: ['verbose'],

    // Pool options for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
});
