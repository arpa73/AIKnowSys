import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { createStorage } from '../../lib/context/index.js';
import { JsonStorage } from '../../lib/context/json-storage.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

describe('createStorage factory', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-storage-factory-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('createStorage', () => {
    it('should create JsonStorage adapter by default', async () => {
      const storage = await createStorage(tmpDir);
      
      expect(storage).toBeInstanceOf(JsonStorage);
      await storage.close();
    });

    it('should initialize storage with target directory', async () => {
      const storage = await createStorage(tmpDir);
      
      // Verify storage was initialized by checking if it can query
      const result = await storage.queryPlans();
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('plans');
      
      await storage.close();
    });

    it('should create .aiknowsys directory if not exists', async () => {
      const storage = await createStorage(tmpDir);
      
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const exists = await fs.access(aiknowsysDir).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      await storage.close();
    });

    it('should create context-index.json on initialization', async () => {
      const storage = await createStorage(tmpDir);
      
      const indexPath = path.join(tmpDir, '.aiknowsys', 'context-index.json');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      await storage.close();
    });

    it('should accept adapter type option (future: sqlite)', async () => {
      // For now, only 'json' is supported
      const storage = await createStorage(tmpDir, { adapter: 'json' });
      
      expect(storage).toBeInstanceOf(JsonStorage);
      await storage.close();
    });

    it('should throw error for unsupported adapter types', async () => {
      await expect(
        createStorage(tmpDir, { adapter: 'mongodb' as any })
      ).rejects.toThrow('Unsupported storage adapter: mongodb');
    });

    it('should return storage adapter with all required methods', async () => {
      const storage = await createStorage(tmpDir);
      
      expect(storage).toHaveProperty('init');
      expect(storage).toHaveProperty('queryPlans');
      expect(storage).toHaveProperty('querySessions');
      expect(storage).toHaveProperty('search');
      expect(storage).toHaveProperty('rebuildIndex');
      expect(storage).toHaveProperty('close');
      
      await storage.close();
    });

    it('should handle relative paths by converting to absolute', async () => {
      const relativePath = './test-relative-' + Date.now();
      const absolutePath = path.resolve(process.cwd(), relativePath);
      
      await fs.mkdir(absolutePath, { recursive: true });
      
      try {
        const storage = await createStorage(relativePath);
        
        // Verify storage was initialized
        const result = await storage.queryPlans();
        expect(result).toHaveProperty('count');
        
        await storage.close();
      } finally {
        await fs.rm(absolutePath, { recursive: true, force: true });
      }
    });
  });

  describe('SQLite adapter integration', () => {
    let originalEnv: NodeJS.ProcessEnv;
    
    beforeEach(() => {
      originalEnv = { ...process.env };
    });
    
    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create SqliteStorage adapter when requested', async () => {
      const storage = await createStorage(tmpDir, { adapter: 'sqlite' });
      
      expect(storage).toBeInstanceOf(SqliteStorage);
      await storage.close();
    });

    it('should initialize SQLite database in user-level directory by default', async () => {
      const testHome = path.join(tmpDir, 'home');
      await fs.mkdir(testHome, { recursive: true });
      process.env.HOME = testHome;

      const storage = await createStorage(tmpDir, { adapter: 'sqlite' });
      
      // Verify database file was created
      const dbPath = path.join(testHome, '.aiknowsys', 'knowledge.db');
      const exists = await fs.access(dbPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      await storage.close();
    });

    it('should use environment variable for database path', async () => {
      const customDbPath = path.join(tmpDir, 'custom-db','knowledge.db');
      process.env.AIKNOWSYS_DB_PATH = customDbPath;

      const storage = await createStorage(tmpDir, { adapter: 'sqlite' });
      
      // Verify custom database was created
      const exists = await fs.access(customDbPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      await storage.close();
    });

    it('should use .aiknowsys.config for custom database path', async () => {
      const customDbPath = path.join(tmpDir, 'project-db', 'knowledge.db');
      const configPath = path.join(tmpDir, '.aiknowsys.config');
      
      await fs.writeFile(
        configPath,
        JSON.stringify({
          databasePath: customDbPath,
          projectId: 'test-project',
          projectName: 'Test Project'
        })
      );

      const storage = await createStorage(tmpDir, { adapter: 'sqlite' });
      
      // Verify config-specified database was created
      const exists = await fs.access(customDbPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      await storage.close();
    });

    it('should support all StorageAdapter methods with SQLite', async () => {
      const storage = await createStorage(tmpDir, { adapter: 'sqlite' });
      
      expect(storage).toHaveProperty('init');
      expect(storage).toHaveProperty('queryPlans');
      expect(storage).toHaveProperty('querySessions');
      expect(storage).toHaveProperty('search');
      expect(storage).toHaveProperty('rebuildIndex');
      expect(storage).toHaveProperty('close');
      
      // Verify methods work
      const plansResult = await storage.queryPlans();
      expect(plansResult).toHaveProperty('count');
      expect(plansResult).toHaveProperty('plans');
      
      const sessionsResult = await storage.querySessions();
      expect(sessionsResult).toHaveProperty('count');
      expect(sessionsResult).toHaveProperty('sessions');
      
      await storage.close();
    });

    it('should allow switching between JSON and SQLite adapters', async () => {
      // Create JSON storage
      const jsonStorage = await createStorage(tmpDir, { adapter: 'json' });
      expect(jsonStorage).toBeInstanceOf(JsonStorage);
      await jsonStorage.close();
      
      // Create SQLite storage (different directory to avoid conflicts)
      const sqliteDir = path.join(tmpDir, 'sqlite-test');
      await fs.mkdir(sqliteDir, { recursive: true });
      
      const sqliteStorage = await createStorage(sqliteDir, { adapter: 'sqlite' });
      expect(sqliteStorage).toBeInstanceOf(SqliteStorage);
      await sqliteStorage.close();
    });
  });
});
