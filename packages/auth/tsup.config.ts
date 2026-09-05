import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/store-redis.ts'],
  format: ['esm'],
  dts: true,
  clean: !process.argv.includes('--watch'),
  sourcemap: true,
});
