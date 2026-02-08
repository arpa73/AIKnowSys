import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      // Error prevention
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'  // Ignore catch block errors prefixed with _
      }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      
      // Code quality
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      
      // Style (relaxed - formatting handled by editor)
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      
      // Allow console in CLI tool
      'no-console': 'off'
    }
  },
  {
    // TypeScript files
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Disable base rules that are covered by TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-undef': 'off',  // TypeScript compiler checks undefined variables
      
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn'
    }
  },
  {
    // Test files - more relaxed rules
    files: ['test/**/*.js', 'test/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'  // Tests often have unused variables for readability
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',  // TypeScript build output
      'test/tmp/**',
      'test/fixtures/**',
      'templates/**',
      'examples/**',
      'docs/**',
      'mcp-server/**'  // Separate subproject with own tsconfig
    ]
  }
];
