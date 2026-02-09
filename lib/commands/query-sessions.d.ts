/**
 * Query Sessions Command
 *
 * Query session history with filters (date, topic, plan reference)
 * Returns structured JSON for AI agents or human-readable output
 */
/**
 * Command options for querySessions
 */
export interface QuerySessionsOptions {
    /** Target directory (defaults to current directory) */
    dir?: string;
    /** Filter by exact date (YYYY-MM-DD) */
    date?: string;
    /** Filter by sessions after this date (YYYY-MM-DD) */
    dateAfter?: string;
    /** Filter by sessions before this date (YYYY-MM-DD) */
    dateBefore?: string;
    /** Filter by topic (fuzzy match) */
    topic?: string;
    /** Filter by plan reference */
    plan?: string;
    /** Filter by sessions from last N days (convenience) */
    days?: number;
    /** Output JSON (for AI agents) */
    json?: boolean;
    /** Silent mode (for testing) */
    _silent?: boolean;
}
/**
 * Query sessions with filters
 *
 * @param options - Query options
 * @returns Query results with count and sessions array
 *
 * @example
 * ```typescript
 * // Find sessions from last 7 days
 * const result = await querySessions({ days: 7, json: true });
 *
 * // Find sessions by topic
 * const tddSessions = await querySessions({ topic: 'TDD', json: true });
 *
 * // Combine filters
 * const recent = await querySessions({
 *   dateAfter: '2026-02-01',
 *   topic: 'TypeScript',
 *   json: true
 * });
 * ```
 */
export declare function querySessions(options?: QuerySessionsOptions): Promise<{
    count: number;
    sessions: import("../context/types.js").SessionMetadata[];
}>;
//# sourceMappingURL=query-sessions.d.ts.map