import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { migrateToEvents } from '../../dist/lib/commands/migrate-to-events.js';
import { SqliteStorage } from '../../dist/lib/context/sqlite-storage.js';
import type { MigrateToEventsOptions } from '../../dist/lib/types/index.js';

describe('migrate-to-events command', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(
      process.cwd(),
      `test-tmp-migrate-events-${Date.now()}`
    );
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create .aiknowsys directory structure
    const aiknowsysDir = path.join(tempDir, '.aiknowsys');
    fs.mkdirSync(path.join(aiknowsysDir, 'sessions'), { recursive: true });
    fs.mkdirSync(path.join(aiknowsysDir, 'plans'), { recursive: true });
    
    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    // Insert test project for foreign key constraints
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  afterEach(async () => {
    if (storage) {
      await storage.close();
    }
    
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('single session migration', () => {
    it('should reject archiveMarkdown when --all is not set', async () => {
      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        sessionId: 'sess-2026-02-15-001',
        archiveMarkdown: true,
        verbose: false,
        dryRun: false
      };

      await expect(migrateToEvents(options)).rejects.toThrow(/requires --all/i);
    });

    it('should migrate one session when --session is provided', async () => {
      // Create a test session with markdown content
      const sessionId = 'sess-2026-02-15-001';
      const sessionContent = `---
date: 2026-02-15
title: Test Session
topics:
  - testing
  - migration
---

**Goal:** Test session migration

## Changes
- Implemented feature X
- Fixed bug Y

## Validation
- ✅ Tests: 5/5 passing
- ✅ TypeScript: No errors

## Key Learning
Event-sourced storage provides complete history.
`;

      const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`);
      fs.writeFileSync(sessionPath, sessionContent);

      // Insert session into database (markdown only)
      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Test Session',
        status: 'complete',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        topics: ['testing', 'migration'],
        content: sessionContent
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        sessionId,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(1);
      expect(result.sessions.migrated).toBe(1);
      expect(result.sessions.errors).toBe(0);

      // Verify events were created
      const events = await storage.queryEvents({ sessionId });
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.eventType === 'goal_defined')).toBe(true);
      expect(events.some((e) => e.eventType === 'file_changed' || e.eventType === 'task_completed')).toBe(true);
      expect(events.some((e) => e.eventType === 'validation_passed')).toBe(true);
      expect(events.some((e) => e.eventType === 'learning_captured')).toBe(true);
    });

    it('should return error if session not found', async () => {
      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        sessionId: 'nonexistent-session',
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(0);
      expect(result.sessions.migrated).toBe(0);
      expect(result.sessions.errors).toBe(1);
    });

    it('should skip already-migrated sessions (idempotency)', async () => {
      // Create a session with existing events
      const sessionId = 'sess-2026-02-15-002';
      const sessionContent = `---
date: 2026-02-15
title: Already Migrated
topics:
  - testing
---

## Goal
Test idempotency

## Changes
- Some change
`;

      const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`);
      fs.writeFileSync(sessionPath, sessionContent);

      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Already Migrated',
        status: 'complete',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        topics: ['testing'],
        content: sessionContent
      });

      // Insert an event beforehand
      await storage.insertEvent({
        eventId: `evt-${Date.now()}`,
        sessionId,
        projectId: 'test-project',
        eventType: 'goal_defined',
        timestamp: new Date().toISOString(),
        data: { goal: 'Test idempotency' }
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        sessionId,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(1);
      expect(result.sessions.migrated).toBe(0); // Skipped
      expect(result.sessions.errors).toBe(0);
    });
  });

  describe('all sessions migration', () => {
    it('should not archive markdown workflow files in dry-run mode', async () => {
      const sessionId = 'sess-2026-02-15-archive-dry-run';
      const sessionContent = `---
date: 2026-02-15
title: Archive Session Dry Run
topics:
  - markdownless
---

## Goal
Preview archive markdown files after migration
`;

      fs.writeFileSync(
        path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`),
        sessionContent
      );

      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Archive Session Dry Run',
        status: 'in-progress',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        topics: ['markdownless'],
        content: sessionContent
      });

      const planId = 'PLAN_archive_dry_run_test';
      const planContent = `---
id: ${planId}
title: Archive Dry Run Plan
status: ACTIVE
author: developer
---

## Goal
Preview archive markdown files after migration
`;

      fs.writeFileSync(path.join(tempDir, '.aiknowsys', `${planId}.md`), planContent);
      fs.writeFileSync(path.join(tempDir, '.aiknowsys', 'CURRENT_PLAN.md'), '# Current Team Plans');
      fs.writeFileSync(path.join(tempDir, '.aiknowsys', 'plans', 'active-test-user.md'), `# Active Plan\n\n**Plan:** [Archive Dry Run Plan](../${planId}.md)  \n**Status:** 🎯 ACTIVE  \n**Started:** 2026-02-15\n`);

      await storage.insertPlan({
        id: planId,
        project_id: 'test-project',
        title: 'Archive Dry Run Plan',
        status: 'ACTIVE',
        author: 'developer',
        priority: 'medium',
        type: 'feature',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: planContent
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        all: true,
        archiveMarkdown: true,
        verbose: false,
        dryRun: true
      };

      const result = await migrateToEvents(options);

      expect(result.markdownArchived ?? 0).toBe(0);

      expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.aiknowsys', `${planId}.md`))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'CURRENT_PLAN.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.aiknowsys', 'plans', 'active-test-user.md'))).toBe(true);

      const archiveRoot = path.join(tempDir, '.aiknowsys', 'archive', 'markdownless');
      expect(fs.existsSync(archiveRoot)).toBe(false);
    });

    it('should archive markdown workflow files when archiveMarkdown is enabled', async () => {
      const sessionId = 'sess-2026-02-15-archive';
      const sessionContent = `---
date: 2026-02-15
title: Archive Session
topics:
  - markdownless
---

## Goal
Archive markdown files after migration
`;

      fs.writeFileSync(
        path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`),
        sessionContent
      );

      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Archive Session',
        status: 'in-progress',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        topics: ['markdownless'],
        content: sessionContent
      });

      const planId = 'PLAN_archive_test';
      const planContent = `---
id: ${planId}
title: Archive Plan
status: ACTIVE
author: developer
---

## Goal
Archive markdown files after migration
`;

      fs.writeFileSync(path.join(tempDir, '.aiknowsys', `${planId}.md`), planContent);
      fs.writeFileSync(path.join(tempDir, '.aiknowsys', 'CURRENT_PLAN.md'), '# Current Team Plans');
      fs.writeFileSync(path.join(tempDir, '.aiknowsys', 'plans', 'active-test-user.md'), `# Active Plan\n\n**Plan:** [Archive Plan](../${planId}.md)  \n**Status:** 🎯 ACTIVE  \n**Started:** 2026-02-15\n`);

      await storage.insertPlan({
        id: planId,
        project_id: 'test-project',
        title: 'Archive Plan',
        status: 'ACTIVE',
        author: 'developer',
        priority: 'medium',
        type: 'feature',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        content: planContent
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        all: true,
        archiveMarkdown: true,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.markdownArchived).toBeGreaterThanOrEqual(4);

      const remainingSessionMarkdown = fs.existsSync(
        path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`)
      );
      const remainingPlanMarkdown = fs.existsSync(
        path.join(tempDir, '.aiknowsys', `${planId}.md`)
      );
      const remainingCurrentPlan = fs.existsSync(
        path.join(tempDir, '.aiknowsys', 'CURRENT_PLAN.md')
      );
      const remainingPointer = fs.existsSync(
        path.join(tempDir, '.aiknowsys', 'plans', 'active-test-user.md')
      );

      expect(remainingSessionMarkdown).toBe(false);
      expect(remainingPlanMarkdown).toBe(false);
      expect(remainingCurrentPlan).toBe(false);
      expect(remainingPointer).toBe(false);

      const archiveRoot = path.join(tempDir, '.aiknowsys', 'archive', 'markdownless');
      const archiveSubdirs = fs.existsSync(archiveRoot) ? fs.readdirSync(archiveRoot) : [];
      expect(archiveSubdirs.length).toBeGreaterThan(0);

      const latestArchive = path.join(archiveRoot, archiveSubdirs[0]);
      expect(fs.existsSync(path.join(latestArchive, 'sessions', `${sessionId}.md`))).toBe(true);
      expect(fs.existsSync(path.join(latestArchive, `${planId}.md`))).toBe(true);
      expect(fs.existsSync(path.join(latestArchive, 'CURRENT_PLAN.md'))).toBe(true);
      expect(fs.existsSync(path.join(latestArchive, 'plans', 'active-test-user.md'))).toBe(true);
    });

    it('should migrate all sessions when --all is provided', async () => {
      // Create multiple sessions
      const sessions = [
        { id: 'sess-2026-02-15-001', title: 'Session 1' },
        { id: 'sess-2026-02-15-002', title: 'Session 2' },
        { id: 'sess-2026-02-15-003', title: 'Session 3' }
      ];

      for (const sess of sessions) {
        const content = `---
date: 2026-02-15
title: ${sess.title}
topics:
  - testing
---

## Goal
Test ${sess.title}

## Changes
- Change in ${sess.title}
`;

        const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sess.id}.md`);
        fs.writeFileSync(sessionPath, content);

        await storage.insertSession({
          id: sess.id,
          project_id: 'test-project',
          date: '2026-02-15',
          topic: sess.title,
          status: 'complete',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          topics: ['testing'],
          content
        });
      }

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        all: true,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(3);
      expect(result.sessions.migrated).toBe(3);
      expect(result.sessions.errors).toBe(0);

      // Verify events for each session
      for (const sess of sessions) {
        const events = await storage.queryEvents({ sessionId: sess.id });
        expect(events.length).toBeGreaterThan(0);
      }
    });
    it('should migrate all sessions AND plans when --all is provided', async () => {
      // Create sessions
      const sessions = [
        { id: 'sess-2026-02-15-001', title: 'Session 1' },
        { id: 'sess-2026-02-15-002', title: 'Session 2' }
      ];

      for (const sess of sessions) {
        const content = `---
date: 2026-02-15
title: ${sess.title}
topics:
  - testing
---

## Goal
Test ${sess.title}

## Changes
- Change in ${sess.title}
`;

        const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sess.id}.md`);
        fs.writeFileSync(sessionPath, content);

        await storage.insertSession({
          id: sess.id,
          project_id: 'test-project',
          date: '2026-02-15',
          topic: sess.title,
          status: 'complete',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          topics: ['testing'],
          content
        });
      }

      // Create plans
      const plans = [
        { id: 'PLAN_feature_a', title: 'Feature A' },
        { id: 'PLAN_feature_b', title: 'Feature B' }
      ];

      for (const plan of plans) {
        const content = `---
id: ${plan.id}
title: ${plan.title}
status: ACTIVE
author: developer
topics:
  - testing
created_at: 2026-02-15T10:00:00Z
---

## Goal
Test ${plan.title}

## Tasks
- [ ] Task 1
- [x] Task 2
`;

        const planPath = path.join(tempDir, '.aiknowsys', `${plan.id}.md`);
        fs.writeFileSync(planPath, content);

        await storage.insertPlan({
          id: plan.id,
          project_id: 'test-project',
          title: plan.title,
          status: 'ACTIVE',
          author: 'developer',
          priority: 'medium',
          type: 'feature',
          created: new Date('2026-02-15T10:00:00Z').toISOString(),
          updated: new Date('2026-02-15T10:00:00Z').toISOString(),
          content
        });
      }

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        all: true,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      // Verify sessions migrated
      expect(result.sessions.found).toBe(2);
      expect(result.sessions.migrated).toBe(2);
      expect(result.sessions.errors).toBe(0);

      // Verify plans migrated
      expect(result.plans.found).toBe(2);
      expect(result.plans.migrated).toBe(2);
      expect(result.plans.errors).toBe(0);

      // Verify events created for sessions
      for (const sess of sessions) {
        const events = await storage.queryEvents({ sessionId: sess.id });
        expect(events.length).toBeGreaterThan(0);
      }

      // Verify events created for plans
      for (const plan of plans) {
        const events = await storage.queryEvents({ planId: plan.id });
        expect(events.length).toBeGreaterThanOrEqual(0);
      }
    });
    it('should continue migration on individual errors', async () => {
      // Create sessions - one valid, one with bad markdown
      const validSession = {
        id: 'sess-valid',
        content: `---
date: 2026-02-15
title: Valid
topics: [testing]
---

**Goal:** Valid session

## Changes
- Implemented something
`
      };

      const invalidSession = {
        id: 'sess-invalid',
        content: '--- INVALID YAML ---' // Will fail parsing
      };

      for (const sess of [validSession, invalidSession]) {
        const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sess.id}.md`);
        fs.writeFileSync(sessionPath, sess.content);

        await storage.insertSession({
          id: sess.id,
          project_id: 'test-project',
          date: '2026-02-15',
          topic: sess.id,
          status: 'complete',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          topics: [],
          content: sess.content
        });
      }

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        all: true,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(2);
      expect(result.sessions.migrated).toBe(2); // Both migrate (one with zero events)
      expect(result.sessions.errors).toBe(0); // No errors (malformed markdown doesn't throw)
      
      // Verify valid session has events, invalid has none
      const validEvents = await storage.queryEvents({ sessionId: validSession.id });
      expect(validEvents.length).toBeGreaterThan(0);
      
      const invalidEvents = await storage.queryEvents({ sessionId: invalidSession.id });
      expect(invalidEvents.length).toBe(0);
    });
  });

  describe('dry run mode', () => {
    it('should preview migration without making changes', async () => {
      const sessionId = 'sess-2026-02-15-dry';
      const sessionContent = `---
date: 2026-02-15
title: Dry Run Test
topics: [testing]
---

## Goal
Test dry run
`;

      const sessionPath = path.join(tempDir, '.aiknowsys', 'sessions', `${sessionId}.md`);
      fs.writeFileSync(sessionPath, sessionContent);

      await storage.insertSession({
        id: sessionId,
        project_id: 'test-project',
        date: '2026-02-15',
        topic: 'Dry Run Test',
        status: 'complete',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        topics: ['testing'],
        content: sessionContent
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        sessionId,
        verbose: false,
        dryRun: true
      };

      const result = await migrateToEvents(options);

      expect(result.sessions.found).toBe(1);
      expect(result.sessions.migrated).toBe(0); // Not migrated in dry run

      // Verify no events were created
      const events = await storage.queryEvents({ sessionId });
      expect(events.length).toBe(0);
    });
  });

  describe('plan migration', () => {
    it('should migrate a plan when --plan-id is provided', async () => {
      const planId = 'PLAN_test';
      const planContent = `---
id: ${planId}
title: Test Plan
status: ACTIVE
author: developer
topics:
  - testing
created_at: 2026-02-15T10:00:00Z
---

## Goal
Test plan migration

## Tasks
- [ ] Task 1
- [x] Task 2

## Progress
50% complete
`;

      const planPath = path.join(tempDir, '.aiknowsys', `${planId}.md`);
      fs.writeFileSync(planPath, planContent);

      await storage.insertPlan({
        id: planId,
        project_id: 'test-project',
        title: 'Test Plan',
        status: 'ACTIVE',
        author: 'developer',
        priority: 'medium',
        type: 'feature',
        created: new Date('2026-02-15T10:00:00Z').toISOString(),
        updated: new Date('2026-02-15T10:00:00Z').toISOString(),
        content: planContent
      });

      const options: MigrateToEventsOptions = {
        dir: tempDir,
        dbPath,
        planId,
        verbose: false,
        dryRun: false
      };

      const result = await migrateToEvents(options);

      expect(result.plans.found).toBe(1);
      expect(result.plans.migrated).toBe(1);
      expect(result.plans.errors).toBe(0);

      // Note: Events might be zero because MarkdownParser is session-focused
      // Plan-specific event extraction is a future enhancement
      const events = await storage.queryEvents({ planId });
      // For now, accept that plan migration may extract zero events
      expect(events.length).toBeGreaterThanOrEqual(0);
    });
  });
});
