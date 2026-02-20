import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { updatePlanCore } from '../../lib/core/update-plan.js';
import { EventType } from '../../lib/events/types.js';
import { closeAllKnowledgeDbs } from '../../lib/context/db.js';

describe('updatePlanCore (SQLite-first)', () => {
  const testDir = path.join(process.cwd(), 'test-tmp-update-plan-core');
  const originalDbPath = process.env.AIKNOWSYS_DB_PATH;

  beforeEach(async () => {
    closeAllKnowledgeDbs();
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
    process.env.AIKNOWSYS_DB_PATH = path.join(testDir, '.aiknowsys', 'knowledge.db');
  });

  afterEach(async () => {
    closeAllKnowledgeDbs();
    if (originalDbPath) {
      process.env.AIKNOWSYS_DB_PATH = originalDbPath;
    } else {
      delete process.env.AIKNOWSYS_DB_PATH;
    }
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('updates status for SQLite-only plans without requiring markdown file', async () => {
    const storage = new SqliteStorage();
    await storage.init(testDir);

    const now = new Date().toISOString();
    const projectId = 'project_update_plan_sqlite';
    const planId = 'PLAN_sqlite_only_update';

    await storage.insertProject({
      id: projectId,
      name: projectId,
      path: testDir,
      created_at: now,
      updated_at: now,
    });

    await storage.insertPlan({
      id: planId,
      project_id: projectId,
      title: 'SQLite-only plan',
      status: 'ACTIVE',
      author: 'phase-e-test',
      created: now,
      updated: now,
      content: [
        '---',
        'id: "sqlite_only_update"',
        'title: "SQLite-only plan"',
        'status: "ACTIVE"',
        'author: "phase-e-test"',
        'created: "2026-02-20"',
        'updated: "2026-02-20"',
        '---',
        '',
        '# SQLite-only plan',
      ].join('\n'),
      topics: ['phase-e'],
      type: 'feature',
    });

    await storage.insertEvent({
      eventId: `evt-${randomUUID()}`,
      projectId,
      planId,
      timestamp: now,
      eventType: EventType.VALIDATION_PASSED,
      data: { validationType: 'test', result: 'passed' },
    });

    const result = await updatePlanCore({
      planId,
      setStatus: 'PAUSED',
      targetDir: testDir,
      storage,
      writeMarkdown: false,
    });

    const updatedPlan = await storage.getPlanById(planId);

    expect(result.updated).toBe(true);
    expect(result.filePath).toBeNull();
    expect(updatedPlan?.status).toBe('PAUSED');

    const markdownPath = path.join(testDir, '.aiknowsys', `${planId}.md`);
    const markdownExists = await fs.access(markdownPath).then(() => true).catch(() => false);
    expect(markdownExists).toBe(false);

    await storage.close();
  });

  it('blocks COMPLETE when there is a pending review', async () => {
    const storage = new SqliteStorage();
    await storage.init(testDir);

    const now = new Date().toISOString();
    const projectId = 'project_update_plan_constraints';
    const planId = 'PLAN_block_complete_pending_review';

    await storage.insertProject({
      id: projectId,
      name: projectId,
      path: testDir,
      created_at: now,
      updated_at: now,
    });

    await storage.insertPlan({
      id: planId,
      project_id: projectId,
      title: 'Constraint test plan',
      status: 'ACTIVE',
      author: 'phase-e-test',
      created: now,
      updated: now,
      content: [
        '---',
        'id: "block_complete_pending_review"',
        'title: "Constraint test plan"',
        'status: "ACTIVE"',
        'author: "phase-e-test"',
        'created: "2026-02-20"',
        'updated: "2026-02-20"',
        '---',
        '',
        '# Constraint test plan',
      ].join('\n'),
      topics: ['constraints'],
      type: 'feature',
    });

    await storage.insertEvent({
      eventId: `evt-${randomUUID()}`,
      projectId,
      planId,
      timestamp: now,
      eventType: EventType.VALIDATION_PASSED,
      data: { validationType: 'test', result: 'passed' },
    });

    await storage.insertReview({
      id: `review-${randomUUID()}`,
      project_id: projectId,
      target_id: planId,
      author: 'architect-test',
      status: 'PENDING',
      content: 'Please address pending items',
      created_at: now,
      updated_at: now,
    });

    await expect(
      updatePlanCore({
        planId,
        setStatus: 'COMPLETE',
        targetDir: testDir,
        storage,
        writeMarkdown: false,
      })
    ).rejects.toThrow(/pending review/i);

    await storage.close();
  });
});
