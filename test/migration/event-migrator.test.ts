/**
 * Event Migration Tests - Phase 2.1
 * Tests for converting markdown sessions → events
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { EventMigrator } from '../../dist/lib/migration/event-migrator.js';
import { EventType } from '../../dist/lib/events/types.js';

interface TestStatement {
  run(...args: unknown[]): unknown;
}

interface TestDb {
  prepare(sql: string): TestStatement;
}

interface TestStorageWithDb {
  db: TestDb;
}

function getTestDb(storage: SqliteStorage): TestDb {
  return (storage as unknown as TestStorageWithDb).db;
}

describe('Event Migrator - Phase 2.1', () => {
  let storage: SqliteStorage;
  let migrator: EventMigrator;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(process.cwd(), `test-tmp-migrator-${Date.now()}`);
    await fs.mkdir(dbPath, { recursive: true });
    
    storage = new SqliteStorage();
    await storage.init(dbPath);
    migrator = new EventMigrator(storage);

    // Insert test project for foreign key constraints
    await storage.insertProject({
      id: 'test-proj',
      name: 'Test Project',
      path: '/tmp/test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  afterEach(async () => {
    await storage.close();
    await fs.rm(dbPath, { recursive: true, force: true });
  });

  describe('Markdown Parsing', () => {
    it('should parse session frontmatter', async () => {
      const markdown = `---
title: "Test Session"
date: "2026-02-15"
topics: ["testing", "migration"]
---

## Session: Test Session (Feb 15, 2026)

**Goal:** Test markdown parsing
`;

      const sessionId = 'parse-001';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test Session', markdown);

      const result = await migrator.migrateSession(sessionId);

      expect(result.success).toBe(true);
      expect(result.eventsCreated).toBeGreaterThan(0);
    });

    it('should extract session_started event from goal', async () => {
      const markdown = `## Session: Implement Feature X (Feb 15, 2026)

**Goal:** Implement authentication system

## Changes
- Added JWT support
`;

      const sessionId = 'parse-002';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      await migrator.migrateSession(sessionId);

      const events = await storage.queryEvents({ sessionId });
      const sessionStarted = events.find(e => e.eventType === EventType.SESSION_STARTED);

      expect(sessionStarted).toBeDefined();
      expect(sessionStarted?.data).toHaveProperty('title');
    });

    it('should extract task_completed events from Changes section', async () => {
      const markdown = `## Session: Test (Feb 15, 2026)

**Goal:** Test migration

## Changes
- [lib/auth.ts](lib/auth.ts#L10): Implemented JWT authentication
- [test/auth.test.ts](test/auth.test.ts): Added 42 tests for auth

## Validation
- ✅ Tests: 42/42 passing
`;

      const sessionId = 'parse-003';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      await migrator.migrateSession(sessionId);

      const events = await storage.queryEvents({ sessionId });
      const fileChanges = events.filter(e => e.eventType === EventType.FILE_CHANGED);

      expect(fileChanges.length).toBeGreaterThan(0);
      expect(fileChanges.some(e => e.data.filePath === 'lib/auth.ts')).toBe(true);
    });

    it('should extract validation_passed events from Validation section', async () => {
      const markdown = `## Session: Test (Feb 15, 2026)

**Goal:** Test migration

## Validation
- ✅ Tests: 164/164 passing
- ✅ Build: Clean compilation
- ✅ Lint: No errors
`;

      const sessionId = 'parse-004';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      await migrator.migrateSession(sessionId);

      const events = await storage.queryEvents({ sessionId });
      const validation = events.filter(e => e.eventType === EventType.VALIDATION_PASSED);

      expect(validation.length).toBeGreaterThan(0);
      expect(validation.some(e => e.data.result?.includes('164'))).toBe(true);
    });

    it('should extract learning_captured events from Key Learning section', async () => {
      const markdown = `## Session: Test (Feb 15, 2026)

**Goal:** Test migration

## Key Learning
Always validate input at API boundaries to prevent injection attacks.
Used Joi schema validation for all endpoints.
`;

      const sessionId = 'parse-005';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      await migrator.migrateSession(sessionId);

      const events = await storage.queryEvents({ sessionId });
      const learning = events.filter(e => e.eventType === EventType.LEARNING_CAPTURED);

      expect(learning.length).toBeGreaterThan(0);
      expect(learning[0].data.learning).toContain('validate input');
    });
  });

  describe('Migration Safety', () => {
    it('should preserve original markdown after migration', async () => {
      const originalMarkdown = '## Session: Test\n\n**Goal:** Test preservation';
      const sessionId = 'preserve-001';

      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', originalMarkdown);

      await migrator.migrateSession(sessionId);

      // Verify markdown still exists
      const session = await storage.getSessionById(sessionId);
      expect(session?.content).toBe(originalMarkdown);
    });

    it('should be idempotent (safe to run multiple times)', async () => {
      const markdown = '## Session: Test\n\n**Goal:** Test idempotency';
      const sessionId = 'idempotent-001';

      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      // Run migration twice
      const result1 = await migrator.migrateSession(sessionId);
      const result2 = await migrator.migrateSession(sessionId);

      // Should skip second migration or handle gracefully
      expect(result2.success).toBe(true);
      expect(result2.skipped).toBe(true);
    });

    it('should handle malformed markdown gracefully', async () => {
      const malformedMarkdown = `This is not properly formatted markdown
No frontmatter
No standard sections
Just random text`;

      const sessionId = 'malformed-001';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', malformedMarkdown);

      const result = await migrator.migrateSession(sessionId);

      // Should not crash, but report partial success
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
    });

    it('should report detailed migration statistics', async () => {
      const markdown = `## Session: Complex Session (Feb 15, 2026)

**Goal:** Test complex migration

## Changes
- File 1 changed
- File 2 changed
- File 3 changed

## Validation
- ✅ All tests pass

## Key Learning
- Learning 1
`;

      const sessionId = 'stats-001';
      const db = getTestDb(storage);
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run(sessionId, 'test-proj', '2026-02-15', 'Test', markdown);

      const result = await migrator.migrateSession(sessionId);

      expect(result).toHaveProperty('eventsCreated');
      expect(result).toHaveProperty('eventTypes');
      expect(result.eventsCreated).toBeGreaterThan(0);
      expect(result.eventTypes).toContain(EventType.SESSION_STARTED);
    });
  });

  describe('Batch Migration', () => {
    it('should migrate multiple sessions', async () => {
      // Create 3 sessions
      const db = getTestDb(storage);
      for (let i = 1; i <= 3; i++) {
        db.prepare(`
          INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
        `).run(`batch-00${i}`, 'test-proj', `Session ${i}`, '2026-02-15T10:00:00Z', `## Session ${i}\n\n**Goal:** Test`);
      }

      const result = await migrator.migrateAllSessions();

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should continue migration even if one session fails', async () => {
      const db = getTestDb(storage);
      
      // Session 1: Valid
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run('batch-001', 'test-proj', '2026-02-15', 'Session 1', '## Session 1\n\n**Goal:** Test');

      // Session 2: Invalid (missing content)
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run('batch-002', 'test-proj', '2026-02-15', 'Session 2', null);

      // Session 3: Valid
      db.prepare(`
        INSERT INTO sessions (id, project_id, date, topic, status, content, topics, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'complete', ?, '[]', datetime('now'), datetime('now'))
      `).run('batch-003', 'test-proj', '2026-02-15', 'Session 3', '## Session 3\n\n**Goal:** Test');

      const result = await migrator.migrateAllSessions();

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
