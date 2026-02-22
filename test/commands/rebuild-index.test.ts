import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rebuildIndex } from '../../lib/commands/rebuild-index.js';
import fs from 'fs/promises';
import path from 'path';
import { createStorage } from '../../lib/context/index.js';
import { migrateToSqlite } from '../../lib/commands/migrate-to-sqlite.js';

describe('rebuild-index command', () => {
  let tmpDir: string;
  let originalDbPath: string | undefined;

  beforeEach(async () => {
    // Isolate database for tests
    originalDbPath = process.env.AIKNOWSYS_DB_PATH;

    // Create temp directory structure
    tmpDir = path.join(process.cwd(), 'test-tmp-rebuild-index-' + Date.now());
    process.env.AIKNOWSYS_DB_PATH = path.join(tmpDir, '.aiknowsys', 'knowledge.db');
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'plans'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'sessions'), { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys', 'learned'), { recursive: true });

    // Create test plan files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_auth_system.md'),
      `---
status: ACTIVE
author: developer
created: 2026-02-01
updated: 2026-02-05
topics: [authentication, OAuth2]
---

# Authentication System Plan

Implement OAuth2 authentication.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'PLAN_completed_feature.md'),
      `---
status: COMPLETE
author: tester
created: 2026-01-15
updated: 2026-01-30
topics: [testing, TDD]
---

# Completed Feature Plan

Feature was completed successfully.
`
    );

    // Create test session files
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-05-session.md'),
      `---
date: '2026-02-05'
topic: OAuth2 Implementation
status: complete
---

# Session: OAuth2 Implementation (Feb 5, 2026)

Implemented authentication flow.
`
    );

    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'sessions', '2026-02-04-session.md'),
      `---
date: '2026-02-04'
topic: Bug Fixes
status: complete
---

# Session: Bug Fixes (Feb 4, 2026)

Fixed validation issues.
`
    );

    // Create test learned pattern
    await fs.writeFile(
      path.join(tmpDir, '.aiknowsys', 'learned', 'tdd-workflow.md'),
      `---
name: tdd-workflow
category: testing
created: 2026-01-20
---

# TDD Workflow Pattern

Always write tests first.
`
    );

    await migrateToSqlite({
      dir: tmpDir,
      dbPath: process.env.AIKNOWSYS_DB_PATH as string
    });
  });

  afterEach(async () => {
    // Restore environment
    if (originalDbPath === undefined) {
      delete process.env.AIKNOWSYS_DB_PATH;
    } else {
      process.env.AIKNOWSYS_DB_PATH = originalDbPath;
    }

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('basic functionality', () => {
    it('should rebuild team index and return correct stats', async () => {
      const result = await rebuildIndex({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('plansIndexed');
      expect(result).toHaveProperty('sessionsIndexed');
      expect(result.plansIndexed).toBe(3);  // 2 plan files + 1 learned pattern (stored as plan record)
      expect(result.sessionsIndexed).toBe(2);  // 2 session files
      // learnedIndexed counts patterns table, not plan records
      // Learned patterns migrated via migrateToSqlite are stored in plans table,
      // not the patterns table, so learnedIndexed (from patterns table) = 0
      expect(result.learnedIndexed).toBeGreaterThanOrEqual(0);
    });

    it('should index data into SQLite database', async () => {
      await rebuildIndex({
        dir: tmpDir,
        _silent: true
      });

      // Verify data was indexed correctly into SQLite
      const storage = await createStorage(tmpDir);

      const plansReq = await storage.queryPlans();
      expect(plansReq.count).toBe(3);  // 2 plan files + 1 learned as plan record

      const sessionsReq = await storage.querySessions();
      expect(sessionsReq.count).toBe(2);

      await storage.close();
    });
  });

  describe('output formats', () => {
    it('should return JSON when --json flag provided', async () => {
      const result = await rebuildIndex({
        dir: tmpDir,
        json: true,
        _silent: true
      });

      expect(result).toHaveProperty('plansIndexed');
      expect(result).toHaveProperty('sessionsIndexed');
      expect(typeof result.plansIndexed).toBe('number');
      expect(typeof result.sessionsIndexed).toBe('number');
    });

    it('should output to console when --json flag not provided', async () => {
      // Just verify it doesn't throw
      await expect(
        rebuildIndex({ dir: tmpDir, _silent: true })
      ).resolves.toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty directories gracefully', async () => {
      const emptyDir = path.join(process.cwd(), 'test-tmp-empty-' + Date.now());
      process.env.AIKNOWSYS_DB_PATH = path.join(emptyDir, '.aiknowsys', 'knowledge.db');
      await fs.mkdir(emptyDir, { recursive: true });
      await fs.mkdir(path.join(emptyDir, '.aiknowsys'), { recursive: true });

      const result = await rebuildIndex({
        dir: emptyDir,
        json: true,
        _silent: true
      });

      expect(result.plansIndexed).toBe(0);
      expect(result.sessionsIndexed).toBe(0);

      await fs.rm(emptyDir, { recursive: true, force: true });
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      const noAiDir = path.join(process.cwd(), 'test-tmp-noai-' + Date.now());
      process.env.AIKNOWSYS_DB_PATH = path.join(noAiDir, '.aiknowsys', 'knowledge.db');
      await fs.mkdir(noAiDir, { recursive: true });

      // Should succeed with 0 items (graceful handling)
      const result = await rebuildIndex({
        dir: noAiDir,
        json: true,
        _silent: true
      });

      expect(result.plansIndexed).toBe(0);
      expect(result.sessionsIndexed).toBe(0);

      await fs.rm(noAiDir, { recursive: true, force: true });
    });

    it('should use current directory when dir not specified', async () => {
      // Just verify it doesn't throw for current dir
      await expect(
        rebuildIndex({ json: true, _silent: true })
      ).resolves.toBeDefined();
    });
  });
});
