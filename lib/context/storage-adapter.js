/**
 * Base storage adapter interface for context query system.
 * All storage implementations must extend this class and implement all methods.
 */
export class StorageAdapter {
    /**
     * Initialize storage adapter with target directory.
     * @param _targetDir - Absolute path to workspace directory
     */
    async init(_targetDir) {
        throw new Error('StorageAdapter.init() must be implemented by subclass');
    }
    /**
     * Query plans with optional filters.
     * @param _filters - Query filters
     */
    async queryPlans(_filters) {
        throw new Error('StorageAdapter.queryPlans() must be implemented by subclass');
    }
    /**
     * Query sessions with optional filters.
     * @param _filters - Query filters
     */
    async querySessions(_filters) {
        throw new Error('StorageAdapter.querySessions() must be implemented by subclass');
    }
    /**
     * Full-text search across context.
     * @param _query - Search query
     * @param _scope - Search scope (all, plans, sessions, learned, essentials)
     */
    async search(_query, _scope) {
        throw new Error('StorageAdapter.search() must be implemented by subclass');
    }
    /**
     * Rebuild index from markdown files.
     * @returns Summary of indexed items
     */
    async rebuildIndex() {
        throw new Error('StorageAdapter.rebuildIndex() must be implemented by subclass');
    }
    /**
     * Close storage connections and cleanup resources.
     */
    async close() {
        throw new Error('StorageAdapter.close() must be implemented by subclass');
    }
}
