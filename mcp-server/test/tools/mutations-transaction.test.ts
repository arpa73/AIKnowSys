import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { EventType } from '../../../lib/events/types.js';

let tmpDir: string;
let dbPath: string;

beforeEach(async () => {
  tmpDir = path.join(process.cwd(), `test-tmp-mutations-transaction-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  dbPath = path.join(tmpDir, 'knowledge.db');
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('createLearnedPattern transaction rollback', () => {
  it('rolls back inserted plan when insertEvent fails', async () => {
    vi.doMock('../../../lib/utils/find-knowledge-db.js', () => ({
      findKnowledgeDb: () => dbPath,
    }));

    const { SqliteStorage } = await import('../../../lib/context/sqlite-storage.js');
    const insertEventSpy = vi
      .spyOn(SqliteStorage.prototype, 'insertEvent')
      .mockRejectedValueOnce(new Error('Forced insertEvent failure'));

    const { createLearnedPattern } = await import('../../src/tools/mutations.js');

    const uniqueTitle = `Rollback integrity ${Date.now()}`;
    const result = await createLearnedPattern({
      title: uniqueTitle,
      pattern: 'Pattern should not persist on event write failure',
      solution: 'Transaction must rollback plan insert',
      category: 'error_resolution',
      keywords: ['rollback', 'transaction'],
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Forced insertEvent failure');
    expect(insertEventSpy).toHaveBeenCalledTimes(1);

    const verifyStorage = new SqliteStorage();
    await verifyStorage.init(dbPath);

    const plans = await verifyStorage.queryPlans({});
    const rolledBackPlan = plans.plans.find((plan) => plan.title === uniqueTitle);
    expect(rolledBackPlan).toBeUndefined();

    const events = await verifyStorage.queryEvents({ eventType: EventType.PATTERN_DISCOVERED });
    expect(events.length).toBe(0);

    await verifyStorage.close();
  });

  it('preserves other-project data and rolls back current-project write in shared DB mode', async () => {
    vi.doMock('../../../lib/utils/find-knowledge-db.js', () => ({
      findKnowledgeDb: () => dbPath,
    }));

    const { SqliteStorage } = await import('../../../lib/context/sqlite-storage.js');
    const { createLearnedPattern } = await import('../../src/tools/mutations.js');

    const baselineStorage = new SqliteStorage();
    await baselineStorage.init(dbPath);

    const now = new Date().toISOString();
    const otherProjectId = 'external-project';
    const otherPlanId = 'learned_external_shared_baseline';

    await baselineStorage.insertProject({
      id: otherProjectId,
      name: otherProjectId,
      path: '/tmp/external-project',
      created_at: now,
      updated_at: now,
    });

    await baselineStorage.insertPlan({
      id: otherPlanId,
      project_id: otherProjectId,
      title: 'External baseline learned pattern',
      status: 'COMPLETE',
      author: 'test',
      created: now,
      updated: now,
      content: '# Baseline',
      topics: ['shared-db'],
      type: 'project_specific',
    });

    await baselineStorage.close();

    const insertEventSpy = vi
      .spyOn(SqliteStorage.prototype, 'insertEvent')
      .mockRejectedValueOnce(new Error('Forced insertEvent failure (shared db)'));

    const uniqueTitle = `Rollback shared-db ${Date.now()}`;
    const result = await createLearnedPattern({
      title: uniqueTitle,
      pattern: 'Should rollback only current project write',
      solution: 'Cross-project baseline data must remain unchanged',
      category: 'error_resolution',
      keywords: ['rollback', 'shared-db'],
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Forced insertEvent failure (shared db)');
    expect(insertEventSpy).toHaveBeenCalledTimes(1);

    const verifyStorage = new SqliteStorage();
    await verifyStorage.init(dbPath);

    const otherPlan = await verifyStorage.getPlanById(otherPlanId);
    expect(otherPlan).not.toBeNull();
    expect(otherPlan?.project_id).toBe(otherProjectId);

    const plans = await verifyStorage.queryPlans({});
    const rolledBackPlan = plans.plans.find((plan) => plan.title === uniqueTitle);
    expect(rolledBackPlan).toBeUndefined();

    const currentProjectId = path.basename(process.cwd());
    const currentProjectEvents = await verifyStorage.queryEvents({
      projectId: currentProjectId,
      eventType: EventType.PATTERN_DISCOVERED,
    });
    expect(currentProjectEvents.length).toBe(0);

    await verifyStorage.close();
  });
});
