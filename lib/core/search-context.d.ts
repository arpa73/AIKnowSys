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
export declare function searchContextCore(query: string, options?: SearchContextOptions, targetDir?: string): Promise<SearchContextResult>;
//# sourceMappingURL=search-context.d.ts.map