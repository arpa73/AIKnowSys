/**
 * Options for the rebuild-index command
 */
export interface RebuildIndexOptions {
    /** Target directory (defaults to current directory) */
    dir?: string;
    /** Output JSON for AI agents */
    json?: boolean;
    /** Silent mode (for testing) */
    _silent?: boolean;
}
/**
 * Result from the rebuild-index command
 */
export interface RebuildIndexResult {
    /** Number of plan files indexed */
    plansIndexed: number;
    /** Number of session files indexed */
    sessionsIndexed: number;
    /** Number of learned pattern files indexed */
    learnedIndexed: number;
}
/**
 * Rebuild context index from markdown files
 *
 * Scans .aiknowsys/ directory for plans, sessions, and learned patterns,
 * extracts metadata, and writes to context-index.json.
 *
 * @param options - Rebuild options (directory, output format)
 * @returns Summary of indexing operation
 *
 * @example
 * ```typescript
 * // Rebuild team index
 * await rebuildIndex({ json: true });
 *
 * // Rebuild in specific directory
 * await rebuildIndex({ dir: '/path/to/project', json: true });
 * ```
 */
export declare function rebuildIndex(options?: RebuildIndexOptions): Promise<RebuildIndexResult>;
//# sourceMappingURL=rebuild-index.d.ts.map