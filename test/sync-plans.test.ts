import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';

// Import the command
import { syncPlans } from '../lib/commands/sync-plans.js';

describe('sync-plans command', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(import.meta.dirname, 'tmp-sync-plans-test');
    mkdirSync(testDir, { recursive: true });
    mkdirSync(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create CURRENT_PLAN.md from single developer plan', async () => {
    // Create a single active plan
    const planContent: string = `# Active Plan: john-doe

**Currently Working On:** Feature implementation
**Last Updated:** 2026-02-02

---

See: PLAN_feature_x.md for details
`;
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-john-doe.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify CURRENT_PLAN.md was created
    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    expect(existsSync(currentPlanPath)).toBeTruthy();

    const content: string = readFileSync(currentPlanPath, 'utf-8');
    expect(content).toMatch(/john-doe/);
    expect(content).toMatch(/Feature implementation/);
  });

  it('should aggregate multiple developer plans into team index', async () => {
    // Create multiple active plans
    const plan1: string = `# Active Plan: alice

**Currently Working On:** PLAN_backend_api.md
**Last Updated:** 2026-02-02
`;
    const plan2: string = `# Active Plan: bob

**Currently Working On:** PLAN_frontend_ui.md
**Last Updated:** 2026-02-02
`;
    const plan3: string = `# Active Plan: charlie

**Currently Working On:** PLAN_database_schema.md
**Last Updated:** 2026-02-01
`;

    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-charlie.md'), plan3);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify team index
    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content: string = readFileSync(currentPlanPath, 'utf-8');

    expect(content).toMatch(/alice/);
    expect(content).toMatch(/bob/);
    expect(content).toMatch(/charlie/);
    expect(content).toMatch(/PLAN_backend_api\.md/);
    expect(content).toMatch(/PLAN_frontend_ui\.md/);
    expect(content).toMatch(/PLAN_database_schema\.md/);
  });

  it('should handle plans with no active work', async () => {
    // Create plan without "Currently Working On"
    const planContent: string = `# Active Plan: john-doe

**Last Updated:** 2026-02-02

---

No active plan currently.
`;
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-john-doe.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify it doesn't crash
    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    expect(existsSync(currentPlanPath)).toBeTruthy();

    const content: string = readFileSync(currentPlanPath, 'utf-8');
    expect(content).toMatch(/john-doe/);
  });

  it('should extract plan status from plan files', async () => {
    // Create plan with status indicators
    const planContent: string = `# Active Plan: alice

**Currently Working On:** PLAN_feature_x.md
**Status:** 🎯 ACTIVE
**Last Updated:** 2026-02-02
`;
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content: string = readFileSync(currentPlanPath, 'utf-8');

    expect(content).toMatch(/🎯 ACTIVE/);
  });

  it('should create table format for team index', async () => {
    // Create multiple plans
    const plan1: string = `# Active Plan: alice
**Currently Working On:** PLAN_feature_a.md
**Status:** 🎯 ACTIVE
**Last Updated:** 2026-02-02`;

    const plan2: string = `# Active Plan: bob
**Currently Working On:** PLAN_feature_b.md
**Status:** 🔄 PAUSED
**Last Updated:** 2026-02-01`;

    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content: string = readFileSync(currentPlanPath, 'utf-8');

    // Should have markdown table structure
    expect(content).toMatch(/\| Developer \| Plan \| Status \| Last Updated \|/);
    expect(content).toMatch(/\|[-\s]+\|/);
  });

  it('should handle empty plans directory gracefully', async () => {
    // Empty plans directory
    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    expect(existsSync(currentPlanPath)).toBeTruthy();

    const content: string = readFileSync(currentPlanPath, 'utf-8');
    expect(content).toMatch(/no active plans/i);
  });

  it('should normalize usernames from filenames', async () => {
    // Create plan with complex username
    const planContent: string = `# Active Plan: john-doe-smith
**Currently Working On:** PLAN_test.md
**Last Updated:** 2026-02-02`;

    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-john-doe-smith.md'), planContent);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content: string = readFileSync(currentPlanPath, 'utf-8');

    expect(content).toMatch(/john-doe-smith/);
  });

  it('should include timestamp and auto-generated notice', async () => {
    const planContent: string = `# Active Plan: alice
**Currently Working On:** PLAN_test.md
**Last Updated:** 2026-02-02`;

    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), planContent);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath: string = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content: string = readFileSync(currentPlanPath, 'utf-8');

    expect(content).toMatch(/auto-generated/i);
    expect(content).toMatch(/sync-plans/i);
  });

  it('should return success status with plan count', async () => {
    const plan1: string = `# Active Plan: alice
**Currently Working On:** PLAN_a.md`;
    const plan2: string = `# Active Plan: bob
**Currently Working On:** PLAN_b.md`;

    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(path.join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);

    const result: any = await syncPlans({ dir: testDir, _silent: true });

    expect(result.success).toBe(true);
    expect(result.planCount).toBe(2);
    expect(result.outputPath).toBeTruthy();
  });
});
