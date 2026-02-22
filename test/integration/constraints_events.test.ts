// test/integration/constraints_events.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteStorage } from '../../lib/context/sqlite-storage.js';
import { DatabaseLocator } from '../../lib/context/database-locator.js';
import { checkConstraints } from '../../lib/core/constraints.js';
import { logWorkEvent } from '../../lib/tools/log-work-event.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

describe('Constraints + Events Integration', () => {
  let projectId = 'test-project';
  let planId = 'PLAN_TEST_INTEGRATION';
  const userId = 'user-integration';
  let testDbPath = '';

  beforeEach(async () => {
    projectId = `test-project-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    planId = `PLAN_TEST_INTEGRATION_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    testDbPath = path.join(
      os.tmpdir(),
      `constraints-events-${Date.now()}-${Math.floor(Math.random() * 1000)}.db`,
    );
    process.env.AIKNOWSYS_DB_PATH = testDbPath;

    const now = new Date().toISOString();
    const locator = new DatabaseLocator();
    const config = await locator.getDatabaseConfig(process.cwd());
    const storage = new SqliteStorage();
    await storage.init(config.dbPath);

    // Create Project (required for FK)
    await storage.insertProject({
      id: projectId,
      name: 'Test Project',
      created_at: now,
      updated_at: now
    });

    // Create Plan (required for FK)
    await storage.insertPlan({
      id: planId,
      project_id: projectId,
      title: 'Test Plan',
      status: 'ACTIVE',
      author: 'tester',
      created: now,
      updated: now,
      content: ''
    });

    await storage.close();
  });

  afterEach(() => {
    delete process.env.AIKNOWSYS_DB_PATH;
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath, { force: true });
    }
  });

  it('should clear validation blocker after logging VALIDATION_PASS event', async () => {
    // 1. Check constraints -> Should fail
    let check = await checkConstraints('COMPLETE_PLAN', { userId, projectId, targetId: planId });
    expect(check.allowed).toBe(false);
    expect(check.blockers?.[0]).toContain("No 'VALIDATION_PASSED' event");

    // 2. Log VALIDATION_PASS event
    await logWorkEvent({
      type: 'validation_passed',
      data: {
        validationType: 'test',
        result: 'passed',
        passed: true
      },
      projectId,
      planId
    });

    // 3. Check constraints -> validation blocker should be cleared
    check = await checkConstraints('COMPLETE_PLAN', { userId, projectId, targetId: planId });
    expect(check.allowed).toBe(true);
    expect(check.blockers).toBeUndefined();

  });
});
