/**
 * Base storage adapter interface for context query system.
 * All storage implementations must extend this class and implement all methods.
 */
export class StorageAdapter {
  /**
   * Initialize storage adapter with target directory.
   * @param {string} _targetDir - Absolute path to workspace directory
   * @returns {Promise<void>}
   */
  async init(_targetDir: string): Promise<void> {
    throw new Error('StorageAdapter.init() must be implemented by subclass');
  }

  /**
   * Query plans with optional filters.
   * @param {object} _filters - Query filters
   * @param {string} [_filters.status] - Filter by status (ACTIVE, PAUSED, COMPLETE, CANCELLED)
   * @param {string} [_filters.author] - Filter by author username
   * @param {string} [_filters.topic] - Search in plan topic/title (fuzzy match)
   * @returns {Promise<{count: number, plans: Array}>}
   */
  async queryPlans(_filters?: { status?: string; author?: string; topic?: string }): Promise<{ count: number; plans: any[] }> {
    throw new Error('StorageAdapter.queryPlans() must be implemented by subclass');
  }

  /**
   * Query sessions with optional filters.
   * @param {object} _filters - Query filters
   * @param {number} [_filters.days] - Number of days to look back (default: 30)
   * @param {string} [_filters.topic] - Search in session topics (fuzzy match)
   * @param {string} [_filters.plan] - Filter by associated plan
   * @returns {Promise<{count: number, sessions: Array}>}
   */
  async querySessions(_filters?: { days?: number; topic?: string; plan?: string }): Promise<{ count: number; sessions: any[] }> {
    throw new Error('StorageAdapter.querySessions() must be implemented by subclass');
  }

  /**
   * Full-text search across context.
   * @param {string} _query - Search query
   * @param {string} _scope - Search scope (all, plans, sessions, learned, essentials)
   * @returns {Promise<{query: string, count: number, results: Array}>}
   */
  async search(_query: string, _scope: string): Promise<{ query: string; count: number; results: any[] }> {
    throw new Error('StorageAdapter.search() must be implemented by subclass');
  }

  /**
   * Rebuild index from markdown files.
   * @returns {Promise<void>}
   */
  async rebuildIndex(): Promise<void> {
    throw new Error('StorageAdapter.rebuildIndex() must be implemented by subclass');
  }

  /**
   * Close storage connections and cleanup resources.
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    throw new Error('StorageAdapter.close() must be implemented by subclass');
  }
}
