/**
 * Storage adapter factory for AIKnowSys context query system
 * Creates and initializes storage adapters for plans, sessions, and learned patterns
 */
import { StorageAdapter } from './storage-adapter.js';
/**
 * Storage adapter configuration options
 */
export interface StorageOptions {
    /** Storage adapter type (default: 'json') */
    adapter?: 'json' | 'sqlite';
    /** Auto-rebuild index on initialization (default: false) */
    autoRebuild?: boolean;
}
/**
 * Create and initialize a storage adapter
 *
 * @param targetDir - Target workspace directory (absolute or relative path)
 * @param options - Storage configuration options
 * @returns Initialized storage adapter
 *
 * @example
 * ```typescript
 * // Create JSON storage (default)
 * const storage = await createStorage('/path/to/workspace');
 *
 * // Query plans
 * const result = await storage.queryPlans({ status: 'ACTIVE' });
 * console.log(`Found ${result.count} active plans`);
 *
 * // Cleanup when done
 * await storage.close();
 * ```
 */
export declare function createStorage(targetDir: string, options?: StorageOptions): Promise<StorageAdapter>;
/**
 * Re-export types for convenience
 */
export type { PlanMetadata, SessionMetadata, SearchResult, PlanFilters, SessionFilters, SearchScope } from './types.js';
export { StorageAdapter } from './storage-adapter.js';
export { JsonStorage } from './json-storage.js';
export { SqliteStorage } from './sqlite-storage.js';
export { DatabaseLocator } from './database-locator.js';
export type { DatabaseConfig, AiknowsysConfig } from './database-locator.js';
//# sourceMappingURL=index.d.ts.map