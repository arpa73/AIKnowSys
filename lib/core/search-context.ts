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
    throw new Error('Search query cannot be empty');
  }

  // Validate scope if provided
  const scope = options.scope || 'all';
  if (!VALID_SCOPES.includes(scope)) {
    throw new Error(
      `Invalid scope: ${scope}. Must be one of: ${VALID_SCOPES.join(', ')}`
    );
  }

  // Get target directory - ALWAYS resolve user input to absolute path
  // (Critical Invariant #2: Absolute Paths Required)
  const workingDir = targetDir 
    ? path.resolve(targetDir)
    : (options.dir ? path.resolve(options.dir) : process.cwd());

  // Create storage adapter
  const storage = await createStorage(workingDir, { autoRebuild: true });

  try {
    // Execute search (storage layer expects scope as SearchScope type)
    const scopeParam: SearchScope = scope === 'all' ? 'all' : scope;
    const result = await storage.search(query, scopeParam);

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
