/**
 * Hybrid Storage Integration Tests - Phase 2.1
 * 
 * Tests storing BOTH events AND markdown when creating sessions/plans
 * Ensures backward compatibility while enabling event-sourced queries
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import { createSessionCore } from '../../dist/lib/core/create-session.js';
import type { KnowledgeEvent } from '../../dist/lib/events/types.js';

describe('Hybrid Storage (Events + Markdown)', () => {
  let storage: SqliteStorage;
  let tmpDir: string;

  beforeEach(async () => {
    // Create temporary directory
    tmpDir = path.join(process.cwd(), `test-tmp-hybrid-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(path.join(tmpDir, '.aiknowsys'), { recursive: true });

    // Initialize storage with temporary database
    const dbPath = path.join(tmpDir, '.aiknowsys', 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(tmpDir, { dbPath });
  });

  afterEach(async () => {
    // Cleanup
    await storage.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('Hybrid Write (Create Session)', () => {
    it('should store events when creating a new session', async () => {
      // Create session with title and goal
      const result = await createSessionCore({
        title: 'Implement Feature X',
        topics: ['feature', 'implementation'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      expect(result.created).toBe(true);

      // Query events for this session
      const sessionId = path.basename(result.filePath, '.md');
      const events = await storage.queryEvents({ sessionId });

      // Should have at least session_started and goal_defined events
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some(e => e.eventType === 'session_started')).toBe(true);
      expect(events.some(e => e.eventType === 'goal_defined')).toBe(true);
    });

    it('should generate markdown from events when creating session', async () => {
      // Create session
      const result = await createSessionCore({
        title: 'Test Session',
        topics: ['testing'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      // Read markdown file
      const markdown = await fs.readFile(result.filePath, 'utf-8');

      // Should contain session title and goal (event-generated format)
      expect(markdown).toContain('## Session: Test Session');
      expect(markdown).toContain('**Goal:**'); // Event format uses bold Goal instead of header
      expect(markdown).toContain('Test Session'); // The goal text
    });

    it('should allow querying session via events (not just markdown)', async () => {
      // Create session
      const result = await createSessionCore({
        title: 'Event Query Test',
        topics: ['events', 'query'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      const sessionId = path.basename(result.filePath, '.md');

      // Should be able to query events by type
      const goalEvents = await storage.queryEvents({
        sessionId,
        eventType: 'goal_defined'
      });

      expect(goalEvents.length).toBe(1);
      expect(goalEvents[0].eventType).toBe('goal_defined');
    });

    it('should store project context in events', async () => {
      // Create session
      const result = await createSessionCore({
        title: 'Project Context Test',
        topics: ['project'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      const sessionId = path.basename(result.filePath, '.md');
      const events = await storage.queryEvents({ sessionId });

      // All events should have projectId (derived from directory)
      expect(events.length).toBeGreaterThan(0);
      events.forEach(event => {
        expect(event.projectId).toBeTruthy();
        expect(event.projectId).not.toBe('default');
      });
    });
  });

  describe('Event-to-Markdown Sync', () => {
    it('should generate markdown that matches event data', async () => {
      // Create session with specific goal
      const goalText = 'Complete Phase 2.1 hybrid storage implementation';
      const result = await createSessionCore({
        title: goalText,
        topics: ['phase-2.1'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      // Read generated markdown
      const markdown = await fs.readFile(result.filePath, 'utf-8');

      // Markdown should contain the goal from events
      expect(markdown).toContain(goalText);
    });

    it('should update markdown when new events are added', async () => {
      // Create initial session
      const result = await createSessionCore({
        title: 'Dynamic Session',
        topics: ['dynamic'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      const sessionId = path.basename(result.filePath, '.md');
      const projectId = path.basename(tmpDir);

      // Add a new event (task completed)
      await storage.insertEvent({
        eventId: `evt-${Date.now()}`,
        projectId, // Use correct projectId from tmpDir
        sessionId,
        timestamp: new Date().toISOString(),
        eventType: 'task_completed',
        data: {
          description: 'Implemented hybrid storage tests',
          outcome: 'success',
          filesChanged: ['test/integration/hybrid-storage.test.ts']
        }
      });

      // Re-generate markdown from events
      const events = await storage.queryEvents({ sessionId });
      const { MarkdownGenerator } = await import('../../dist/lib/events/markdown-generator.js');
      const generator = new MarkdownGenerator();
      const updatedMarkdown = generator.generateSessionMarkdown(events, 'Dynamic Session');

      // Should contain the new task
      expect(updatedMarkdown).toContain('Implemented hybrid storage tests');
      expect(updatedMarkdown).toContain('test/integration/hybrid-storage.test.ts');
    });
  });

  describe('Backward Compatibility', () => {
    it('should still support pure markdown sessions (no events)', async () => {
      // Create old-style markdown session (no events stored)
      const date = new Date().toISOString().split('T')[0];
      const sessionFile = path.join(tmpDir, '.aiknowsys', 'sessions', `${date}-old-session.md`);
      await fs.mkdir(path.dirname(sessionFile), { recursive: true });
      await fs.writeFile(sessionFile, `---
date: ${date}
topics: ["old", "markdown"]
status: complete
---

# Session: Old Style Session

## Goal
Test backward compatibility

## Changes
- Created old-style session

## Notes for Next Session
This session has NO events in the database
`, 'utf-8');

      // Should still be queryable via markdown (existing behavior)
      const markdown = await fs.readFile(sessionFile, 'utf-8');
      expect(markdown).toContain('Old Style Session');

      // But should have zero events
      const events = await storage.queryEvents({ sessionId: `${date}-old-session` });
      expect(events.length).toBe(0);
    });

    it('should prefer events over markdown when both exist', async () => {
      // This tests the eventual "events-first" query behavior
      // For now, just verify we CAN store both
      const result = await createSessionCore({
        title: 'Hybrid Session',
        topics: ['hybrid'],
        plan: null,
        targetDir: tmpDir,
        storage,
        writeMarkdown: true
      });

      const sessionId = path.basename(result.filePath, '.md');

      // Has events?
      const events = await storage.queryEvents({ sessionId });
      expect(events.length).toBeGreaterThan(0);

      // Has markdown?
      const markdown = await fs.readFile(result.filePath, 'utf-8');
      expect(markdown.length).toBeGreaterThan(0);

      // Both exist ✅
    });
  });

  describe('Migration Tool Integration', () => {
    it('should migrate old markdown sessions to events', async () => {
      // Create old-style markdown session
      const date = '2026-02-10';
      const sessionFile = path.join(tmpDir, '.aiknowsys', 'sessions', `${date}-legacy.md`);
      await fs.mkdir(path.dirname(sessionFile), { recursive: true });
      await fs.writeFile(sessionFile, `---
date: ${date}
topics: ["legacy", "migration"]
status: complete
---

# Session: Legacy Session (Feb 10, 2026)

## Goal
Demonstrate migration from markdown to events

## Changes
- Wrote 5 tests for hybrid storage
- All tests passing

## Validation
- ✅ Tests: 5/5 passing
- ✅ Build: Clean

## Key Learning
Hybrid storage enables gradual migration from markdown to event-sourced data
`, 'utf-8');

      // Create project record first (required for FK constraint)
      const projectId = path.basename(tmpDir);
      await storage.insertProject({
        id: projectId,
        name: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Insert into sessions table (so it's queryable)
      await storage.insertSession({
        id: `${date}-legacy`,
        project_id: projectId,
        date,
        topic: 'Legacy Session',
        status: 'complete',
        content: await fs.readFile(sessionFile, 'utf-8'),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      // Migrate using EventMigrator
      const { EventMigrator } = await import('../../dist/lib/migration/event-migrator.js');
      const migrator = new EventMigrator(storage);
      const migrationResult = await migrator.migrateSession(`${date}-legacy`);

      // Should successfully create events
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.eventsCreated).toBeGreaterThan(0);
      expect(migrationResult.originalPreserved).toBe(true);

      // Should have extracted multiple event types
      expect(migrationResult.eventTypes.length).toBeGreaterThan(0);
    });

    it('should be idempotent (safe to migrate multiple times)', async () => {
      // Create and migrate session
      const date = '2026-02-11';
      const sessionId = `${date}-idempotent`;
      const sessionFile = path.join(tmpDir, '.aiknowsys', 'sessions', `${sessionId}.md`);
      await fs.mkdir(path.dirname(sessionFile), { recursive: true });
      await fs.writeFile(sessionFile, `---
date: ${date}
topics: ["idempotent"]
status: complete
---

# Session: Test Idempotence

## Goal
Verify migration can be run multiple times safely

## Changes
- Implemented idempotency check
- Added validation for duplicate migrations

## Validation
- ✅ Tests: All passing
`, 'utf-8');

      // Create project record first (required for FK constraint)
      const projectId = path.basename(tmpDir);
      await storage.insertProject({
        id: projectId,
        name: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await storage.insertSession({
        id: sessionId,
        project_id: projectId,
        date,
        topic: 'Test Idempotence',
        status: 'complete',
        content: await fs.readFile(sessionFile, 'utf-8'),
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      // First migration
      const { EventMigrator } = await import('../../dist/lib/migration/event-migrator.js');
      const migrator = new EventMigrator(storage);
      const firstResult = await migrator.migrateSession(sessionId);
      const firstCount = firstResult.eventsCreated;

      // Verify first migration created events
      expect(firstCount).toBeGreaterThan(0);

      // Second migration (should skip)
      const secondResult = await migrator.migrateSession(sessionId);

      expect(secondResult.success).toBe(true);
      expect(secondResult.skipped).toBe(true);
      expect(secondResult.eventsCreated).toBe(0); // No new events created

      // Total events should still be the same
      const events = await storage.queryEvents({ sessionId });
      expect(events.length).toBe(firstCount);
    });
  });
});
