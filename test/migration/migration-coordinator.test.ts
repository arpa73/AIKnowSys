import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { MigrationCoordinator } from '../../lib/migration/migration-coordinator.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';

describe('MigrationCoordinator', () => {
  let tmpDir: string;
  let dbPath: string;
  let storage: SqliteStorage;
  let coordinator: MigrationCoordinator;

  beforeEach(async () => {
    // Create temp directory for tests
    tmpDir = path.join(process.cwd(), 'test-tmp-migration-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Create test database
    dbPath = path.join(tmpDir, 'test.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);
    
    coordinator = new MigrationCoordinator(storage);
  });

  afterEach(async () => {
    // Cleanup
    await storage.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('migrateFromDirectory', () => {
    it('should migrate session files to database', async () => {
      // Setup test structure
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      
      // Create test session file
      const sessionContent = `---
date: 2026-02-12
topic: Test Session
status: complete
topics:
  - testing
  - migration
---

# Test Session

This is test content.`;
      
      await fs.writeFile(path.join(sessionsDir, '2026-02-12-test.md'), sessionContent);
      
      // Migrate
      const migrationResult = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(migrationResult.sessionsMigrated).toBe(1);
      expect(migrationResult.errors).toEqual([]);
      
      // Verify in database
      const sessionResult = await storage.querySessions({});
      expect(sessionResult.sessions.length).toBe(1);
      expect(sessionResult.sessions[0].date).toBe('2026-02-12');
      expect(sessionResult.sessions[0].topics).toContain('testing');
      expect(sessionResult.sessions[0].topics).toContain('migration');
    });

    it('should migrate plan files to database', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      // Create test plan file
      const planContent = `---
title: Test Plan
author: test-user
status: ACTIVE
topics:
  - feature
  - implementation
---

# Test Plan

Plan details here.`;
      
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), planContent);
      
      // Migrate
      const migrationResult = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(migrationResult.plansMigrated).toBe(1);
      expect(migrationResult.errors).toEqual([]);
      
      // Verify in database
      const planResult = await storage.queryPlans({});
      expect(planResult.plans.length).toBe(1);
      expect(planResult.plans[0].title).toBe('Test Plan');
      expect(planResult.plans[0].status).toBe('ACTIVE');
    });

    it('should migrate learned pattern files to database', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const learnedDir = path.join(aiknowsysDir, 'learned');
      await fs.mkdir(learnedDir, { recursive: true });
      
      // Create test learned pattern
      const learnedContent = `---
category: error-resolution
keywords:
  - migration
  - database
author: test-user
---

# Error Resolution Pattern

How to fix migration errors.`;
      
      await fs.writeFile(path.join(learnedDir, 'migration-errors.md'), learnedContent);
      
      // Migrate
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(result.learnedMigrated).toBe(1);
      expect(result.errors).toEqual([]);
      
      // Verify searchable content created
      const searchResult = await storage.search('migration errors', 'all');
      expect(searchResult.results.length).toBeGreaterThan(0);
    });

    it('should preserve markdown content in database', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      
      const sessionContent = `---
date: 2026-02-12
status: complete
---

# Session Title

## Section 1

Content with **bold** and *italic*.

\`\`\`typescript
const code = 'example';
\`\`\`

## Section 2

More content.`;
      
      await fs.writeFile(path.join(sessionsDir, '2026-02-12-test.md'), sessionContent);
      
      // Migrate
      await coordinator.migrateFromDirectory(tmpDir);
      
      // Verify metadata preserved
      const sessionResult = await storage.querySessions({});
      expect(sessionResult.sessions[0].date).toBe('2026-02-12');
      expect(sessionResult.sessions[0].topic).toBeTruthy();
      // Content is stored but not part of metadata query
    });

    it('should handle files without frontmatter', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const learnedDir = path.join(aiknowsysDir, 'learned');
      await fs.mkdir(learnedDir, { recursive: true });
      
      // File without frontmatter
      const content = '# Pattern\n\nJust content, no frontmatter.';
      await fs.writeFile(path.join(learnedDir, 'pattern.md'), content);
      
      // Migrate
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      // Should still migrate with empty metadata
      expect(result.learnedMigrated).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it('should report parsing errors but continue migration', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      
      // Invalid YAML
      const badSession = `---
date: 2026-02-12
broken: [unclosed array
---

Content`;
      
      // Valid session
      const goodSession = `---
date: 2026-02-13
---

Good content`;
      
      await fs.writeFile(path.join(sessionsDir, 'bad.md'), badSession);
      await fs.writeFile(path.join(sessionsDir, 'good.md'), goodSession);
      
      // Migrate
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      // Should migrate the good one
      expect(result.sessionsMigrated).toBeGreaterThan(0);
      // Should report errors for the bad one
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e: string) => e.includes('bad.md'))).toBe(true);
    });

    it('should return migration statistics', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(path.join(aiknowsysDir, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(aiknowsysDir, 'learned'), { recursive: true });
      
      // Create multiple files
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-01-01.md'), '---\ndate: 2026-01-01\n---\nContent');
      await fs.writeFile(path.join(aiknowsysDir, 'sessions', '2026-01-02.md'), '---\ndate: 2026-01-02\n---\nContent');
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_test.md'), '---\ntitle: Test\n---\nContent');
      await fs.writeFile(path.join(aiknowsysDir, 'learned', 'pattern.md'), '---\ncategory: test\n---\nContent');
      
      // Migrate
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(result.sessionsMigrated).toBe(2);
      expect(result.plansMigrated).toBe(1);
      expect(result.learnedMigrated).toBe(1);
      expect(result.totalFiles).toBe(4);
      expect(result.errors).toEqual([]);
    });

    it('should handle missing .aiknowsys directory gracefully', async () => {
      // No .aiknowsys directory
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(result.sessionsMigrated).toBe(0);
      expect(result.plansMigrated).toBe(0);
      expect(result.learnedMigrated).toBe(0);
      expect(result.totalFiles).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should skip files that are already in database', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      
      const sessionContent = `---
date: 2026-02-12
---

Content`;
      
      await fs.writeFile(path.join(sessionsDir, '2026-02-12-test.md'), sessionContent);
      
      // Migrate first time
      const result1 = await coordinator.migrateFromDirectory(tmpDir);
      expect(result1.sessionsMigrated).toBe(1);
      
      // Migrate again (should skip)
      const result2 = await coordinator.migrateFromDirectory(tmpDir);
      expect(result2.sessionsMigrated).toBe(0);
      expect(result2.skipped).toBe(1);
      
      // Verify still only one session in database
      const result = await storage.querySessions({});
      expect(result.sessions.length).toBe(1);
    });

    it('should extract plan ID from PLAN_*.md filename', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      await fs.mkdir(aiknowsysDir, { recursive: true });
      
      const planContent = `---
title: Migration Plan
---

Plan details`;
      
      await fs.writeFile(path.join(aiknowsysDir, 'PLAN_mcp_migration.md'), planContent);
      
      // Migrate
      await coordinator.migrateFromDirectory(tmpDir);
      
      // Verify plan ID extracted from filename
      const result = await storage.queryPlans({});
      expect(result.plans.length).toBe(1);
      expect(result.plans[0].id).toBe('mcp_migration');
    });

    it('should handle nested learned pattern directories', async () => {
      const aiknowsysDir = path.join(tmpDir, '.aiknowsys');
      const learnedDir = path.join(aiknowsysDir, 'learned');
      await fs.mkdir(path.join(learnedDir, 'errors', 'database'), { recursive: true });
      
      const pattern1 = '---\ncategory: error\n---\nPattern 1';
      const pattern2 = '---\ncategory: error\n---\nPattern 2';
      
      await fs.writeFile(path.join(learnedDir, 'pattern1.md'), pattern1);
      await fs.writeFile(path.join(learnedDir, 'errors', 'pattern2.md'), pattern2);
      await fs.writeFile(path.join(learnedDir, 'errors', 'database', 'pattern3.md'), pattern2);
      
      // Migrate
      const result = await coordinator.migrateFromDirectory(tmpDir);
      
      expect(result.learnedMigrated).toBe(3);
    });
  });
});
