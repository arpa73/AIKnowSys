// Type compilation tests for core domain types
// These tests verify that types compile correctly and catch type errors

import type {
  ValidationResult,
  ValidationCheck,
  TemplateFile,
  TemplateMapping,
  ValidationPattern,
  PlanFile,
  SessionEntry,
  CommandOptions,
  InitOptions,
  QualityCheckResult,
} from '../../lib/types/index.js';

// Test ValidationResult
const validResult: ValidationResult = {
  passed: true,
  checks: [],
  summary: 'All checks passed',
  exitCode: 0,
};

const validResultWithMetrics: ValidationResult = {
  passed: true,
  checks: [],
  summary: 'All checks passed',
  exitCode: 0,
  metrics: {
    templatesChecked: 10,
    patternsValidated: 25,
    duration: 123,
  },
};

// Test ValidationCheck
const validCheck: ValidationCheck = {
  name: 'template-placeholders',
  passed: true,
  issues: [],
};

const failedCheck: ValidationCheck = {
  name: 'forbidden-patterns',
  passed: false,
  issues: ['Found TODO in file.md', 'Found FIXME in other.md'],
};

// Test TemplateFile
const templateFile: TemplateFile = {
  path: 'templates/README.md',
  content: '# {{PROJECT_NAME}}',
  placeholders: ['{{PROJECT_NAME}}', '{{DESCRIPTION}}'],
  requiredPlaceholders: ['{{PROJECT_NAME}}'],
  forbiddenPatterns: ['example.com', 'TODO:'],
};

// Test TemplateMapping
const templateMapping: TemplateMapping = {
  template: 'templates/AGENTS.md',
  nonTemplates: ['AGENTS.md', '.github/AGENTS.md'],
};

// Test ValidationPattern
const validationPattern: ValidationPattern = {
  legacy: '{{ VAR }}',
  correct: '{{VAR}}',
  context: 'No spaces in placeholders',
  files: ['templates/README.md', 'templates/SETUP.md'],
};

// Test PlanFile
const planFile: PlanFile = {
  path: '.aiknowsys/PLAN_feature.md',
  status: 'ACTIVE',
  developer: 'arno-paffen',
  title: 'Feature Implementation',
  created: new Date('2024-01-15'),
  updated: new Date('2024-01-20'),
};

// Test all PlanFile statuses (type assertions to verify all values are valid)
const _statusTests: PlanFile['status'][] = ['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED'];

// Test SessionEntry
const sessionEntry: SessionEntry = {
  timestamp: new Date(),
  type: 'implementation',
  title: 'Implement logger module',
  status: 'IN_PROGRESS',
  notes: ['Added winston logger', 'Configured log rotation'],
};

// Test all SessionEntry types (type assertions to verify all values are valid)
const _typeTests: SessionEntry['type'][] = ['planning', 'implementation', 'review', 'testing'];

// Test CommandOptions
const commandOptions: CommandOptions = {
  _silent: true,
  full: false,
  fix: true,
  metrics: true,
  customFlag: 'value',
};

// Test InitOptions
const initOptions: InitOptions = {
  force: true,
  template: 'nodejs-express',
  yes: false,
};

// Test QualityCheckResult
const qualityCheckResult: QualityCheckResult = {
  passed: true,
  checks: [
    { name: 'eslint', passed: true },
    { name: 'type-check', passed: true, details: 'No errors found' },
  ],
  timestamp: new Date(),
};

// Type narrowing tests
function processValidationResult(result: ValidationResult): void {
  if (result.metrics) {
    // metrics is defined here
    console.log(`Checked ${result.metrics.templatesChecked} templates`);
  }
}

// Optional property tests
const minimalInitOptions: InitOptions = {};
const minimalCommandOptions: CommandOptions = {};

// Export to prevent "unused" errors (these are type tests, not runtime tests)
export {
  validResult,
  validResultWithMetrics,
  validCheck,
  failedCheck,
  templateFile,
  templateMapping,
  validationPattern,
  planFile,
  sessionEntry,
  commandOptions,
  initOptions,
  qualityCheckResult,
  processValidationResult,
  minimalInitOptions,
  minimalCommandOptions,
  _statusTests,
  _typeTests,
};
