import { createLogger } from '../logger.js';
import { searchContextCore, type SearchContextOptions as CoreOptions, type SearchContextResult } from '../core/search-context.js';
import type { SearchResult } from '../context/types.js';

/**
 * CLI command options (extends core options with CLI-specific flags)
 */
export interface SearchContextOptions extends CoreOptions {
  /** Output JSON for AI agents */
  json?: boolean;
  /** Silent mode (for testing) */
  _silent?: boolean;
}

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

  try {
    // Call pure business logic function
    const result = await searchContextCore(query, options);

    // JSON output for AI agents
    if (options.json) {
      return result;
    }

    // Human-readable output
    if (result.count === 0) {
      log.warn(`No results found for "${result.query}"`);
      if (result.scope !== 'all') {
        log.info(`  Searched scope: ${result.scope}`);
      }
      log.blank();
      return result;
    }

    log.success(`Found ${result.count} match(es) for "${result.query}":`);
    if (result.scope !== 'all') {
      log.info(`  Scope: ${result.scope}`);
    }
    log.blank();

    // Note: Search results use compact output with relevance scores and file context.
    // Matches are pre-sorted by relevance (highest first) from storage layer.
    result.matches.forEach((match: SearchResult) => {
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

    return result;

  } catch (error) {
    const err = error as Error;
    log.error(`Failed to search context: ${err.message}`);
    throw error;
  }
}
