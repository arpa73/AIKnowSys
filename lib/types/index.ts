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
  full?: boolean;
  _testMode?: boolean;
  _preCommit?: boolean;
}

export interface DeliverableValidationResult extends ValidationResult {
  fixed?: string[];
  fix?: string;
  error?: string;
}

export interface MigrateToSqliteOptions {
  dir: string;
  dbPath: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface MigrationStats {
  found: number;
  migrated: number;
  errors: number;
}

export interface MigrateToSqliteResult {
  sessions: MigrationStats;
  plans: MigrationStats;
  learned: MigrationStats;
  dbPath?: string;
}

// SQLite Query types (Phase 1 Week 2)
export interface QuerySessionsOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  status?: string;
  includeContent?: boolean; // Default: false (metadata only for token efficiency)
}

export interface QueryPlansOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  priority?: 'high' | 'medium' | 'low';
  includeContent?: boolean; // Default: false (metadata only for token efficiency)
}

export interface QueryLearnedPatternsOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  category?: string;
  keywords?: string[];
  includeContent?: boolean; // Default: false (metadata only for token efficiency)
}

export interface SearchContextOptions {
  dbPath: string;
  query: string;
  limit?: number;
}

export interface DbStatsOptions {
  dbPath: string;
}

export interface SessionRecord {
  date: string;
  title: string;
  goal?: string;
  status?: string;
  topics: string[];
  content: string;
  created_at: string;
  updated_at?: string;
}

// Metadata-only (no content) - for token-efficient browsing
export interface SessionMetadata {
  date: string;
  title: string;
  goal?: string;
  status?: string;
  topics: string[];
  created_at: string;
  updated_at?: string;
}

export interface PlanRecord {
  id: string;
  title: string;
  status: string;
  author?: string;
  priority?: string;
  type?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Metadata-only (no content) - for token-efficient browsing
export interface PlanMetadata {
  id: string;
  title: string;
  status: string;
  author?: string;
  priority?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnedPatternRecord {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  created_at: string;
}

// Metadata-only (no content) - for token-efficient browsing
export interface LearnedPatternMetadata {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  created_at: string;
}

export interface SearchResult {
  type: 'session' | 'plan' | 'learned';
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export interface QuerySessionsResult {
  count: number;
  sessions: SessionRecord[] | SessionMetadata[];
}

export interface QueryPlansResult {
  count: number;
  plans: PlanRecord[] | PlanMetadata[];
}

export interface QueryLearnedPatternsResult {
  count: number;
  patterns: LearnedPatternRecord[] | LearnedPatternMetadata[];
}

export interface SearchContextResult {
  count: number;
  results: SearchResult[];
  query: string;
}

export interface DbStatsResult {
  sessions: number;
  plans: number;
  learned: number;
  total: number;
  dbSize: number;
  dbPath: string;
}
