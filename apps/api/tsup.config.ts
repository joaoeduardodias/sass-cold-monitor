import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ['@cold-monitor/env', '@cold-monitor/auth'],
  external: ['@prisma/client', '.prisma/client'],
})
