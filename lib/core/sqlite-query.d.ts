/**
 * SQLite Query Core Functions
 *
 * Pure functions for querying SQLite database. Used by MCP tools.
 * Following Phase 2 pattern: Core function = pure logic, no logger dependency.
 *
 * Design note: These functions use SqliteStorage's queryFull* methods
 * to access complete records with content (not just metadata).
 *
 * Phase 3: Smart database path detection (auto-find knowledge.db)
 */
import type { QuerySessionsOptions, QueryPlansOptions, QueryLearnedPatternsOptions, SearchContextOptions, DbStatsOptions, QuerySessionsResult, QueryPlansResult, QueryLearnedPatternsResult, SearchContextResult, DbStatsResult } from '../types/index.js';
/**
 * Query sessions from SQLite database
 *
 * @param options - Query filters (dateAfter, dateBefore, topic, status, includeContent)
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Session records matching filters (metadata-only by default for token efficiency)
 */
export declare function querySessionsSqlite(options: QuerySessionsOptions): Promise<QuerySessionsResult>;
/**
 * Query plans from SQLite database
 *
 * @param options - Query filters (status, author, topic, priority, includeContent)
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Plan records matching filters (metadata-only by default for token efficiency)
 */
export declare function queryPlansSqlite(options: QueryPlansOptions): Promise<QueryPlansResult>;
/**
 * Query learned patterns from SQLite database
 *
 * Note: Learned patterns are stored as plans with id starting with 'learned_'
 *
 * @param options - Query filters (category, keywords, includeContent)
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Pattern records matching filters (metadata-only by default for token efficiency)
 */
export declare function queryLearnedPatternsSqlite(options: QueryLearnedPatternsOptions): Promise<QueryLearnedPatternsResult>;
/**
 * Full-text search across all content in SQLite database
 *
 * @param options - Search query and optional result limit
 *                  dbPath is optional - will auto-detect if not provided
 * @returns Search results with snippets and relevance scores
 */
export declare function searchContextSqlite(options: SearchContextOptions): Promise<SearchContextResult>;
/**
 * Get database statistics
 *
 * @param options - Database path (optional - will auto-detect if not provided)
 * @returns Record counts and database metadata
 */
export declare function getDbStats(options: DbStatsOptions): Promise<DbStatsResult>;
//# sourceMappingURL=sqlite-query.d.ts.map