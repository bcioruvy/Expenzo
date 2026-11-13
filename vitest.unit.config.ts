import { defineConfig } from 'vitest/config';

// Plain unit tests for pure utility functions — no emulator, no browser. Kept separate
// from vitest.rules.config.ts (which needs the Firestore emulator running) so this suite
// can run instantly on its own.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
