import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: !process.argv.includes('--watch'),
  sourcemap: true,
  external: ['@lite-toon/core', '@lite-toon/adapter-next'],
});
