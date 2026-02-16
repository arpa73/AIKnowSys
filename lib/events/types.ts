/**
 * Event-sourced knowledge storage types
 * Foundation for Phase 2: Event-Sourced Storage
 */

/**
 * Supported event types (enum for runtime usage)
 */
export enum EventType {
  SESSION_STARTED = 'session_started',
  SESSION_COMPLETED = 'session_completed',
  GOAL_DEFINED = 'goal_defined',
  TASK_COMPLETED = 'task_completed',
  DECISION_MADE = 'decision_made',
  PATTERN_DISCOVERED = 'pattern_discovered',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  BUG_ENCOUNTERED = 'bug_encountered',
  BUG_RESOLVED = 'bug_resolved',
  LEARNING_CAPTURED = 'learning_captured',
  FILE_CHANGED = 'file_changed',
  DEPENDENCY_ADDED = 'dependency_added'
}

/**
 * Base knowledge event interface
 * All events extend this structure
 */
export interface KnowledgeEvent {
  /** Unique event identifier */
  eventId: string;
  
  /** Project this event belongs to */
  projectId: string;
  
  /** Session this event was captured in (optional) */
  sessionId?: string;
  
  /** Plan this event relates to (optional) */
  planId?: string;
  
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  
  /** Event type discriminator */
  eventType: EventType;
  
  /** Structured event payload (varies by type) */
  data: EventData;
  
  /** 
   * 384-dimensional embedding vector for semantic search (Phase 2.4)
   * Generated from event content using all-MiniLM-L6-v2 model
   * Stored as BLOB in database, returned as Float32Array in queries
   * @optional Present only if embeddings have been generated
   */
  embedding?: Float32Array | null;
}

/**
 * Event data payloads (discriminated union)
 */
export type EventData =
  | SessionStartedData
  | SessionCompletedData
  | GoalDefinedData
  | TaskCompletedData
  | DecisionMadeData
  | PatternDiscoveredData
  | ValidationPassedData
  | ValidationFailedData
  | BugEncounteredData
  | BugResolvedData
  | LearningCapturedData
  | FileChangedData
  | DependencyAddedData;

// ===== Event Data Schemas =====

export interface SessionStartedData {
  title: string;
  topics: string[];
  goal?: string;
}

export interface SessionCompletedData {
  durationMinutes?: number;
  tasksCompleted: number;
  outcomes: string[];
}

export interface GoalDefinedData {
  goal: string;
  successCriteria?: string[];
}

export interface TaskCompletedData {
  /** Unique task identifier (e.g., JIRA-123, GitHub issue #456) */
  taskId?: string;
  /** Human-readable task description */
  description: string;
  /** Outcome of task */
  outcome: 'success' | 'partial' | 'failed';
  duration?: number;
  filesChanged?: string[];
  testsPassing?: number;
  testsTotal?: number;
  validationCommands?: string[];
}

export interface DecisionMadeData {
  decision: string;
  rationale: string;
  alternatives?: string[];
  alternativesConsidered?: string[];
  impact?: Record<string, string | number>;
  tradeOffs?: {
    pros: string[];
    cons: string[];
  };
}

export interface PatternDiscoveredData {
  pattern: string;
  category: 'error_resolution' | 'best_practice' | 'workaround' | 'optimization' | 'project_specific';
  trigger?: string;
  solution: string;
  reusable: boolean;
  applicability?: string;
}

export interface ValidationPassedData {
  validationType?: string;
  command?: string;
  result: string;
  durationMs?: number;
  coverage?: {
    lines: number;
    branches: number;
  };
}

export interface ValidationFailedData {
  command: string;
  errorMessage: string;
  affectedFiles?: string[];
}

export interface BugEncounteredData {
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stackTrace?: string;
  affectedFiles?: string[];
}

export interface BugResolvedData {
  bugDescription: string;
  rootCause: string;
  fixDescription: string;
  prevention?: string;
  filesChanged?: string[];
}

export interface LearningCapturedData {
  learning: string;
  evidence?: string;
  applicability: 'project_specific' | 'language_specific' | 'universal';
  confidence: 'low' | 'medium' | 'high';
}

export interface FileChangedData {
  filePath: string;
  changeType: 'created' | 'modified' | 'deleted' | 'renamed';
  linesAdded?: number;
  linesDeleted?: number;
}

export interface DependencyAddedData {
  packageName: string;
  version: string;
  reason: string;
  packageManager: 'npm' | 'pip' | 'cargo' | 'go' | 'other';
}

/**
 * Query filters for knowledge events
 */
export interface EventFilters {
  /** Filter by project ID */
  projectId?: string;
  
  /** Filter by session ID */
  sessionId?: string;
  
  /** Filter by plan ID */
  planId?: string;
  
  /** Filter by event type(s) */
  eventType?: EventType | EventType[];
  
  /** Events after this timestamp */
  startDate?: string;
  
  /** Events before this timestamp */
  endDate?: string;
  
  /** Limit number of results */
  limit?: number;
}

/**
 * Event query result
 */
export interface EventQueryResult {
  /** Total matching events */
  count: number;
  
  /** Matched events */
  events: KnowledgeEvent[];
}

/**
 * Semantic search options (Phase 2.5)
 */
export interface SemanticSearchOptions {
  /** Maximum number of results to return (default: 10) */
  limit?: number;
  
  /** Minimum similarity threshold 0.0-1.0 (default: 0.3) */
  threshold?: number;
  
  /** Filter by project ID (optional) */
  projectId?: string;
}

/**
 * Semantic search result (Phase 2.5)
 */
export interface SemanticSearchResult {
  /** Matched event */
  event: KnowledgeEvent;
  
  /** Cosine similarity score (0.0-1.0, higher is more similar) */
  similarity: number;
}
