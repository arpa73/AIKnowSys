import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import {
  classifyMilestone,
  generateMilestoneChangelogCore,
} from '../../lib/core/generate-changelog.js';
import { EventType } from '../../lib/events/types.js';

describe('generateMilestoneChangelogCore', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: SqliteStorage;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), `test-tmp-generate-changelog-core-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    dbPath = path.join(tempDir, 'knowledge.db');
    storage = new SqliteStorage();
    await storage.init(dbPath);

    const now = new Date().toISOString();
    await storage.insertProject({
      id: 'test-project',
      name: 'Test Project',
      path: tempDir,
      created_at: now,
      updated_at: now,
    });
  });

  afterEach(async () => {
    await storage.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('classifies milestone-grade text correctly', () => {
    const release = classifyMilestone({
      sourceType: 'plan',
      sourceId: 'PLAN_release',
      title: 'v1.2.0 Release',
      content: 'Production release for module X',
      timestamp: '2026-02-23T10:00:00.000Z',
    });
    const breaking = classifyMilestone({
      sourceType: 'event',
      sourceId: 'evt-1',
      title: 'API update',
      content: 'BREAKING CHANGE: renamed mutation input schema',
      timestamp: '2026-02-22T10:00:00.000Z',
    });
    const architecture = classifyMilestone({
      sourceType: 'session',
      sourceId: 'sess-1',
      title: 'Storage redesign',
      content: 'Major architecture change for storage adapter layer',
      timestamp: '2026-02-21T10:00:00.000Z',
    });
    const security = classifyMilestone({
      sourceType: 'event',
      sourceId: 'evt-2',
      title: 'Security hardening',
      content: 'Critical security fix for CVE-2026-1111',
      timestamp: '2026-02-20T10:00:00.000Z',
    });
    const routine = classifyMilestone({
      sourceType: 'session',
      sourceId: 'sess-2',
      title: 'Daily progress',
      content: 'Routine bugfix and refactor pass',
      timestamp: '2026-02-19T10:00:00.000Z',
    });

    expect(release?.type).toBe('release');
    expect(breaking?.type).toBe('breaking');
    expect(architecture?.type).toBe('architecture');
    expect(security?.type).toBe('security');
    expect(routine).toBeNull();
  });

  it('returns deterministic ordering and excludes routine work', async () => {
    const now = new Date().toISOString();
    await storage.insertPlan({
      id: 'PLAN_release_120',
      project_id: 'test-project',
      title: 'v1.2.0 Release',
      status: 'COMPLETE',
      author: 'dev',
      created: '2026-02-22T12:00:00.000Z',
      updated: '2026-02-22T12:00:00.000Z',
      content: 'Release milestone for major launch',
    });

    await storage.insertPlan({
      id: 'PLAN_daily_bugfix',
      project_id: 'test-project',
      title: 'Bugfix follow-up',
      status: 'COMPLETE',
      author: 'dev',
      created: now,
      updated: now,
      content: 'Routine bugfix churn and cleanup',
    });

    await storage.insertEvent({
      eventId: 'evt-breaking',
      projectId: 'test-project',
      timestamp: '2026-02-23T11:00:00.000Z',
      eventType: EventType.DECISION_MADE,
      data: {
        decision: 'BREAKING CHANGE: remove legacy command',
        rationale: 'Unifies workflow',
      },
    });

    await storage.insertEvent({
      eventId: 'evt-routine',
      projectId: 'test-project',
      timestamp: '2026-02-23T09:00:00.000Z',
      eventType: EventType.TASK_COMPLETED,
      data: {
        description: 'daily cleanup',
        outcome: 'success',
      },
    });

    const result = await generateMilestoneChangelogCore({
      dbPath,
      from: '2026-02-20',
      to: '2026-02-24',
    });

    expect(result.milestoneCount).toBe(2);
    expect(result.entries[0].sourceId).toBe('evt-breaking');
    expect(result.entries[1].sourceId).toBe('PLAN_release_120');
    expect(result.markdown).toContain('Generated Milestone Changelog');
    expect(result.markdown).not.toContain('PLAN_daily_bugfix');
    expect(result.markdown).not.toContain('evt-routine');
  });

  it('returns explicit empty-state message when no milestones match', async () => {
    const result = await generateMilestoneChangelogCore({
      dbPath,
      from: '2026-02-20',
      to: '2026-02-24',
    });

    expect(result.milestoneCount).toBe(0);
    expect(result.markdown).toContain('No milestone entries found');
  });

  it('defaults to project-scoped milestones when projectId is provided', async () => {
    const now = new Date().toISOString();
    await storage.insertProject({
      id: 'other-project',
      name: 'Other Project',
      path: path.join(tempDir, 'other'),
      created_at: now,
      updated_at: now,
    });

    await storage.insertPlan({
      id: 'PLAN_release_test_project',
      project_id: 'test-project',
      title: 'v1.4.0 Release',
      status: 'COMPLETE',
      author: 'dev',
      created: now,
      updated: now,
      content: 'Release for test-project',
    });

    await storage.insertPlan({
      id: 'PLAN_release_other_project',
      project_id: 'other-project',
      title: 'v9.9.9 Release',
      status: 'COMPLETE',
      author: 'dev',
      created: now,
      updated: now,
      content: 'Release for other-project',
    });

    const scoped = await generateMilestoneChangelogCore({
      dbPath,
      projectId: 'test-project',
    });

    expect(scoped.entries.map((e) => e.sourceId)).toContain('PLAN_release_test_project');
    expect(scoped.entries.map((e) => e.sourceId)).not.toContain('PLAN_release_other_project');
  });

  it('includes cross-project milestones only when allProjects=true', async () => {
    const now = new Date().toISOString();
    await storage.insertProject({
      id: 'other-project',
      name: 'Other Project',
      path: path.join(tempDir, 'other'),
      created_at: now,
      updated_at: now,
    });

    await storage.insertPlan({
      id: 'PLAN_release_test_project_2',
      project_id: 'test-project',
      title: 'v2.0.0 Release',
      status: 'COMPLETE',
      author: 'dev',
      created: now,
      updated: now,
      content: 'Release for test-project',
    });

    await storage.insertPlan({
      id: 'PLAN_release_other_project_2',
      project_id: 'other-project',
      title: 'v3.0.0 Release',
      status: 'COMPLETE',
      author: 'dev',
      created: now,
      updated: now,
      content: 'Release for other-project',
    });

    const allProjects = await generateMilestoneChangelogCore({
      dbPath,
      projectId: 'test-project',
      allProjects: true,
    });

    expect(allProjects.entries.map((e) => e.sourceId)).toContain('PLAN_release_test_project_2');
    expect(allProjects.entries.map((e) => e.sourceId)).toContain('PLAN_release_other_project_2');
  });
});
