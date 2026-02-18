// lib/context/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import { DatabaseLocator } from './database-locator.js';

/**
 * Project-scoped database connection factory.
 * Maintains one connection per resolved project path.
 */
export class KnowledgeDatabaseFactory {
  private static readonly instances = new Map<string, Database.Database>();

  static async getDatabase(targetDir: string = process.cwd()): Promise<Database.Database> {
    const resolvedTargetDir = path.resolve(targetDir);

    const existingInstance = this.instances.get(resolvedTargetDir);
    if (existingInstance) {
      return existingInstance;
    }

    const locator = new DatabaseLocator();
    const config = await locator.getDatabaseConfig(resolvedTargetDir);
    const database = new Database(config.dbPath);

    this.instances.set(resolvedTargetDir, database);
    return database;
  }

  static closeDatabase(targetDir: string = process.cwd()): void {
    const resolvedTargetDir = path.resolve(targetDir);
    const instance = this.instances.get(resolvedTargetDir);

    if (instance) {
      instance.close();
      this.instances.delete(resolvedTargetDir);
    }
  }

  static closeAll(): void {
    for (const instance of this.instances.values()) {
      instance.close();
    }
    this.instances.clear();
  }
}

/**
 * Get a project-scoped Knowledge Database connection.
 * Backward-compatible wrapper around `KnowledgeDatabaseFactory`.
 */
export async function getKnowledgeDb(targetDir: string = process.cwd()): Promise<Database.Database> {
  return KnowledgeDatabaseFactory.getDatabase(targetDir);
}

/**
 * Close the database connection for one project path.
 */
export function closeKnowledgeDb(targetDir: string = process.cwd()): void {
  KnowledgeDatabaseFactory.closeDatabase(targetDir);
}

/**
 * Close all cached database connections.
 */
export function closeAllKnowledgeDbs(): void {
  KnowledgeDatabaseFactory.closeAll();
}
