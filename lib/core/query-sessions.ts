/**
 * query-sessions - Pure business logic for querying session history
 * 
 * Phase 2 Batch 2: Query commands extraction
 * Part of 10-100x performance improvement initiative
 * 
 * This module contains PURE business logic with no side effects:
 * - No console.log, console.error, or logger usage
 * - No process.exit
 * - All I/O through storage adapter
 * - Pure functions that return structured data
 * 
 * Used by:
 * - MCP tools (direct import for 10x speed)
 * - CLI commands (wrapper with logger)
 * - Future: Web UI, programmatic access
 * 
 * @module lib/core/query-sessions
 */

import path from 'path';
import { createStorage, type SessionFilters } from '../context/index.js';

interface SessionResultItem {
  date: string;
}

interface SessionQueryStorage {
  init(targetDir?: string): Promise<void>;
  querySessions(filters?: SessionFilters): Promise<QuerySessionsResult>;
  close(): Promise<void>;
}

/**
 * Query session filters (Phase 1: Cross-Repository support)
 */
export interface QuerySessionsOptions {
  date?: string;
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  plan?: string;
  days?: number;
  dir?: string;
  dbPath?: string; // Phase 1: Direct database path for cross-repository queries
  projectId?: string; // Phase 1: Filter by specific project ID
  allProjects?: boolean; // Phase 1: Query across all projects (default: false)
  adapter?: 'json' | 'sqlite'; // Override adapter for testing
}

/**
 * Query result structure (Phase 1: Includes projectId for cross-repo support)
 */
export interface QuerySessionsResult {
  count: number;
  sessions: Array<{
    id?: string; // Session ID (from database)
    date: string;
    projectId?: string; // Phase 1: Project identifier
    topic: string;
    plan?: string;
    duration?: string;
    phases?: string[];
    file: string;
    topics?: string[]; // Topics array (v0.10.0+)
  }>;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Query session history with filters (PURE BUSINESS LOGIC - no side effects)
 * 
 * Validates filters, queries storage adapter, returns sorted structured results.
 * Used by both MCP tools (direct import) and CLI commands (with logger wrapper).
 * 
 * @param options - Query filters and target directory
 * @param targetDir - Optional target directory (overrides options.dir)
 * @returns Promise<QuerySessionsResult> - Structured query results sorted by date descending
 * @throws Error if date format is invalid
 * 
 * @example
 * // Query sessions from last 7 days
 * const result = await querySessionsCore({ days: 7 });
 * // Returns: { count: 3, sessions: [{ date: '2026-02-10', ... }, ...] }
 * 
 * @example
 * // Query with multiple filters
 * const result = await querySessionsCore({
 *   topic: 'TDD',
 *   dateAfter: '2026-02-01',
 *   plan: 'PLAN_feature_x'
 * });
 * // Returns structured data for MCP/CLI consumption
 */
export async function querySessionsCore(
  options: QuerySessionsOptions = {},
  targetDir?: string
): Promise<QuerySessionsResult> {
  // Validate date formats if provided
  if (options.date && !isValidDate(options.date)) {
    throw new Error(`Invalid date format: ${options.date}. Expected YYYY-MM-DD`);
  }

  if (options.dateAfter && !isValidDate(options.dateAfter)) {
    throw new Error(`Invalid dateAfter format: ${options.dateAfter}. Expected YYYY-MM-DD`);
  }

  if (options.dateBefore && !isValidDate(options.dateBefore)) {
    throw new Error(`Invalid dateBefore format: ${options.dateBefore}. Expected YYYY-MM-DD`);
  }

  // Phase 1: Support explicit dbPath for cross-repository queries
  let storage: SessionQueryStorage;

  if (options.dbPath) {
    // Direct database path provided - create SqliteStorage directly
    const { SqliteStorage } = await import('../context/sqlite-storage.js');
    storage = new SqliteStorage();
    await storage.init(options.dbPath);
  } else {
    // Get target directory - ALWAYS resolve user input to absolute path
    // (Critical Invariant #2: Absolute Paths Required)
    const workingDir = targetDir
      ? path.resolve(targetDir)
      : (options.dir ? path.resolve(options.dir) : process.cwd());

    // Create storage adapter (uses DatabaseLocator for global DB by default)
    storage = await createStorage(workingDir, {
      adapter: options.adapter || 'sqlite',
      autoRebuild: true
    });
  }

  try {
    // Build filters object (Phase 1: Cross-Repository support)
    const filters: SessionFilters = {};

    // Handle --days convenience filter (calculates dateAfter from N days ago)
    if (options.days !== undefined) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - options.days);
      filters.dateAfter = cutoff.toISOString().split('T')[0];
    }

    // Apply other filters (explicit dateAfter overrides days calculation)
    if (options.date) filters.date = options.date;
    if (options.dateAfter) filters.dateAfter = options.dateAfter;
    if (options.dateBefore) filters.dateBefore = options.dateBefore;
    if (options.topic) filters.topic = options.topic;
    if (options.plan) filters.plan = options.plan;
    if (options.projectId) filters.projectId = options.projectId;
    if (options.allProjects !== undefined) filters.allProjects = options.allProjects;

    // Query storage (read-only operation)
    const result = await storage.querySessions(filters);

    // Sort sessions by date descending (newest first)
    result.sessions.sort((a: SessionResultItem, b: SessionResultItem) => b.date.localeCompare(a.date));

    // Return structured data
    return result;
  } finally {
    // Always cleanup storage connection
    await storage.close();
  }
}
