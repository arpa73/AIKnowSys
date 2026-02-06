/**
 * Base storage adapter interface for context query system.
 * All storage implementations must extend this class and implement all methods.
 */

import type { 
  PlanMetadata, 
  SessionMetadata, 
  SearchResult,
  PlanFilters,
  SessionFilters,
  SearchScope
} from './types.js';

export class StorageAdapter {
  /**
   * Initialize storage adapter with target directory.
   * @param _targetDir - Absolute path to workspace directory
   */
  async init(_targetDir: string): Promise<void> {
    throw new Error('StorageAdapter.init() must be implemented by subclass');
  }

  /**
   * Query plans with optional filters.
   * @param _filters - Query filters
   */
  async queryPlans(_filters?: PlanFilters): Promise<{ count: number; plans: PlanMetadata[] }> {
    throw new Error('StorageAdapter.queryPlans() must be implemented by subclass');
  }

  /**
   * Query sessions with optional filters.
   * @param _filters - Query filters
   */
  async querySessions(_filters?: SessionFilters): Promise<{ count: number; sessions: SessionMetadata[] }> {
    throw new Error('StorageAdapter.querySessions() must be implemented by subclass');
  }

  /**
   * Full-text search across context.
   * @param _query - Search query
   * @param _scope - Search scope (all, plans, sessions, learned, essentials)
   */
  async search(_query: string, _scope: SearchScope): Promise<{ query: string; count: number; results: SearchResult[] }> {
    throw new Error('StorageAdapter.search() must be implemented by subclass');
  }

  /**
   * Rebuild index from markdown files.
   */
  async rebuildIndex(): Promise<void> {
    throw new Error('StorageAdapter.rebuildIndex() must be implemented by subclass');
  }

  /**
   * Close storage connections and cleanup resources.
   */
  async close(): Promise<void> {
    throw new Error('StorageAdapter.close() must be implemented by subclass');
  }
}
