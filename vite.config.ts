import { defineConfig, type UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import angular from '@analogjs/vite-plugin-angular';
import path from 'node:path';

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig;
}

export default defineConfig({
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, './tsconfig.json'),
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/test/**', '**/*.d.ts'],
    },
  },
} as VitestConfigExport);
