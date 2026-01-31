/**
 * Shared constants and utilities for quality checkers
 */

/**
 * Default patterns to exclude from quality checks
 * Used by template-validator, link-validator, and pattern-scanner
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'templates',
  '.aiknowsys/archive'
];
