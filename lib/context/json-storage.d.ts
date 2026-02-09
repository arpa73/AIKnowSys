/**
 * JSON file-based storage adapter implementation
 * Stores context index in .aiknowsys/context-index.json
 */
import { StorageAdapter } from './storage-adapter.js';
import type { PlanMetadata, SessionMetadata, SearchResult, PlanFilters, SessionFilters, SearchScope } from './types.js';
export declare class JsonStorage extends StorageAdapter {
    private targetDir;
    private autoIndexer;
    private index;
    init(targetDir: string): Promise<void>;
    queryPlans(filters?: PlanFilters): Promise<{
        count: number;
        plans: PlanMetadata[];
    }>;
    querySessions(filters?: SessionFilters): Promise<{
        count: number;
        sessions: SessionMetadata[];
    }>;
    search(query: string, scope: SearchScope): Promise<{
        query: string;
        count: number;
        results: SearchResult[];
    }>;
    rebuildIndex(): Promise<{
        plansIndexed: number;
        sessionsIndexed: number;
        learnedIndexed: number;
    }>;
    close(): Promise<void>;
    /**
     * Get index file path (exposed for AutoIndexer)
     */
    getIndexPath(): string;
    private saveIndex;
    private parsePlanPointer;
    private parsePlanFile;
    private parseSessionFile;
}
//# sourceMappingURL=json-storage.d.ts.map