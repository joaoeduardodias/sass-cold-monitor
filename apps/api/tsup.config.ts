import { defineConfig } from 'tsup'
export default defineConfig({
  entry: ['src/http/server.ts'], // ou src/http/server.ts
  format: ['cjs'],
  sourcemap: true,
  clean: true,
  splitting: false,
  noExternal: ['@cold-monitor/env', '@cold-monitor/auth'],
})
