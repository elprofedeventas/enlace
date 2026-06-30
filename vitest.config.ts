import { defineConfig } from 'vitest/config';

// ENLACE - los tests de reglas corren contra el emulador de Firestore (Java).
// Se ejecutan con: pnpm test:rules  (firebase emulators:exec).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
