// Type compilation tests for template schemas
// These tests verify that schema types compile correctly

import type { TemplateFile } from '../../lib/types/index.js';
import {
  TEMPLATE_SCHEMA,
  LEGACY_PATTERNS,
  VALIDATION_RULES,
} from '../../lib/types/schemas.js';

// Test TEMPLATE_SCHEMA structure
const readmeSchema: Partial<TemplateFile> = TEMPLATE_SCHEMA['README.md'];
const agentsSchema: Partial<TemplateFile> = TEMPLATE_SCHEMA['AGENTS.md'];

// Test that schemas have expected properties
function validateSchema(schema: Partial<TemplateFile>): void {
  if (schema.requiredPlaceholders) {
    console.log(`Required placeholders: ${schema.requiredPlaceholders.length}`);
  }
  if (schema.forbiddenPatterns) {
    console.log(`Forbidden patterns: ${schema.forbiddenPatterns.length}`);
  }
}

// Test LEGACY_PATTERNS structure
const doubleCurlyPattern = LEGACY_PATTERNS['double-curly-vars'];
const singleCurlyPattern = LEGACY_PATTERNS['single-curly-vars'];

// Test pattern structure
function validatePattern(pattern: { legacy: string; correct: string; context: string }): void {
  console.log(`${pattern.legacy} → ${pattern.correct} (${pattern.context})`);
}

// Test VALIDATION_RULES
const maxLength: number = VALIDATION_RULES.maxPlaceholderLength;
const minLength: number = VALIDATION_RULES.minPlaceholderLength;
const allowedChars: RegExp = VALIDATION_RULES.allowedPlaceholderChars;
const forbidden: readonly string[] = VALIDATION_RULES.forbiddenWords;

// Test schema iteration
function getAllSchemas(): Array<[string, Partial<TemplateFile>]> {
  return Object.entries(TEMPLATE_SCHEMA);
}

// Test pattern iteration
function getAllPatterns(): Array<[string, { legacy: string; correct: string; context: string }]> {
  return Object.entries(LEGACY_PATTERNS);
}

// Export to prevent "unused" errors
export {
  readmeSchema,
  agentsSchema,
  validateSchema,
  doubleCurlyPattern,
  singleCurlyPattern,
  validatePattern,
  maxLength,
  minLength,
  allowedChars,
  forbidden,
  getAllSchemas,
  getAllPatterns,
};
