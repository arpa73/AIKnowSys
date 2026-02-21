/**
 * Type definitions for AIKnowSys context storage
 * Used by storage adapters for plan/session/search metadata
 */

/**
 * Plan metadata extracted from PLAN_*.md and active-*.md files
 */
export interface PlanMetadata {
  /** Plan identifier (filename without extension) */
  id: string;

  /** Project identifier (for cross-repository support) */
  projectId?: string;

  /** Plan title (extracted from # heading or frontmatter) */
  title: string;

  /** Current status of the plan */
  status: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';

  /** Plan author/owner (from active-*.md filename or frontmatter) */
  author: string;

  /** Creation timestamp (ISO 8601 format) */
  created: string;

  /** Last update timestamp (ISO 8601 format) */
  updated: string;

  /** Optional topics/tags for categorization */
  topics?: string[];

  /** Optional description/summary */
  description?: string;

  /** Source file path (relative to .aiknowsys/) */
  file: string;
}

/**
 * Session metadata extracted from sessions/*.md files
 */
export interface SessionMetadata {
  /** Session identifier (from database - Phase 1) */
  id?: string;

  /** Session date (YYYY-MM-DD format) */
  date: string;

  /** Project identifier (for cross-repository support) */
  projectId?: string;

  /** Session topic/title */
  topic: string;

  /** Optional topics/tags for categorization (v0.10.0+) */
  topics?: string[];

  /** Related plan ID (if any) */
  plan?: string;

  /** Session duration (if recorded) */
  duration?: string;

  /** Session phase/milestone markers */
  phases?: string[];

  /** Source file path (relative to .aiknowsys/) */
  file: string;

  /** Creation timestamp (ISO 8601 format) */
  created: string;

  /** Last update timestamp (ISO 8601 format) */
  updated: string;
}

/**
 * Search result from full-text context search
 */
export interface SearchResult {
  /** Source file containing the match */
  file: string;

  /** Line number of the match (1-indexed) */
  line: number;

  /** Context snippet showing the match */
  context: string;

  /** Relevance score (0-100, higher = more relevant) */
  relevance: number;

  /** Type of content (plan, session, learned, essentials) */
  type: 'plan' | 'session' | 'learned' | 'essentials';
}

/**
 * Storage adapter query filters for plans (Phase 1: Cross-Repository)
 */
export interface PlanFilters {
  /** Filter by plan status */
  status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';

  /** Filter by author */
  author?: string;

  /** Filter by topic (fuzzy match) */
  topic?: string;

  /** Filter by date range (plans updated after this date) */
  updatedAfter?: string;

  /** Filter by date range (plans updated before this date) */
  updatedBefore?: string;

  /** Filter by specific project ID (Phase 1: Cross-Repository) */
  projectId?: string;

  /** Query across all projects (default: false - current project only) */
  allProjects?: boolean;
}

/**
 * Storage adapter query filters for sessions (Phase 1: Cross-Repository)
 */
export interface SessionFilters {
  /** Filter by date (exact match YYYY-MM-DD) */
  date?: string;

  /** Filter by date range (sessions after this date) */
  dateAfter?: string;

  /** Filter by date range (sessions before this date) */
  dateBefore?: string;

  /** Filter by last N days */
  days?: number;

  /** Filter by topic (fuzzy match) */
  topic?: string;

  /** Filter by related plan */
  plan?: string;

  /** Filter by specific project ID (Phase 1: Cross-Repository) */
  projectId?: string;

  /** Query across all projects (default: false - current project only) */
  allProjects?: boolean;
}

/**
 * Storage adapter search scope
 */
export type SearchScope = 'all' | 'plans' | 'sessions' | 'learned' | 'essentials';

/**
 * Project invariant (critical rule for AI agents)
 */
export interface Invariant {
  /** Unique identifier (e.g., 'invariant-1') */
  id: string;

  /** Rule number for ordering */
  number: number;

  /** Human-readable name */
  name: string;

  /** The core rule text */
  rule: string;

  /** Detailed instructions or exceptions */
  details: string[];

  /** Creation timestamp */
  created_at: string;

  /** Update timestamp */
  updated_at: string;
}
