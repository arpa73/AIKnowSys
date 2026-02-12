/**
 * Storage adapter factory for AIKnowSys context query system
 * Creates and initializes storage adapters for plans, sessions, and learned patterns
 */

import path from 'path';
import { StorageAdapter } from './storage-adapter.js';
import { JsonStorage } from './json-storage.js';
import { SqliteStorage } from './sqlite-storage.js';
import { DatabaseLocator } from './database-locator.js';

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
export async function createStorage(
  targetDir: string,
  options: StorageOptions = {}
): Promise<StorageAdapter> {
  const { adapter = 'json', autoRebuild = false } = options;
  
  // Convert relative paths to absolute
  const absoluteDir = path.resolve(targetDir);
  
  // Create storage adapter based on type
  let storage: StorageAdapter;
  
  switch (adapter) {
    case 'json':
      storage = new JsonStorage();
      await storage.init(absoluteDir);
      break;
      
    case 'sqlite': {
      // Use DatabaseLocator to determine database path
      const locator = new DatabaseLocator();
      const dbConfig = await locator.getDatabaseConfig(absoluteDir);
      
      // Create SqliteStorage and init with database path
      storage = new SqliteStorage();
      await storage.init(dbConfig.dbPath);
      break;
    }
      
    default:
      throw new Error(`Unsupported storage adapter: ${adapter}`);
  }
  
  // Optionally rebuild index from markdown files
  if (autoRebuild) {
    await storage.rebuildIndex();
  }
  
  return storage;
}

/**
 * Re-export types for convenience
 */
export type {
  PlanMetadata,
  SessionMetadata,
  SearchResult,
  PlanFilters,
  SessionFilters,
  SearchScope
} from './types.js';

export { StorageAdapter } from './storage-adapter.js';
export { JsonStorage } from './json-storage.js';
export { SqliteStorage } from './sqlite-storage.js';
export { DatabaseLocator } from './database-locator.js';
export type { DatabaseConfig, AiknowsysConfig } from './database-locator.js';
