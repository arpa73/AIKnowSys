/**
 * query-plans - Pure business logic for querying plan metadata
 * 
 * Phase 2 Batch 2: Query commands extraction
 * Part of 10-100x performance improvement initiative
 * 
 * This module contains PURE business logic with no side effects:
 * - No console.log, console.error, or logger usage
 * - No process.exit
 * - All I/O through storage adapter passed as parameter
 * - Pure functions that return structured data
 * 
 * Used by:
 * - MCP tools (direct import for 10x speed)
 * - CLI commands (wrapper with logger)
 * - Future: Web UI, programmatic access
 * 
 * @module lib/core/query-plans
 */

import path from 'path';
import { createStorage, type PlanFilters } from '../context/index.js';

/**
 * Valid plan status values
 */
const VALID_STATUSES = ['ACTIVE', 'PAUSED', 'PLANNED', 'COMPLETE', 'CANCELLED'];

/**
 * Query plan filters (Phase 1: Cross-Repository support)
 */
export interface QueryPlansOptions {
  status?: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
  author?: string;
  topic?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  dir?: string;
  dbPath?: string;
  projectId?: string; // Filter by specific project ID
  allProjects?: boolean; // Query across all projects (default: false)
  adapter?: 'json' | 'sqlite'; // Override adapter for testing
}

/**
 * Query result structure (Phase 1: Includes projectId for cross-repo support)
 */
export interface QueryPlansResult {
  count: number;
  plans: Array<{
    id: string;
    projectId?: string; // Optional for backward compatibility (will be required in Phase 1 complete)
    title: string;
    author: string;
    status: string;
    created: string;
    updated: string;
    file: string;
    topics?: string[];
  }>;
}

/**
 * Query plan metadata with filters (PURE BUSINESS LOGIC - no side effects)
 * 
 * Validates filters, queries storage adapter, returns structured results.
 * Used by both MCP tools (direct import) and CLI commands (with logger wrapper).
 * 
 * @param options - Query filters and target directory
 * @returns Promise<QueryPlansResult> - Structured query results
 * @throws Error if status value is invalid
 * 
 * @example
 * // Query active plans
 * const result = await queryPlansCore({ status: 'ACTIVE' });
 * // Returns: { count: 1, plans: [{ id: 'PLAN_xyz', title: '...', ... }] }
 * 
 * @example
 * // Query with multiple filters
 * const result = await queryPlansCore({
 *   status: 'ACTIVE',
 *   author: 'alice',
 *   updatedAfter: '2026-02-01'
 * });
 * // Returns structured data for MCP/CLI consumption
 */
export async function queryPlansCore(
  options: QueryPlansOptions = {},
  targetDir?: string
): Promise<QueryPlansResult> {
  // Validate status if provided
  if (options.status && !VALID_STATUSES.includes(options.status)) {
    throw new Error(
      `Invalid plan status: ${options.status}. ` +
      `Valid statuses: ${VALID_STATUSES.join(', ')}`
    );
  }

  // Phase 1: Support explicit dbPath for cross-repository queries
  let storage: any;

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
    const filters: PlanFilters = {};
    if (options.status) filters.status = options.status;
    if (options.author) filters.author = options.author;
    if (options.topic) filters.topic = options.topic;
    if (options.updatedAfter) filters.updatedAfter = options.updatedAfter;
    if (options.updatedBefore) filters.updatedBefore = options.updatedBefore;
    if (options.projectId) filters.projectId = options.projectId;
    if (options.allProjects !== undefined) filters.allProjects = options.allProjects;

    // Query storage (read-only operation)
    const result = await storage.queryPlans(filters);

    // Return structured data
    return result;
  } finally {
    // Always cleanup storage connection
    await storage.close();
  }
}
