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

/**
 * Query session filters
 */
export interface QuerySessionsOptions {
  date?: string;
  dateAfter?: string;
  dateBefore?: string;
  topic?: string;
  plan?: string;
  days?: number;
  dir?: string;
}

/**
 * Query result structure
 */
export interface QuerySessionsResult {
  count: number;
  sessions: Array<{
    date: string;
    topic: string;
    plan?: string;
    duration?: string;
    phases?: string[];
    file: string;
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
  
  // Get target directory - ALWAYS resolve user input to absolute path
  // (Critical Invariant #2: Absolute Paths Required)
  const workingDir = targetDir 
    ? path.resolve(targetDir)
    : (options.dir ? path.resolve(options.dir) : process.cwd());
  
  // Create storage adapter
  const storage = await createStorage(workingDir, { autoRebuild: true });
  
  try {
    // Build filters object
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
    
    // Query storage (read-only operation)
    const result = await storage.querySessions(filters);
    
    // Sort sessions by date descending (newest first)
    result.sessions.sort((a, b) => b.date.localeCompare(a.date));
    
    // Return structured data
    return result;
  } finally {
    // Always cleanup storage connection
    await storage.close();
  }
}
