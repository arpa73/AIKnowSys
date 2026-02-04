// Core domain types for AIKnowSys

export interface TemplateFile {
  path: string;
  content: string;
  placeholders: string[];
  requiredPlaceholders: string[];
  forbiddenPatterns: string[];
}

export interface TemplateMapping {
  template: string;
  nonTemplates: string[];
}

export interface ValidationPattern {
  legacy: string;
  correct: string;
  context?: string;
  files: string[];
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  summary: string;
  exitCode: number;
  metrics?: ValidationMetrics;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  issues: string[];
}

export interface ValidationMetrics {
  templatesChecked: number;
  patternsValidated: number;
  duration: number;
}

export interface PlanFile {
  path: string;
  status: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  developer: string;
  title: string;
  created: Date;
  updated: Date;
}

export interface SessionEntry {
  timestamp: Date;
  type: 'planning' | 'implementation' | 'review' | 'testing';
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED';
  notes: string[];
}

export interface CommandOptions {
  _silent?: boolean;
  full?: boolean;
  fix?: boolean;
  metrics?: boolean;
  [key: string]: unknown;
}

export interface InitOptions {
  dir: string;
  _silent?: boolean;
  listStacks?: boolean;
  stack?: string;
  essentials?: string;
  template?: 'full' | 'minimal';
  yes?: boolean;
}

export interface MigrateOptions {
  dir: string;
  essentials?: string;
}

export interface QualityCheckResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    details?: string;
  }>;
  timestamp: Date;
}

// Template schema types (Phase 7: Type-safe schema validation)
export interface TemplateSchema {
  requiredPlaceholders: string[];
  forbiddenPatterns: string[];
  mappedTo: string[];
}

export interface TemplateSchemaMap {
  [templatePath: string]: TemplateSchema;
}

export interface LegacyPattern {
  pattern: RegExp;
  name: string;
}

export interface AutoFixPattern {
  find: RegExp;
  replace: string;
}

export interface DeliverableValidationOptions extends CommandOptions {
  projectRoot?: string;
  _testMode?: boolean;
  _preCommit?: boolean;
}

export interface DeliverableValidationResult extends ValidationResult {
  fixed?: string[];
  fix?: string;
  error?: string;
}
