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
export declare function querySessionsCore(options?: QuerySessionsOptions, targetDir?: string): Promise<QuerySessionsResult>;
//# sourceMappingURL=query-sessions.d.ts.map