/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { withCrapTypescriptVitest } from "@barney-media/crap-typescript-vitest";

export default withCrapTypescriptVitest({
  base: "/",
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      enabled: true,
      exclude: ['src/api/generated/**', '**/*.test.ts', '**/*.test.tsx']
    }
  },
  server: {
    proxy: {
      '/api': 'https://msa26-peer-review.fh-wedel.dev',
    }
  }
}, {
  threshold: 30.0,
  format: 'toon',
  agent: true,
  excludes: ["src/api/generated/**"]
});
