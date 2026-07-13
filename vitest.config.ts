import { defineConfig } from 'vitest/config';

// Vitest cubre la lógica pura de src/core (sin dependencias de React Native).
// Los tests de componentes RN se incorporarán con jest-expo cuando la
// complejidad de UI lo justifique (docs/13-testing-and-qa.md).
export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts'],
    environment: 'node',
  },
});
