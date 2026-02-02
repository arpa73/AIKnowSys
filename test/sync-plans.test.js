import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the command
import { syncPlans } from '../lib/commands/sync-plans.js';

describe('sync-plans command', () => {
  let testDir;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(__dirname, 'tmp-sync-plans-test');
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, '.aiknowsys', 'plans'), { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create CURRENT_PLAN.md from single developer plan', async () => {
    // Create a single active plan
    const planContent = `# Active Plan: john-doe

**Currently Working On:** Feature implementation
**Last Updated:** 2026-02-02

---

See: PLAN_feature_x.md for details
`;
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-john-doe.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify CURRENT_PLAN.md was created
    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    assert.ok(existsSync(currentPlanPath), 'CURRENT_PLAN.md should be created');

    const content = readFileSync(currentPlanPath, 'utf-8');
    assert.match(content, /john-doe/, 'Should include developer username');
    assert.match(content, /Feature implementation/, 'Should include plan name');
  });

  it('should aggregate multiple developer plans into team index', async () => {
    // Create multiple active plans
    const plan1 = `# Active Plan: alice

**Currently Working On:** PLAN_backend_api.md
**Last Updated:** 2026-02-02
`;
    const plan2 = `# Active Plan: bob

**Currently Working On:** PLAN_frontend_ui.md
**Last Updated:** 2026-02-02
`;
    const plan3 = `# Active Plan: charlie

**Currently Working On:** PLAN_database_schema.md
**Last Updated:** 2026-02-01
`;

    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-charlie.md'), plan3);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify team index
    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content = readFileSync(currentPlanPath, 'utf-8');

    assert.match(content, /alice/, 'Should include alice');
    assert.match(content, /bob/, 'Should include bob');
    assert.match(content, /charlie/, 'Should include charlie');
    assert.match(content, /PLAN_backend_api\.md/, 'Should include alice\'s plan');
    assert.match(content, /PLAN_frontend_ui\.md/, 'Should include bob\'s plan');
    assert.match(content, /PLAN_database_schema\.md/, 'Should include charlie\'s plan');
  });

  it('should handle plans with no active work', async () => {
    // Create plan without "Currently Working On"
    const planContent = `# Active Plan: john-doe

**Last Updated:** 2026-02-02

---

No active plan currently.
`;
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-john-doe.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    // Verify it doesn't crash
    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    assert.ok(existsSync(currentPlanPath), 'CURRENT_PLAN.md should be created');

    const content = readFileSync(currentPlanPath, 'utf-8');
    assert.match(content, /john-doe/, 'Should include developer username');
  });

  it('should extract plan status from plan files', async () => {
    // Create plan with status indicators
    const planContent = `# Active Plan: alice

**Currently Working On:** PLAN_feature_x.md
**Status:** 🎯 ACTIVE
**Last Updated:** 2026-02-02
`;
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), planContent);

    // Run sync-plans
    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content = readFileSync(currentPlanPath, 'utf-8');

    assert.match(content, /🎯 ACTIVE/, 'Should preserve status emoji');
  });

  it('should create table format for team index', async () => {
    // Create multiple plans
    const plan1 = `# Active Plan: alice
**Currently Working On:** PLAN_feature_a.md
**Status:** 🎯 ACTIVE
**Last Updated:** 2026-02-02`;

    const plan2 = `# Active Plan: bob
**Currently Working On:** PLAN_feature_b.md
**Status:** 🔄 PAUSED
**Last Updated:** 2026-02-01`;

    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content = readFileSync(currentPlanPath, 'utf-8');

    // Should have markdown table structure
    assert.match(content, /\| Developer \| Plan \| Status \| Last Updated \|/, 'Should have table header');
    assert.match(content, /\|[-\s]+\|/, 'Should have table separator');
  });

  it('should handle empty plans directory gracefully', async () => {
    // Empty plans directory
    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    assert.ok(existsSync(currentPlanPath), 'Should create CURRENT_PLAN.md even with no plans');

    const content = readFileSync(currentPlanPath, 'utf-8');
    assert.match(content, /no active plans/i, 'Should indicate no active plans');
  });

  it('should normalize usernames from filenames', async () => {
    // Create plan with complex username
    const planContent = `# Active Plan: john-doe-smith
**Currently Working On:** PLAN_test.md
**Last Updated:** 2026-02-02`;

    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-john-doe-smith.md'), planContent);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content = readFileSync(currentPlanPath, 'utf-8');

    assert.match(content, /john-doe-smith/, 'Should preserve hyphenated username');
  });

  it('should include timestamp and auto-generated notice', async () => {
    const planContent = `# Active Plan: alice
**Currently Working On:** PLAN_test.md
**Last Updated:** 2026-02-02`;

    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), planContent);

    await syncPlans({ dir: testDir, _silent: true });

    const currentPlanPath = join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
    const content = readFileSync(currentPlanPath, 'utf-8');

    assert.match(content, /auto-generated/i, 'Should have auto-generated notice');
    assert.match(content, /sync-plans/i, 'Should mention sync-plans command');
  });

  it('should return success status with plan count', async () => {
    const plan1 = `# Active Plan: alice
**Currently Working On:** PLAN_a.md`;
    const plan2 = `# Active Plan: bob
**Currently Working On:** PLAN_b.md`;

    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-alice.md'), plan1);
    writeFileSync(join(testDir, '.aiknowsys', 'plans', 'active-bob.md'), plan2);

    const result = await syncPlans({ dir: testDir, _silent: true });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.planCount, 2);
    assert.ok(result.outputPath);
  });
});
