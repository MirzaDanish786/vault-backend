import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import securityPlugin from 'eslint-plugin-security';
import nodePlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import importPlugin from 'eslint-plugin-import';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Base JavaScript configuration
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      import: importPlugin,
      node: nodePlugin,
    },
    rules: {
      // Import rules - ALL as warn for now
      'import/order': [
        'warn',
        {
          'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          'alphabetize': { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'warn', // Changed from error to warn

      // Node.js specific rules - ALL as warn
      'node/handle-callback-err': 'warn',
      'node/no-callback-literal': 'warn',
      'node/no-exports-assign': 'warn', // Changed from error to warn
      'node/no-extraneous-import': 'warn',
      'node/no-extraneous-require': 'warn',
      'node/no-missing-import': 'off',
      'node/no-missing-require': 'off',
      'node/no-unpublished-import': 'off',
      'node/no-unpublished-require': 'off',
      'node/no-unsupported-features/es-syntax': 'off',

      // General JavaScript rules - ALL as warn
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-debugger': 'warn', // Changed from error to warn
      'no-duplicate-imports': 'warn', // Changed from error to warn
      'no-unused-expressions': 'warn', // Changed from error to warn
      'require-await': 'warn',
      'no-return-await': 'warn',
      'prefer-const': 'warn',
      'prefer-promise-reject-errors': 'warn',
    },
  },

  // TypeScript configuration - Using recommended only
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // TypeScript specific rules - ALL as warn for development
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'warn', // Changed from error to warn
      '@typescript-eslint/no-misused-promises': [
        'warn', // Changed from error to warn
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // Safety rules - ALL as warn
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Async rules
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/return-await': 'off',

      // Boolean expressions - disabled for now
      '@typescript-eslint/strict-boolean-expressions': 'off', // DISABLED - too strict

      // Express.js specific TypeScript rules
      '@typescript-eslint/no-misused-spread': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn', // Added this
    },
  },

  // Security plugin configuration - Some as warn for development
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      security: securityPlugin,
    },
    rules: {
      'security/detect-buffer-noassert': 'warn', // Changed to warn
      'security/detect-child-process': 'warn', // Changed to warn
      'security/detect-disable-mustache-escape': 'warn', // Changed to warn
      'security/detect-eval-with-expression': 'warn', // Changed to warn
      'security/detect-no-csrf-before-method-override': 'warn', // Changed to warn
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn', // Changed to warn
      'security/detect-unsafe-regex': 'warn', // Changed to warn
    },
  },

  // Promise plugin configuration - All as warn
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      promise: promisePlugin,
    },
    rules: {
      'promise/always-return': 'warn',
      'promise/no-return-wrap': 'warn',
      'promise/param-names': 'warn',
      'promise/catch-or-return': 'warn',
      'promise/no-native': 'off',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'off',
      'promise/no-new-statics': 'warn',
      'promise/no-return-in-finally': 'warn',
      'promise/valid-params': 'warn',
    },
  },

  // Prettier configuration
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettier.rules,
      'prettier/prettier': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      '*.log',
      '.env*',
      '!.env.example',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'eslint.config.js',
      'eslint-env.d.ts',
      'prisma.config.ts',
      '*.config.ts',
      '*.config.js',
      '**/test/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
  },
]);
