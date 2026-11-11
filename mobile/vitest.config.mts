import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for pure logic only (no React Native runtime needed).
export default defineConfig({
  resolve: {
    alias: [
      { find: /^~\/(.*)$/, replacement: fileURLToPath(new URL('./src/$1', import.meta.url)) },
      { find: /^@\/(.*)$/, replacement: fileURLToPath(new URL('../src/$1', import.meta.url)) },
    ],
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
