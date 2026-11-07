import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'public/comic-pages',
      'comic-pages',
      '*.d.ts',
      '*.tsbuildinfo',
      '.agents',
      '.husky',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.ts'],
    rules: {
      // TypeScript rules for Angular project
    },
  },
]);
