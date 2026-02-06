import { createLogger } from '../logger.js';
import { createStorage } from '../context/index.js';
import type { SearchScope, SearchResult } from '../context/types.js';
import path from 'path';

/**
 * Options for the search-context command
 */
export interface SearchContextOptions {
  /** Target directory (defaults to current directory) */
  dir?: string;
  /** Search scope: all, plans, sessions, learned */
  scope?: 'all' | 'plans' | 'sessions' | 'learned';
  /** Output JSON for AI agents */
  json?: boolean;
  /** Silent mode (for testing) */
  _silent?: boolean;
}

/**
 * Result from the search-context command
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
 * Full-text search across AIKnowSys knowledge system
 * 
 * Searches plans, sessions, and learned patterns with relevance scoring.
 * Results are sorted by relevance (highest first).
 * 
 * @param query - Search query (supports multi-word phrases)
 * @param options - Search options (scope, output format)
 * @returns Search results with matches sorted by relevance
 * 
 * @example
 * ```typescript
 * // Search across all content
 * const results = await searchContext('authentication', { json: true });
 * 
 * // Search only in sessions
 * const sessions = await searchContext('TDD workflow', { 
 *   scope: 'sessions', 
 *   json: true 
 * });
 * ```
 */
export async function searchContext(
  query: string,
  options: SearchContextOptions = {}
): Promise<SearchContextResult> {
  const log = createLogger(options._silent);

  // Validate query
  if (!query || query.trim().length === 0) {
    const error = new Error('Search query cannot be empty');
    log.error(error.message);
    throw error;
  }

  // Validate scope if provided
  const scope = options.scope || 'all';
  if (!VALID_SCOPES.includes(scope)) {
    const error = new Error(
      `Invalid scope: ${scope}. Must be one of: ${VALID_SCOPES.join(', ')}`
    );
    log.error(error.message);
    throw error;
  }

  // Get target directory (absolute path)
  const targetDir = options.dir ? path.resolve(options.dir) : process.cwd();

  try {
    // Create storage adapter with auto-rebuild
    const storage = await createStorage(targetDir, { autoRebuild: true });

    // Execute search (storage layer expects scope as second parameter)
    const scopeParam: SearchScope = scope === 'all' ? 'all' : scope;
    const result = await storage.search(query, scopeParam);
    await storage.close();

    // JSON output for AI agents
    if (options.json) {
      return {
        query,
        scope,
        count: result.count,
        matches: result.results  // Rename 'results' to 'matches' for API consistency
      };
    }

    // Human-readable output
    if (result.count === 0) {
      log.warn(`No results found for "${query}"`);
      if (scope !== 'all') {
        log.info(`  Searched scope: ${scope}`);
      }
      log.blank();
      return { query, scope, count: 0, matches: [] };
    }

    log.success(`Found ${result.count} match(es) for "${query}":`);
    if (scope !== 'all') {
      log.info(`  Scope: ${scope}`);
    }
    log.blank();

    // Note: Search results use compact output with relevance scores and file context.
    // Matches are pre-sorted by relevance (highest first) from storage layer.
    result.results.forEach((match: SearchResult) => {
      const typeEmoji: Record<string, string> = {
        plan: '📋',
        session: '📅',
        learned: '🧠',
        essentials: '📖'
      };

      log.info(`${typeEmoji[match.type] || '📄'} ${match.type.toUpperCase()} (relevance: ${match.relevance})`);
      log.info(`  ${match.context}`);
      log.info(`  File: ${match.file}`);
      if (match.line) {
        log.info(`  Line: ${match.line}`);
      }
      log.blank();
    });

    return {
      query,
      scope,
      count: result.count,
      matches: result.results  // Rename 'results' to 'matches' for API consistency
    };

  } catch (error) {
    const err = error as Error;
    log.error(`Failed to search context: ${err.message}`);
    throw error;
  }
}
