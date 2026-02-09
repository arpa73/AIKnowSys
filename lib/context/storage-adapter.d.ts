/**
 * Base storage adapter interface for context query system.
 * All storage implementations must extend this class and implement all methods.
 */
import type { PlanMetadata, SessionMetadata, SearchResult, PlanFilters, SessionFilters, SearchScope } from './types.js';
export declare class StorageAdapter {
    /**
     * Initialize storage adapter with target directory.
     * @param _targetDir - Absolute path to workspace directory
     */
    init(_targetDir: string): Promise<void>;
    /**
     * Query plans with optional filters.
     * @param _filters - Query filters
     */
    queryPlans(_filters?: PlanFilters): Promise<{
        count: number;
        plans: PlanMetadata[];
    }>;
    /**
     * Query sessions with optional filters.
     * @param _filters - Query filters
     */
    querySessions(_filters?: SessionFilters): Promise<{
        count: number;
        sessions: SessionMetadata[];
    }>;
    /**
     * Full-text search across context.
     * @param _query - Search query
     * @param _scope - Search scope (all, plans, sessions, learned, essentials)
     */
    search(_query: string, _scope: SearchScope): Promise<{
        query: string;
        count: number;
        results: SearchResult[];
    }>;
    /**
     * Rebuild index from markdown files.
     * @returns Summary of indexed items
     */
    rebuildIndex(): Promise<{
        plansIndexed: number;
        sessionsIndexed: number;
        learnedIndexed: number;
    }>;
    /**
     * Close storage connections and cleanup resources.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=storage-adapter.d.ts.map