import { defineConfig } from 'vitest/config';

// Separate, minimal Vitest config for the Firestore security-rules tests.
// Deliberately does not reuse vite.config.ts: that config loads the React/PWA
// plugins meant for the browser app bundle, which the rules tests (plain
// Node.js talking to the Firestore emulator) don't need and shouldn't pull in.
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
