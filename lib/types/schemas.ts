// Template validation schemas for AIKnowSys

import { TemplateFile } from './index.js';

export const TEMPLATE_SCHEMA: Record<string, Partial<TemplateFile>> = {
  'CODEBASE_ESSENTIALS.md': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
      '{{TECH_STACK}}',
      '{{REPO_STRUCTURE}}',
    ],
    forbiddenPatterns: [
      'example.com',
      'TODO:',
      'FIXME:',
      '/path/to/',
    ],
  },

  'AGENTS.md': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
    ],
    forbiddenPatterns: [
      'example.com',
      '/path/to/',
    ],
  },

  'README.md': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
      '{{PROJECT_DESCRIPTION}}',
    ],
    forbiddenPatterns: [
      'example.com',
      '/path/to/',
    ],
  },

  'package.json': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
      '{{PROJECT_DESCRIPTION}}',
      '{{REPO_URL}}',
    ],
    forbiddenPatterns: [
      'example-project',
      'https://github.com/example/',
    ],
  },

  'SETUP_GUIDE.md': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
    ],
    forbiddenPatterns: [
      'example.com',
      '/path/to/',
    ],
  },

  'CONTRIBUTING.md': {
    requiredPlaceholders: [
      '{{PROJECT_NAME}}',
      '{{REPO_URL}}',
    ],
    forbiddenPatterns: [
      'example.com',
      '/path/to/',
    ],
  },
};

export const LEGACY_PATTERNS: Record<string, { legacy: string; correct: string; context: string }> = {
  'double-curly-vars': {
    legacy: '{{ VARIABLE }}',
    correct: '{{VARIABLE}}',
    context: 'Template variables should use no spaces',
  },

  'single-curly-vars': {
    legacy: '{VARIABLE}',
    correct: '{{VARIABLE}}',
    context: 'Template variables should use double curly braces',
  },

  'percent-vars': {
    legacy: '%VARIABLE%',
    correct: '{{VARIABLE}}',
    context: 'Template variables should use double curly braces',
  },

  'dollar-vars': {
    legacy: '$VARIABLE',
    correct: '{{VARIABLE}}',
    context: 'Template variables should use double curly braces',
  },
};

export const VALIDATION_RULES = {
  maxPlaceholderLength: 50,
  minPlaceholderLength: 3,
  allowedPlaceholderChars: /^[A-Z0-9_]+$/,
  forbiddenWords: ['password', 'secret', 'token', 'key'] as const,
};
