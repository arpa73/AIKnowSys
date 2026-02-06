/**
 * Base storage adapter interface for context query system.
 * All storage implementations must extend this class and implement all methods.
 */
export class StorageAdapter {
  /**
   * Initialize storage adapter with target directory.
   * @param {string} targetDir - Absolute path to workspace directory
   * @returns {Promise<void>}
   */
  async init(targetDir) {
    throw new Error('StorageAdapter.init() must be implemented by subclass');
  }

  /**
   * Query plans with optional filters.
   * @param {object} filters - Query filters
   * @param {string} [filters.status] - Filter by status (ACTIVE, PAUSED, COMPLETE, CANCELLED)
   * @param {string} [filters.author] - Filter by author username
   * @param {string} [filters.topic] - Search in plan topic/title (fuzzy match)
   * @returns {Promise<{count: number, plans: Array}>}
   */
  async queryPlans(filters) {
    throw new Error('StorageAdapter.queryPlans() must be implemented by subclass');
  }

  /**
   * Query sessions with optional filters.
   * @param {object} filters - Query filters
   * @param {number} [filters.days] - Number of days to look back (default: 30)
   * @param {string} [filters.topic] - Search in session topics (fuzzy match)
   * @param {string} [filters.plan] - Filter by associated plan
   * @returns {Promise<{count: number, sessions: Array}>}
   */
  async querySessions(filters) {
    throw new Error('StorageAdapter.querySessions() must be implemented by subclass');
  }

  /**
   * Full-text search across context.
   * @param {string} query - Search query
   * @param {string} scope - Search scope (all, plans, sessions, learned, essentials)
   * @returns {Promise<{query: string, count: number, results: Array}>}
   */
  async search(query, scope) {
    throw new Error('StorageAdapter.search() must be implemented by subclass');
  }

  /**
   * Rebuild index from markdown files.
   * @returns {Promise<void>}
   */
  async rebuildIndex() {
    throw new Error('StorageAdapter.rebuildIndex() must be implemented by subclass');
  }

  /**
   * Close storage connections and cleanup resources.
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('StorageAdapter.close() must be implemented by subclass');
  }
}
