import js from '@eslint/js';
import globals from 'globals';

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
    // Test files - more relaxed rules
    files: ['test/**/*.js'],
    rules: {
      'no-unused-vars': 'off'  // Tests often have unused variables for readability
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'test/tmp/**',
      'test/fixtures/**',
      'templates/**',
      'examples/**',
      'docs/**'
    ]
  }
];
