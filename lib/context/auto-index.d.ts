/**
 * AutoIndexer - Auto-rebuild on stale index detection
 * Phase A.6 - Context Query Completion
 *
 * Provides transparent index rebuilding when files are newer than index.
 * Supports lazy rebuild (on-demand) and optional git hooks (proactive).
 */
import type { JsonStorage } from './json-storage.js';
/**
 * Auto-indexing options
 */
export interface AutoIndexOptions {
    /** Force rebuild even if index is fresh */
    force?: boolean;
    /** Log rebuild events to console */
    verbose?: boolean;
    /** Maximum time to wait for rebuild (ms) */
    maxRebuildTime?: number;
}
/**
 * AutoIndexer - Automatically rebuilds index when stale
 *
 * Staleness detection: Compares index mtime with newest file mtime in source directories
 * Rebuild strategy: Lazy (check on query) + optional git hooks (proactive)
 */
export declare class AutoIndexer {
    private targetDir;
    constructor(targetDir?: string);
    /**
     * Ensure index is fresh, rebuild if stale
     * @param storage - JsonStorage instance to check/rebuild
     * @param options - Auto-index configuration options
     * @returns Promise resolving to true if index was rebuilt, false if already fresh
     */
    ensureFreshIndex(storage: JsonStorage, options?: AutoIndexOptions): Promise<boolean>;
    /**
     * Check if index is stale (files newer than index)
     * @param storage - JsonStorage instance to check staleness for
     * @returns Promise resolving to true if index needs rebuild, false if fresh
     */
    isIndexStale(storage: JsonStorage): Promise<boolean>;
    /**
     * Get index path (delegates to storage adapter)
     */
    getIndexPath(storage: JsonStorage): string;
}
//# sourceMappingURL=auto-index.d.ts.map