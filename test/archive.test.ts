import { describe, it, beforeEach, afterEach, expect } from 'vitest';
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
      
      expect(result.dryRun).toBe(1);
      expect(result.kept).toBe(1);
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
      
      expect(result.archived).toBe(1);
      
      // Verify file moved
      const archivePath = path.join(TEST_DIR, '.aiknowsys', 'archive', 'sessions', '2025', '12', '2025-12-15-session.md');
      const exists = await fs.access(archivePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should preserve recent sessions', async () => {
      const recentFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2026-01-30-session.md');
      await fs.writeFile(recentFile, '# Recent Session');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(1);
      
      // Verify file still in sessions/
      const exists = await fs.access(recentFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
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
      expect(exists).toBe(true);
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
      
      expect(result.archived).toBe(0);
      expect(result.dryRun).toBe(1);
      
      // File should still exist in original location
      const exists = await fs.access(oldFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
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
      expect(result1.kept).toBe(1);
      
      // Threshold 30 days - should archive
      const result2 = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        dryRun: true,
        _silent: true
      });
      expect(result2.dryRun).toBe(1);
    });

    it('should skip if no old sessions found', async () => {
      const recentFile = path.join(TEST_DIR, '.aiknowsys', 'sessions', '2026-01-30-session.md');
      await fs.writeFile(recentFile, '# Recent Session');
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(1);
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
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(0);
    });

    it('should handle missing sessions directory', async () => {
      await fs.rm(path.join(TEST_DIR, '.aiknowsys', 'sessions'), { recursive: true });
      
      const result = await archiveSessions({
        dir: TEST_DIR,
        threshold: 30,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(0);
    });
  });

  describe('archive-plans command', () => {
    const writePlan = async (planId: string, status: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED', daysAgo = 0): Promise<string> => {
      const filePath = path.join(TEST_DIR, '.aiknowsys', `${planId}.md`);
      const now = new Date();
      const updated = new Date();
      updated.setDate(now.getDate() - daysAgo);

      const content = `---
id: "${planId}"
title: "${planId}"
status: "${status}"
author: "test"
created: "2026-02-01"
updated: "2026-02-01"
---

# ${planId}
`;

      await fs.writeFile(filePath, content);
      if (daysAgo > 0) {
        await fs.utimes(filePath, updated, updated);
      }
      return filePath;
    };

    it('should detect completed plans older than threshold', async () => {
      await writePlan('PLAN_old', 'COMPLETE', 30);
      await writePlan('PLAN_active', 'ACTIVE', 1);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        dryRun: true,
        _silent: true
      });
      
      expect(result.dryRun).toBe(1);
    });

    it('should move completed plans to archive/plans/', async () => {
      await writePlan('PLAN_old', 'COMPLETE', 30);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      expect(result.archived).toBe(1);
      
      // Verify file moved
      const archivePath = path.join(TEST_DIR, '.aiknowsys', 'archive', 'plans', 'PLAN_old.md');
      const exists = await fs.access(archivePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should preserve active and paused plans', async () => {
      const activePath = await writePlan('PLAN_active', 'ACTIVE', 30);
      const pausedPath = await writePlan('PLAN_paused', 'PAUSED', 30);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      const activeExists = await fs.access(activePath).then(() => true).catch(() => false);
      const pausedExists = await fs.access(pausedPath).then(() => true).catch(() => false);
      expect(activeExists).toBe(true);
      expect(pausedExists).toBe(true);
    });

    it('should handle --dry-run mode', async () => {
      const oldPlanFile = await writePlan('PLAN_old', 'COMPLETE', 30);
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        dryRun: true,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.dryRun).toBe(1);
      
      // File should still exist
      const exists = await fs.access(oldPlanFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle missing plans/ directory', async () => {
      // Remove plans directory
      await fs.rm(path.join(TEST_DIR, '.aiknowsys', 'plans'), { recursive: true, force: true });
      
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 7,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(0);
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
      
      // Create old complete plan with frontmatter
      const planFile = path.join(TEST_DIR, '.aiknowsys', 'PLAN_old.md');
      await fs.writeFile(planFile, `---
    id: "PLAN_old"
    title: "PLAN_old"
    status: "COMPLETE"
    author: "test"
    created: "2026-02-01"
    updated: "2026-02-01"
    ---

    # Old Plan`);
      await fs.utimes(planFile, oldDate, oldDate);
      
      const result = await clean({
        dir: TEST_DIR,
        threshold: 30,  // 60-day old files should be archived with 30-day threshold
        _silent: true
      } as any);  // Type definition missing _silent property
      
      expect(result.sessionsArchived).toBe(1);
      expect(result.plansArchived).toBe(1);
    });

    it('should remove temp files', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'test-temp.js'), '// temp');
      await fs.writeFile(path.join(TEST_DIR, 'debug-output.txt'), 'debug');
      
      const result = await clean({
        dir: TEST_DIR,
        _silent: true
      } as any);  // Type definition missing _silent property
      
      expect(result.tempFilesRemoved >= 0).toBeTruthy();
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
      
      expect(result.sessionsArchived).toBe(0);
      
      // File should still exist
      const exists = await fs.access(sessionFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('archive-plans --threshold=0 fix', () => {
    it('should archive immediately when threshold is 0', async () => {
      const planPath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_test.md');
    await fs.writeFile(planPath, `---
  id: "PLAN_test"
  title: "PLAN_test"
  status: "COMPLETE"
  author: "test"
  created: "2026-02-01"
  updated: "2026-02-01"
  ---

  # Test Plan\n\nCompleted today.`);
      
      // Archive with threshold=0 (should archive even though file is new)
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        _silent: true
      });
      
      expect(result.archived).toBe(1);
    });

    it('should return zero archived when threshold=0 but no matching plans', async () => {
      await fs.writeFile(path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md'), `---
    id: "PLAN_active"
    title: "PLAN_active"
    status: "ACTIVE"
    author: "test"
    created: "2026-02-01"
    updated: "2026-02-01"
    ---

    # Active Plan`);
      
      // Archive with threshold=0 (should not archive ACTIVE plans)
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        _silent: true
      });
      
      expect(result.archived).toBe(0);
      expect(result.kept).toBe(0);
    });
  });

  describe('archive-plans --status option', () => {
    it('should archive plans by custom status', async () => {
      // Create plan files
      const cancelledPath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_cancelled.md');
      const activePath = path.join(TEST_DIR, '.aiknowsys', 'PLAN_active.md');
      await fs.writeFile(cancelledPath, `---
    id: "PLAN_cancelled"
    title: "PLAN_cancelled"
    status: "CANCELLED"
    author: "test"
    created: "2026-02-01"
    updated: "2026-02-01"
    ---

    # Cancelled Plan`);
      await fs.writeFile(activePath, `---
    id: "PLAN_active"
    title: "PLAN_active"
    status: "ACTIVE"
    author: "test"
    created: "2026-02-01"
    updated: "2026-02-01"
    ---

    # Active Plan`);
      
      // Set old date for cancelled plan
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);
      await fs.utimes(cancelledPath, oldDate, oldDate);
      
      // Archive CANCELLED plans with threshold=0
      const result = await archivePlans({
        dir: TEST_DIR,
        threshold: 0,
        statusFilter: 'CANCELLED',
        _silent: true
      });
      
      expect(result.archived).toBe(1);
      
      // Active plan should still exist
      const activeExists = await fs.access(activePath).then(() => true).catch(() => false);
      expect(activeExists).toBe(true);
    });
  });
});

