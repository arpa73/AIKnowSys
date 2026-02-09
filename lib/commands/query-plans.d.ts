/**
 * Query Plans Command
 *
 * Query plan metadata with filters (status, author, topic, date range)
 * Returns structured JSON for AI agents or human-readable table
 */
/**
 * Command options for queryPlans
 */
export interface QueryPlansOptions {
    /** Target directory (defaults to current directory) */
    dir?: string;
    /** Filter by plan status */
    status?: 'ACTIVE' | 'PAUSED' | 'PLANNED' | 'COMPLETE' | 'CANCELLED';
    /** Filter by author */
    author?: string;
    /** Filter by topic (fuzzy match) */
    topic?: string;
    /** Filter by plans updated after this date (ISO format YYYY-MM-DD) */
    updatedAfter?: string;
    /** Filter by plans updated before this date (ISO format YYYY-MM-DD) */
    updatedBefore?: string;
    /** Output JSON (for AI agents) */
    json?: boolean;
    /** Silent mode (for testing) */
    _silent?: boolean;
}
/**
 * Query plans with filters
 *
 * @param options - Query options
 * @returns Query results with count and plans array
 *
 * @example
 * ```typescript
 * // Find active plans
 * const result = await queryPlans({ status: 'ACTIVE', json: true });
 * console.log(`Found ${result.count} active plans`);
 *
 * // Find plans by author
 * const alicePlans = await queryPlans({ author: 'alice', json: true });
 *
 * // Combine filters
 * const recent = await queryPlans({
 *   status: 'ACTIVE',
 *   updatedAfter: '2026-02-01',
 *   json: true
 * });
 * ```
 */
export declare function queryPlans(options?: QueryPlansOptions): Promise<{
    count: number;
    plans: import("../context/types.js").PlanMetadata[];
}>;
//# sourceMappingURL=query-plans.d.ts.map