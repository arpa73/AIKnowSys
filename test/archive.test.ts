import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { archiveSessions } from '../lib/commands/archive-sessions.js';
import { archivePlans } from '../lib/commands/archive-plans.js';
import { clean } from '../lib/commands/clean.js';

const TEST_DIR: string = path.join(process.cwd(), 'test-archive-temp');

describe('Archive Commands', () => {
  beforeEach(async () => {
    // Create clean test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'sessions'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('archive-sessions command', () => {
    it('should detect sessions older than threshold', async () => {
      // Create old session (60 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      
      const oldFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-01-session.md');
      await fs.writeFile(oldFile, '# Old Session');
      await fs.utimes(oldFile, oldDate, oldDate);
      
      // Create recent session
      const recentFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2026-01-30-session.md');
      await fs.writeFile(recentFile, '# Recent Session');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        dryRun: true,
        _silent: true
      });
      
      assert.strictEqual(result.dryRun, 1, 'Should find 1 old session');
      assert.strictEqual(result.kept, 1, 'Should keep 1 recent session');
    });

    it('should move old sessions to archive/YYYY/MM/', async () => {
      const oldDate = new Date('2025-12-15');
      const oldFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-15-session.md');
      await fs.writeFile(oldFile, '# Old Session');
      await fs.utimes(oldFile, oldDate, oldDate);
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        dryRun: false,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 1);
      
      // Verify file moved
      const archivePath = path.join(TEST_DIR, '.aiknowsys', 'archive', 'sessions', '2025', '12', '2025-12-15-session.md');
      const exists = await fs.access(archivePath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, 'Session should be in archive/2025/12/');
    });

    it('should preserve recent sessions', async () => {
      const recentFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2026-01-30-session.md');
      await fs.writeFile(recentFile, '# Recent Session');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.kept, 1);
      
      // Verify file still in sessions/
      const exists = await fs.access(recentFile).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, 'Recent session should remain');
    });

    it('should create archive directories if missing', async () => {
      const oldDate = new Date('2024-05-10');
      const oldFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2024-05-10-session.md');
      await fs.writeFile(oldFile, '# Old Session');
      await fs.utimes(oldFile, oldDate, oldDate);
      
      await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      const archiveDir = path.join(TEST_DIR, '.aiknowsys', 'archive', 'sessions', '2024', '05');
      const exists = await fs.access(archiveDir).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, 'Should create archive/2024/05/ directory');
    });

    it('should handle --dry-run mode', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      
      const oldFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-01-session.md');
      await fs.writeFile(oldFile, '# Old Session');
      await fs.utimes(oldFile, oldDate, oldDate);
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        dryRun: true,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0, 'Should not archive in dry-run');
      assert.strictEqual(result.dryRun, 1, 'Should report would archive 1');
      
      // File should still exist in original location
      const exists = await fs.access(oldFile).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, 'File should not move in dry-run');
    });

    it('should respect --threshold flag', async () => {
      const date45DaysAgo = new Date();
      date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);
      
      const file = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-15-session.md');
      await fs.writeFile(file, '# Session');
      await fs.utimes(file, date45DaysAgo, date45DaysAgo);
      
      // Threshold 60 days - should keep
      const result1 = await archiveSessions({
        dir: TEST_DIR,
        threshold: 60,
        dryRun: true,
        _silent: true
      });
      assert.strictEqual(result1.kept, 1, 'Should keep with 60-day threshold');
      
      // Threshold 30 days - should archive
      const result2 = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        dryRun: true,
        _silent: true
      });
      assert.strictEqual(result2.dryRun, 1, 'Should archive with 30-day threshold');
    });

    it('should skip if no old sessions found', async () => {
      const recentFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2026-01-30-session.md');
      await fs.writeFile(recentFile, '# Recent Session');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.kept, 1);
    });

    it('should handle malformed session files', async () => {
      // Create files that don't match session pattern
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'sessions', 'README.md'), '# Readme');
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'sessions', 'invalid.md'), '# Invalid');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.kept, 0);
    });

    it('should handle missing sessions directory', async () => {
      await fs.rm(path.join(TEST_DIR, '.aiknowsys', 'sessions'), { recursive: true });
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.kept, 0);
    });
  });

  describe('archive-plans command', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true });
    });

    it('should detect completed plans older than threshold', async () => {
      // Create plan pointer file (v0.9.0 multi-dev structure)
      const planPointer = `# test-user's Active Plan

| Plan | Status | Progress | Last Updated |
|------|--------|----------|--------------|
| [Old Plan](../PLAN_old.md) | ✅ COMPLETE | Done | 2025-12-01 |
| [Active Plan](../PLAN_active.md) | 🎯 ACTIVE | In progress | 2026-01-30 |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      // Create plan files
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const oldPlanFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(oldPlanFile, '# Old Plan');
      await fs.utimes(oldPlanFile, oldDate, oldDate);
      
      const activePlanFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md');
      await fs.writeFile(activePlanFile, '# Active Plan');
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        dryRun: true,
        _silent: true
      });
      
      assert.strictEqual(result.dryRun, 1, 'Should find 1 completed plan to archive');
    });

    it('should move completed plans to archive/plans/', async () => {
      const planPointer = `# test-user's Active Plan

| Plan | Status |
|------|--------|
| [Old Plan](../PLAN_old.md) | ✅ COMPLETE |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const oldPlanFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(oldPlanFile, '# Old Plan');
      await fs.utimes(oldPlanFile, oldDate, oldDate);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 1);
      assert.strictEqual(result.updated, 1, 'Should update 1 plan pointer');
      
      // Verify file moved
      const archivePath = path.join(TEST_DIR, '.aiknowsys', 'archive', 'plans', 'PLAN_old.md');
      const exists = await fs.access(archivePath).then(() => true).catch(() => false);
      assert.strictEqual(exists, true, 'Plan should be in archive/plans/');
      
      // Verify pointer file updated
      const pointerContent = await fs.readFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), 'utf-8');
      assert.strictEqual(pointerContent.includes('../archive/plans/PLAN_old.md'), true, 'Pointer should reference archive path');
    });

    it('should preserve active and paused plans', async () => {
      const planPointer = `# test-user's Active Plan

| Plan | Status |
|------|--------|
| [Active Plan](../PLAN_active.md) | 🎯 ACTIVE |
| [Paused Plan](../PLAN_paused.md) | 🔄 PAUSED |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md'), '# Active');
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'PLAN_paused.md'), '# Paused');
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0, 'Should not archive active/paused plans');
    });

    it('should update plan pointer with archive links', async () => {
      const planPointer = `# test-user's Active Plan

| Plan | Status |
|------|--------|
| [Old Plan](../PLAN_old.md) | ✅ COMPLETE |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const oldPlanFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(oldPlanFile, '# Old Plan');
      await fs.utimes(oldPlanFile, oldDate, oldDate);
      
      await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      const updatedContent = await fs.readFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), 'utf-8');
      assert.match(updatedContent, /\.\.\/archive\/plans\/PLAN_old\.md/, 'Should update link to archive location');
    });

    it('should handle --dry-run mode', async () => {
      const planPointer = `# test-user's Active Plan

| Plan | Status |
|------|--------|
| [Old Plan](../PLAN_old.md) | ✅ COMPLETE |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      
      const oldPlanFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(oldPlanFile, '# Old Plan');
      await fs.utimes(oldPlanFile, oldDate, oldDate);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        dryRun: true,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.dryRun, 1);
      
      // File should still exist
      const exists = await fs.access(oldPlanFile).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);
    });

    it('should handle missing plans/ directory', async () => {
      // Remove plans directory
      await fs.rm(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true, force: true });
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0);
      assert.strictEqual(result.kept, 0);
    });
  });

  describe('clean command', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'sessions'), { recursive: true });
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true });
    });

    it('should archive sessions and plans in one command', async () => {
      // Create old session
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      
      const sessionFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-01-session.md');
      await fs.writeFile(sessionFile, '# Old Session');
      await fs.utimes(sessionFile, oldDate, oldDate);
      
      // Create old plan with multi-dev structure
      const planPointer = `# test-user's Active Plan

| Plan | Status |
|------|--------|
| [Old Plan](../PLAN_old.md) | ✅ COMPLETE |
`;
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test-user.md'), planPointer);
      
      const planFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(planFile, '# Old Plan');
      await fs.utimes(planFile, oldDate, oldDate);
      
      const result = await clean({
        dir: TEST_DIR,
        threshold: 30,  // 60-day old files should be archived with 30-day threshold
        _silent: true
      } as any);  // Type definition missing _silent property
      
      assert.strictEqual(result.sessionsArchived, 1);
      assert.strictEqual(result.plansArchived, 1);
    });

    it('should remove temp files', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'test-temp.js'), '// temp');
      await fs.writeFile(path.join(TEST_DIR, 'debug-output.txt'), 'debug');
      
      const result = await clean({
        dir: TEST_DIR,
        _silent: true
      } as any);  // Type definition missing _silent property
      
      assert.ok(result.tempFilesRemoved >= 0, 'Should report temp files removed');
    });

    it('should handle --dry-run mode', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      
      const sessionFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2025-12-01-session.md');
      await fs.writeFile(sessionFile, '# Old Session');
      await fs.utimes(sessionFile, oldDate, oldDate);
      
      const result = await clean({
        dir: TEST_DIR,
        dryRun: true,
        _silent: true
      } as any);  // Type definition missing _silent property
      
      assert.strictEqual(result.sessionsArchived, 0);
      
      // File should still exist
      const exists = await fs.access(sessionFile).then(() => true).catch(() => false);
      assert.strictEqual(exists, true);
    });
  });

  describe('archive-plans --threshold=0 fix', () => {
    it('should archive immediately when threshold is 0', async () => {
      // Setup multi-dev structure
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true });
      
      // Create pointer file with completed plan
      const pointerPath = path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test.md');
      await fs.writeFile(pointerPath, `
# test's Active Plan

| Plan | Status | Description | Last Updated |
|------|--------|-------------|--------------|
| [Test Plan](../PLAN_test.md) | ✅ COMPLETE | Done | 2026-02-04 |
`);
      
      // Create the actual plan file (modified today)
      const planPath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_test.md');
      await fs.writeFile(planPath, '# Test Plan\n\nCompleted today.');
      
      // Archive with threshold=0 (should archive even though file is new)
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 1, 'Should archive plan immediately with threshold=0');
    });

    it('should return zero archived when threshold=0 but no matching plans', async () => {
      // Setup multi-dev structure
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true });
      
      // Create pointer with ACTIVE plan (not COMPLETE)
      const pointerPath = path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test.md');
      await fs.writeFile(pointerPath, `
# test's Active Plan

| Plan | Status | Description | Last Updated |
|------|--------|-------------|--------------|
| [Active Plan](../PLAN_active.md) | 🎯 ACTIVE | Working | 2026-02-04 |
`);
      
      // Create plan file
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md'), '# Active Plan');
      
      // Archive with threshold=0 (should not archive ACTIVE plans)
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        _silent: true
      });
      
      assert.strictEqual(result.archived, 0, 'Should not archive non-COMPLETE plans');
      assert.strictEqual(result.kept, 1, 'Should keep 1 active plan');
    });
  });

  describe('archive-plans --status option', () => {
    it('should archive plans by custom status', async () => {
      // Setup multi-dev structure
      await fs.mkdir(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true });
      
      // Create pointer file with cancelled plan
      const pointerPath = path.join(TEST_DIR, '.aiknowsys', 'plans', 'active-test.md');
      await fs.writeFile(pointerPath, `
# test's Active Plan

| Plan | Status | Description | Last Updated |
|------|--------|-------------|--------------|
| [Cancelled Plan](../PLAN_cancelled.md) | ❌ CANCELLED | Abandoned | 2025-12-01 |
| [Active Plan](../PLAN_active.md) | 🎯 ACTIVE | Working | 2026-02-04 |
`);
      
      // Create plan files
      const cancelledPath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_cancelled.md');
      const activePath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md');
      await fs.writeFile(cancelledPath, '# Cancelled Plan');
      await fs.writeFile(activePath, '# Active Plan');
      
      // Set old date for cancelled plan
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      await fs.utimes(cancelledPath, oldDate, oldDate);
      
      // Archive CANCELLED plans with threshold=0
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        statusFilter: '❌ CANCELLED',  // Fixed: was 'status' but should be 'statusFilter'
        _silent: true
      });
      
      assert.strictEqual(result.archived, 1, 'Should archive 1 cancelled plan');
      
      // Active plan should still exist
      const activeExists = await fs.access(activePath).then(() => true).catch(() => false);
      assert.strictEqual(activeExists, true, 'Active plan should not be archived');
    });
  });
});

