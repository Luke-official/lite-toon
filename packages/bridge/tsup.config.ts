import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/toon.ts', 'src/next.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@lite-toon/core',
    '@lite-toon/toon',
    '@lite-toon/auth',
    '@lite-toon/adapter-next',
  ],
});
