import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createPlanCore } from '../../lib/core/create-plan.js';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { queryPlansSqlite } from '../../lib/core/sqlite-query.js';

describe('createPlanCore (SQLite-first write path)', () => {
  const testDir = path.join(process.cwd(), 'test-tmp-create-plan-core');

  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('persists plan directly to SQLite and is immediately queryable without migration', async () => {
    const storage = new SqliteStorage();
    await storage.init(testDir);

    const result = await createPlanCore({
      title: 'SQLite Immediate Plan',
      author: 'phase-a-test',
      topics: ['sqlite', 'phase-a'],
      targetDir: testDir,
      storage,
      writeMarkdown: false,
    });

    const dbPath = path.join(testDir, '.aiknowsys', 'knowledge.db');
    const plans = await queryPlansSqlite({ dbPath, status: 'PLANNED', mode: 'full' });

    expect(result.created).toBe(true);
    expect(plans.plans.some((plan) => plan.id === result.planId)).toBe(true);

    const markdownPath = path.join(testDir, '.aiknowsys', `${result.planId}.md`);
    const markdownExists = await fs.access(markdownPath).then(() => true).catch(() => false);
    expect(markdownExists).toBe(false);

    await storage.close();
  });
});
