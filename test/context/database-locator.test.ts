import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { DatabaseLocator } from '../../lib/context/database-locator.js';

describe('DatabaseLocator', () => {
  let tmpDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalHome: string | undefined;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-db-locator-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });

    // Save original environment
    originalEnv = { ...process.env };
    originalHome = process.env.HOME;
  });

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv;
    if (originalHome) {
      process.env.HOME = originalHome;
    }

    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('getDatabaseConfig', () => {
    it('should return user-level database by default', async () => {
      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config.dbPath).toContain('.aiknowsys');
      expect(config.dbPath).toContain('knowledge.db');
      expect(config.projectId).toBeDefined();
      expect(config.projectName).toBeDefined();
    });

    it('should use HOME directory for user-level database', async () => {
      // Set known HOME for testing
      const testHome = path.join(tmpDir, 'home');
      await fs.mkdir(testHome, { recursive: true });
      process.env.HOME = testHome;

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config.dbPath).toBe(path.join(testHome, '.aiknowsys', 'knowledge.db'));
    });

    it('should read custom database path from .aiknowsys.config', async () => {
      const customDbPath = path.join(tmpDir, 'custom', 'mydb.db');
      const configPath = path.join(tmpDir, '.aiknowsys.config');

      await fs.writeFile(
        configPath,
        JSON.stringify({
          databasePath: customDbPath,
          projectId: 'custom-project',
          projectName: 'Custom Project'
        })
      );

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config.dbPath).toBe(customDbPath);
      expect(config.projectId).toBe('custom-project');
      expect(config.projectName).toBe('Custom Project');
    });

    it('should use environment variable AIKNOWSYS_DB_PATH if set', async () => {
      const envDbPath = path.join(tmpDir, 'env', 'database.db');
      process.env.AIKNOWSYS_DB_PATH = envDbPath;

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config.dbPath).toBe(envDbPath);
    });

    it('should prioritize environment variable over config file', async () => {
      const envDbPath = path.join(tmpDir, 'env', 'database.db');
      const configDbPath = path.join(tmpDir, 'config', 'database.db');

      process.env.AIKNOWSYS_DB_PATH = envDbPath;

      const configPath = path.join(tmpDir, '.aiknowsys.config');
      await fs.writeFile(
        configPath,
        JSON.stringify({ databasePath: configDbPath })
      );

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config.dbPath).toBe(envDbPath);
    });

    it('should generate project ID from directory name if no config', async () => {
      const projectDir = path.join(tmpDir, 'my-awesome-project');
      await fs.mkdir(projectDir, { recursive: true });

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(projectDir);

      expect(config.projectId).toContain('my-awesome-project');
      expect(config.projectName).toBe('my-awesome-project');
    });

    it('should handle missing .aiknowsys.config gracefully', async () => {
      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(config).toBeDefined();
      expect(config.dbPath).toBeDefined();
      expect(config.projectId).toBeDefined();
    });

    it('should handle invalid .aiknowsys.config JSON gracefully', async () => {
      const configPath = path.join(tmpDir, '.aiknowsys.config');
      await fs.writeFile(configPath, 'invalid-json{{{');

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      // Should fall back to defaults
      expect(config).toBeDefined();
      expect(config.dbPath).toBeDefined();
    });

    it('should resolve relative paths in config to absolute', async () => {
      const configPath = path.join(tmpDir, '.aiknowsys.config');
      await fs.writeFile(
        configPath,
        JSON.stringify({ databasePath: './relative/path/db.sqlite' })
      );

      const locator = new DatabaseLocator();
      const config = await locator.getDatabaseConfig(tmpDir);

      expect(path.isAbsolute(config.dbPath)).toBe(true);
      expect(config.dbPath).toContain('relative');
    });

    it('should create database directory if it does not exist', async () => {
      const customDbPath = path.join(tmpDir, 'new-dir', 'nested', 'knowledge.db');
      process.env.AIKNOWSYS_DB_PATH = customDbPath;

      const locator = new DatabaseLocator();
      await locator.getDatabaseConfig(tmpDir);

      // Directory should be created
      const dbDir = path.dirname(customDbPath);
      const exists = await fs.access(dbDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('getProjectId', () => {
    it('should generate project ID from git remote if available', async () => {
      // Create fake git directory
      const gitDir = path.join(tmpDir, '.git');
      const gitConfig = path.join(gitDir, 'config');
      await fs.mkdir(gitDir, { recursive: true });
      await fs.writeFile(
        gitConfig,
        '[remote "origin"]\n\turl = git@github.com:owner/repo.git\n'
      );

      const locator = new DatabaseLocator();
      const projectId = await locator.getProjectId(tmpDir);

      expect(projectId).toContain('owner');
      expect(projectId).toContain('repo');
    });

    it('should fall back to directory name if no git remote', async () => {
      const projectDir = path.join(tmpDir, 'standalone-project');
      await fs.mkdir(projectDir, { recursive: true });

      const locator = new DatabaseLocator();
      const projectId = await locator.getProjectId(projectDir);

      expect(projectId).toContain('standalone-project');
    });

    it('should sanitize project ID (no spaces, lowercase)', async () => {
      const projectDir = path.join(tmpDir, 'My Project With Spaces');
      await fs.mkdir(projectDir, { recursive: true });

      const locator = new DatabaseLocator();
      const projectId = await locator.getProjectId(projectDir);

      expect(projectId).not.toContain(' ');
      expect(projectId.toLowerCase()).toBe(projectId);
    });
  });
});
