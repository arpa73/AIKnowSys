/**
 * Integration tests for migrate-to-sqlite command
 * Tests the full migration pipeline with realistic .aiknowsys structure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateToSqlite } from '../../lib/commands/migrate-to-sqlite.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import type { MigrateToSqliteOptions } from '../../lib/types/index.js';

describe('migrate-to-sqlite integration tests', () => {
  let testDir: string;
  let dbPath: string;

  beforeEach(() => {
    // Create temporary directory for test database
    testDir = mkdtempSync(join(tmpdir(), 'integration-test-'));
    dbPath = join(testDir, 'aiknowsys.db');
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Full Migration Pipeline', () => {
    it('should migrate session files to database', async () => {
      // GIVEN: Integration test fixtures with a session file
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Migration succeeds
      expect(result.sessions.migrated).toBeGreaterThan(0);

      // AND: Database exists
      expect(existsSync(dbPath)).toBe(true);

      // AND: Session data can be queried
      const storage = new SqliteStorage();
      await storage.init(dbPath);
      const { sessions } = await storage.querySessions({});
      expect(sessions).toBeDefined();
      expect(sessions.length).toBeGreaterThan(0);

      // AND: Session content matches source file
      const session = sessions[0];
      expect(session?.date).toBe('2026-02-10');
      expect(session?.topics).toContain('testing');
      expect(session?.topics).toContain('integration');
      expect(session?.plan).toBe('test_migration'); // Plan ID without PLAN_ prefix

      await storage.close();
    });

    it('should migrate plan files to database', async () => {
      // GIVEN: Integration test fixtures with a plan file
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Migration succeeds
      expect(result.plans.migrated).toBeGreaterThan(0);

      // AND: Plan data can be queried
      const storage = new SqliteStorage();
      await storage.init(dbPath);
      const { plans } = await storage.queryPlans({});
      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);

      // AND: Plan content matches source file (find the specific plan)
      const plan = plans.find(p => p.id === 'test_migration');
      expect(plan).toBeDefined();
      expect(plan?.title).toBe('Test Migration Plan');
      expect(plan?.author).toBe('test-user');
      expect(plan?.status).toBe('ACTIVE');
      expect(plan?.topics).toContain('migration');
      expect(plan?.topics).toContain('testing');

      await storage.close();
    });

    it('should migrate learned patterns to database', async () => {
      // GIVEN: Integration test fixtures with learned pattern
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Migration succeeds
      expect(result.learned.migrated).toBeGreaterThan(0);

      // AND: Learned patterns are queryable as plans (current implementation)
      const storage = new SqliteStorage();
      await storage.init(dbPath);
      const { plans } = await storage.queryPlans({});
      
      // Filter for learned pattern (stored as plan with specific ID pattern)
      const learnedPattern = plans.find(p => p.id === 'learned_testpattern');
      expect(learnedPattern).toBeDefined();
      expect(learnedPattern?.topics).toContain('integration');
      expect(learnedPattern?.topics).toContain('migration');

      await storage.close();
    });

    it('should report accurate migration statistics', async () => {
      // GIVEN: Integration test fixtures
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Statistics are accurate
      expect(result.sessions.migrated).toBe(1);
      expect(result.plans.migrated).toBe(1);
      expect(result.learned.migrated).toBe(1);
      expect(result.sessions.errors).toBe(0);
      expect(result.plans.errors).toBe(0);
      expect(result.learned.errors).toBe(0);
    });

    it('should support dry-run mode without creating database', async () => {
      // GIVEN: Integration test fixtures and dry-run mode
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: true,
        verbose: false,
      };

      // WHEN: Running migration in dry-run mode
      const result = await migrateToSqlite(options);

      // THEN: Migration reports found files
      expect(result.sessions.found).toBeGreaterThan(0);

      // BUT: Database is not created
      expect(existsSync(dbPath)).toBe(false);
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      // GIVEN: Non-existent .aiknowsys path
      const nonExistentPath = join(testDir, 'non-existent');
      const options: MigrateToSqliteOptions = {
        dir: nonExistentPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Migration succeeds with zero items
      expect(result.sessions.migrated).toBe(0);
      expect(result.plans.migrated).toBe(0);
      expect(result.learned.migrated).toBe(0);
    });

    it('should handle empty .aiknowsys directory', async () => {
      // GIVEN: Empty .aiknowsys directory
      const emptyPath = join(testDir, 'empty-aiknowsys');
      const options: MigrateToSqliteOptions = {
        dir: emptyPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const result = await migrateToSqlite(options);

      // THEN: Migration succeeds but with zero items
      expect(result.sessions.migrated).toBe(0);
      expect(result.plans.migrated).toBe(0);
      expect(result.learned.migrated).toBe(0);
    });

    it('should verify round-trip data integrity', async () => {
      // GIVEN: Integration test fixtures
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      await migrateToSqlite(options);

      // THEN: Data can be queried back accurately
      const storage = new SqliteStorage();
      await storage.init(dbPath);

      // Verify session
      const { sessions } = await storage.querySessions({ date: '2026-02-10' });
      expect(sessions.length).toBe(1);
      expect(sessions[0]?.duration).toBe('2h');
      expect(sessions[0]?.plan).toBe('test_migration'); // Without PLAN_ prefix

      // Verify plan
      const { plans } = await storage.queryPlans({ status: 'ACTIVE' });
      expect(plans.length).toBe(1);
      expect(plans[0]?.title).toBe('Test Migration Plan');
      expect(plans[0]?.author).toBe('test-user');

      // Verify learned pattern (stored as plan)
      const allPlans = await storage.queryPlans({});
      const learnedPattern = allPlans.plans.find(p => p.id === 'learned_testpattern');
      expect(learnedPattern).toBeDefined();

      await storage.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid database paths gracefully', async () => {
      // GIVEN: An invalid database path  
      const invalidDbPath = '/root/cannot-write-here/aiknowsys.db';
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath: invalidDbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      // THEN: Migration should fail (permission error will be thrown)
      await expect(migrateToSqlite(options)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete migration within reasonable time', async () => {
      // GIVEN: Integration test fixtures
      const fixturesPath = join(process.cwd(), 'test/integration/fixtures');
      const options: MigrateToSqliteOptions = {
        dir: fixturesPath,
        dbPath,
        dryRun: false,
        verbose: false,
      };

      // WHEN: Running migration
      const startTime = Date.now();
      const result = await migrateToSqlite(options);
      const duration = Date.now() - startTime;

      // THEN: Migration completes quickly (< 5 seconds for small dataset)
      const MAX_MIGRATION_TIME_MS = 5000;
      expect(result.sessions.migrated + result.plans.migrated + result.learned.migrated).toBeGreaterThan(0);
      expect(duration).toBeLessThan(MAX_MIGRATION_TIME_MS);
    });
  });
});
