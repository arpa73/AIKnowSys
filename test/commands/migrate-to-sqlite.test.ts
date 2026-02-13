import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateToSqlite } from '../../lib/commands/migrate-to-sqlite.js';
import type { MigrateToSqliteOptions } from '../../lib/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('migrate-to-sqlite command', () => {
  let testDir: string;
  let aiknowsysDir: string;
  let dbPath: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(__dirname, `../test-tmp-migrate-${Date.now()}`);
    aiknowsysDir = path.join(testDir, '.aiknowsys');
    dbPath = path.join(testDir, 'knowledge.db');
    
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(aiknowsysDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('basic functionality', () => {
    it('should create SQLite database from .aiknowsys files', async () => {
      // Create sample session file
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      const sessionContent = `---
date: 2026-02-10
topics: ["test", "migration"]
status: active
---

# Test Session

This is a test session.`;
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        sessionContent
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      await migrateToSqlite(options);

      // Verify database was created
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should migrate sessions to database', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      const sessionContent = `---
date: 2026-02-10
topics: ["test"]
status: active
---

# Test Session`;
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        sessionContent
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.sessions.migrated).toBe(1);
      expect(result.sessions.errors).toBe(0);
    });

    it('should migrate plans to database', async () => {
      const planContent = `---
title: Test Plan
author: test-user
status: ACTIVE
topics: ["testing"]
priority: high
type: feature
---

# Test Plan

This is a test plan.`;
      
      fs.writeFileSync(
        path.join(aiknowsysDir, 'PLAN_test.md'),
        planContent
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.plans.migrated).toBe(1);
      expect(result.plans.errors).toBe(0);
    });

    it('should migrate learned patterns to database', async () => {
      const learnedDir = path.join(aiknowsysDir, 'learned');
      fs.mkdirSync(learnedDir, { recursive: true });
      
      const patternContent = `---
category: error_resolution
keywords: ["test", "error"]
author: test-user
---

# Test Pattern

This is a test learned pattern.`;
      
      fs.writeFileSync(
        path.join(learnedDir, 'test-pattern.md'),
        patternContent
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.learned.migrated).toBe(1);
      expect(result.learned.errors).toBe(0);
    });
  });

  describe('dry-run mode', () => {
    it('should not create database in dry-run mode', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        '---\ndate: 2026-02-10\n---\n\n# Test'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: true
      };

      await migrateToSqlite(options);

      expect(fs.existsSync(dbPath)).toBe(false);
    });

    it('should report what would be migrated', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        '---\ndate: 2026-02-10\n---\n\n# Test'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: true
      };

      const result = await migrateToSqlite(options);

      expect(result.sessions.found).toBe(1);
      expect(result.sessions.migrated).toBe(0); // Not actually migrated in dry-run
    });
  });

  describe('error handling', () => {
    it('should handle missing .aiknowsys directory', async () => {
      fs.rmSync(aiknowsysDir, { recursive: true });

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.sessions.found).toBe(0);
      expect(result.plans.found).toBe(0);
      expect(result.learned.found).toBe(0);
    });

    it('should collect errors from invalid files', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      // Invalid YAML frontmatter
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        '---\ninvalid: [unclosed\n---\n\n# Test'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.sessions.errors).toBeGreaterThan(0);
    });

    it('should continue migration despite individual file errors', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      // Invalid file
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-bad.md'),
        '---\ninvalid: [unclosed\n---\n\n# Bad'
      );
      
      // Valid file
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-11-good.md'),
        '---\ndate: 2026-02-11\n---\n\n# Good'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result.sessions.migrated).toBeGreaterThan(0);
      expect(result.sessions.errors).toBeGreaterThan(0);
    });
  });

  describe('progress reporting', () => {
    it('should provide detailed progress in verbose mode', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        '---\ndate: 2026-02-10\n---\n\n# Test'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: true,
        dryRun: false
      };

      await migrateToSqlite(options);

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('result summary', () => {
    it('should return comprehensive migration statistics', async () => {
      const sessionsDir = path.join(aiknowsysDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(sessionsDir, '2026-02-10-session.md'),
        '---\ndate: 2026-02-10\n---\n\n# Test'
      );

      const options: MigrateToSqliteOptions = {
        dir: testDir,
        dbPath,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToSqlite(options);

      expect(result).toHaveProperty('sessions');
      expect(result).toHaveProperty('plans');
      expect(result).toHaveProperty('learned');
      
      expect(result.sessions).toHaveProperty('found');
      expect(result.sessions).toHaveProperty('migrated');
      expect(result.sessions).toHaveProperty('errors');
    });
  });
});
