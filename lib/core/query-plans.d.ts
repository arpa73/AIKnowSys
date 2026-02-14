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
/**
 * Query plan filters
 */
export interface QueryPlansOptions {
    status?: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
    author?: string;
    topic?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    dir?: string;
}
/**
 * Query result structure
 */
export interface QueryPlansResult {
    count: number;
    plans: Array<{
        id: string;
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
export declare function queryPlansCore(options?: QueryPlansOptions, targetDir?: string): Promise<QueryPlansResult>;
//# sourceMappingURL=query-plans.d.ts.map