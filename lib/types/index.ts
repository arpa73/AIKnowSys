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

// AI-Friendly Response Types (v0.11.0+)

export type ErrorType = 
  | 'InvalidParameter'
  | 'ToolNotFound'
  | 'ValidationFailed'
  | 'MissingRequired'
  | 'DatabaseError'
  | 'FileSystemError';

export interface UsageExample {
  description: string;
  example: string;
}

export interface AIFriendlyError {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    parameter?: string;
    suggestion?: string;
    correct_usage?: UsageExample[];
    docs_url?: string;
    similar_errors?: string[];
  };
}

export interface ResponseMeta {
  tokens_used?: number;
  hint?: string;
  alternative?: {
    query: string;
    savings: string;
  };
  cache_status?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export type MCPResponse<T> = SuccessResponse<T> | AIFriendlyError;

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
export type QueryMode = 'preview' | 'metadata' | 'section' | 'full';

export interface QuerySessionsOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  status?: string;
  includeContent?: boolean; // DEPRECATED: Use mode instead
  mode?: QueryMode; // Default: 'metadata' (preview = 150 tokens, metadata = 500, section = 1.2K, full = 22K)
  section?: string; // For mode='section': specific section to extract
}

export interface QueryPlansOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  priority?: 'high' | 'medium' | 'low';
  includeContent?: boolean; // DEPRECATED: Use mode instead
  mode?: QueryMode; // Default: 'metadata' (preview = 150 tokens, metadata = 500, section = 1.2K, full = 22K)
  section?: string; // For mode='section': specific section to extract
}

export interface QueryLearnedPatternsOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  category?: string;
  keywords?: string[];
  includeContent?: boolean; // Default: false (metadata only for token efficiency)
}

export interface SearchContextOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
  query: string;
  limit?: number;
}

export interface DbStatsOptions {
  dbPath?: string; // Optional: Auto-detects knowledge.db if not provided
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

// Preview-only (ultra-lightweight) - for browsing/counting
export interface SessionPreview {
  date: string;
  title: string;
  topics_count: number;
  status?: string;
}

export interface SessionStats {
  count: number;
  earliest?: string;
  latest?: string;
  uniqueTopics: string[];
  statusCounts: Array<{ status: string; count: number }>;
  sessions: SessionPreview[];
}

export interface PlanPreview {
  id: string;
  title: string;
  status: string;
  topics_count: number;
  created_at: string;
}

export interface PlanStats {
  count: number;
  earliestCreated?: string;
  latestUpdated?: string;
  uniqueTopics: string[];
  statusCounts: Array<{ status: string; count: number }>;
  plans: PlanPreview[];
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

// Section-specific types (for mode='section')
export interface SessionSection {
  date: string;
  title: string;
  goal: string;
  status: 'active' | 'paused' | 'complete';
  topics: string[];
  section: string;
  section_content: string;
  section_found: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanSection {
  id: string;
  title: string;
  status: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
  section: string;
  section_content: string;
  section_found: boolean;
  created_at: string;
  updated_at: string;
}

// Mode-specific result types (for function overloads)
export interface SessionsPreviewResult {
  count: number;
  date_range?: string;
  topics: string[];
  status_counts: Array<{ status: string; count: number }>;
  sessions: SessionPreview[];
}

export interface SessionsMetadataResult {
  count: number;
  sessions: SessionMetadata[];
}

export interface SessionsFullResult {
  count: number;
  sessions: SessionRecord[];
}

export interface SessionsSectionResult {
  count: number;
  sessions: SessionSection[];
}

export interface PlansPreviewResult {
  count: number;
  date_range?: string;
  topics: string[];
  status_counts: Array<{ status: string; count: number }>;
  plans: PlanPreview[];
}

export interface PlansMetadataResult {
  count: number;
  plans: PlanMetadata[];
}

export interface PlansFullResult {
  count: number;
  plans: PlanRecord[];
}

export interface PlansSectionResult {
  count: number;
  plans: PlanSection[];
}

// Generic result types (for backward compatibility)
export interface QuerySessionsResult {
  count: number;
  sessions: SessionRecord[] | SessionMetadata[] | SessionPreview[] | SessionSection[];
  date_range?: string;
  topics?: string[];
  status_counts?: Array<{ status: string; count: number }>;
}

export interface QueryPlansResult {
  count: number;
  plans: PlanRecord[] | PlanMetadata[] | PlanPreview[] | PlanSection[];
  date_range?: string;
  topics?: string[];
  status_counts?: Array<{ status: string; count: number }>;
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
