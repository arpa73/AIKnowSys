/**
 * search-context - Pure business logic for full-text search across AIKnowSys
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
 * @module lib/core/search-context
 */

import path from 'path';
import { createStorage, type SearchScope } from '../context/index.js';
import type { SearchResult } from '../context/types.js';

/**
 * Search options
 */
export interface SearchContextOptions {
  /** Search scope: all, plans, sessions, learned */
  scope?: 'all' | 'plans' | 'sessions' | 'learned';
  /** Target directory (overridden by targetDir parameter) */
  dir?: string;
  /** Query across all projects (default: false - search current project only) */
  allProjects?: boolean;
  /** Specific project ID to search (overrides allProjects) */
  projectId?: string;
}

/**
 * Search result structure
 */
export interface SearchContextResult {
  /** The search query that was executed */
  query: string;
  /** The scope that was searched */
  scope: 'all' | 'plans' | 'sessions' | 'learned';
  /** Number of matches found */
  count: number;
  /** Array of search results sorted by relevance (highest first) */
  matches: SearchResult[];
}

const VALID_SCOPES = ['all', 'plans', 'sessions', 'learned'] as const;

/**
 * Full-text search across AIKnowSys knowledge system (PURE BUSINESS LOGIC)
 * 
 * Validates query and scope, searches storage, returns matches sorted by relevance.
 * Used by both MCP tools (direct import) and CLI commands (with logger wrapper).
 * 
 * @param query - Search query (supports multi-word phrases)
 * @param options - Search options (scope, target directory)
 * @param targetDir - Optional target directory (overrides options.dir)
 * @returns Promise<SearchContextResult> - Structured search results sorted by relevance
 * @throws Error if query is empty or scope is invalid
 * 
 * @example
 * // Search across all content
 * const result = await searchContextCore('authentication');
 * // Returns: { query: 'authentication', scope: 'all', count: 5, matches: [...] }
 * 
 * @example
 * // Search only in sessions
 * const result = await searchContextCore('TDD workflow', { scope: 'sessions' });
 * // Returns structured data for MCP/CLI consumption
 */
export async function searchContextCore(
  query: string,
  options: SearchContextOptions = {},
  targetDir?: string
): Promise<SearchContextResult> {
  // Validate query (not empty)
  if (!query || query.trim().length === 0) {
    throw new Error(
      'Search query cannot be empty.\n' +
      'Examples: search-context "feature" or search-context "TDD workflow"'
    );
  }

  // Validate scope if provided
  const scope = options.scope || 'all';
  if (!VALID_SCOPES.includes(scope)) {
    throw new Error(
      `Invalid scope: '${scope}'. Must be one of: ${VALID_SCOPES.join(', ')}.\n` +
      'Examples: --scope plans, --scope sessions, --scope all'
    );
  }

  // Get target directory - ALWAYS resolve user input to absolute path
  // (Critical Invariant #2: Absolute Paths Required)
  const workingDir = targetDir 
    ? path.resolve(targetDir)
    : (options.dir ? path.resolve(options.dir) : process.cwd());

  // Only call DatabaseLocator if projectId not explicitly provided
  // (Performance optimization: avoids filesystem I/O when projectId is known)
  let projectId: string;
  let dbPath: string;
  
  if (options.projectId) {
    // ProjectId explicitly provided - use it directly
    projectId = options.projectId;
    // Still need dbPath for storage adapter
    const { DatabaseLocator } = await import('../context/database-locator.js');
    const locator = new DatabaseLocator();
    const dbConfig = await locator.getDatabaseConfig(workingDir);
    dbPath = dbConfig.dbPath;
  } else {
    // No explicit projectId - get from DatabaseLocator
    const { DatabaseLocator } = await import('../context/database-locator.js');
    const locator = new DatabaseLocator();
    const dbConfig = await locator.getDatabaseConfig(workingDir);
    projectId = dbConfig.projectId;
    dbPath = dbConfig.dbPath;
  }

  // Check if SQLite database exists - if so, use SQLite storage
  // Otherwise fall back to JSON (file-based) storage
  const { promises: fs } = await import('fs');
  let storageAdapter: 'sqlite' | 'json' = 'json';
  
  try {
    const stats = await fs.stat(dbPath);
    if (stats.isFile()) {
      storageAdapter = 'sqlite';
    }
  } catch (error: any) {
    // Only fall back to JSON for "file not found"
    // Re-throw other errors (permissions, I/O issues)
    if (error.code !== 'ENOENT') {
      throw new Error(
        `Failed to check SQLite database at ${dbPath}: ${error.message}.\n` +
        'Check file permissions or disk health.'
      );
    }
    // Database doesn't exist yet, use JSON storage
  }

  // Create storage adapter
  const storage = await createStorage(workingDir, { 
    adapter: storageAdapter,
    autoRebuild: true 
  });

  try {
    // Execute search (storage layer expects scope as SearchScope type)
    const scopeParam: SearchScope = scope === 'all' ? 'all' : scope;
    
    // Pass project filtering options to storage
    const searchOptions = {
      projectId: options.projectId || projectId, // Use explicit projectId or derived from DatabaseLocator
      allProjects: options.allProjects || false
    };
    
    const result = await storage.search(query, scopeParam, searchOptions);

    // Return structured data with matches sorted by relevance
    // Storage layer already sorts by relevance (highest first)
    return {
      query,
      scope,
      count: result.count,
      matches: result.results  // Rename 'results' to 'matches' for API consistency
    };
  } finally {
    // Always cleanup storage connection
    await storage.close();
  }
}
