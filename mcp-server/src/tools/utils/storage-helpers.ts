import { SqliteStorage } from '../../../../lib/context/sqlite-storage.js';
import { findKnowledgeDb } from '../../../../lib/utils/find-knowledge-db.js';

export const MCP_AGENT_USER_ID = 'mcp-agent';

export async function withStorage<T>(
  operation: (storage: SqliteStorage) => Promise<T>,
  operationName = 'storage operation'
): Promise<T> {
  let storage: SqliteStorage | null = null;

  try {
    storage = new SqliteStorage();
    await storage.init(findKnowledgeDb());
    return await operation(storage);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const contextualError = new Error(`Failed during ${operationName}: ${message}`, { cause: error });
    throw contextualError;
  } finally {
    if (storage) {
      try {
        await storage.close();
      } catch {
      }
    }
  }
}

export function toUserFacingStorageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^Failed during [^:]+: /, '');
}
