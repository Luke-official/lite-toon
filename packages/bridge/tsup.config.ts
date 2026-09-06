import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/toon.ts', 'src/next.ts', 'src/hono.ts', 'src/express.ts', 'src/fastify.ts', 'src/stdio.ts', 'src/vercel.ts'],
  format: ['esm'],
  dts: true,
  clean: !process.argv.includes('--watch'),
  sourcemap: true,
  external: [
    '@lite-toon/core',
    '@lite-toon/toon',
    '@lite-toon/auth',
    '@lite-toon/adapter-next',
    '@lite-toon/adapter-hono',
    '@lite-toon/adapter-express',
    '@lite-toon/adapter-fastify',
    '@lite-toon/adapter-stdio',
  ],
});
