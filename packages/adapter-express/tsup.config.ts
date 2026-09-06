import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: !process.argv.includes('--watch'),
  sourcemap: true,
  external: ['express', '@lite-toon/core', '@lite-toon/toon', '@lite-toon/auth', '@lite-toon/adapter-next'],
});
