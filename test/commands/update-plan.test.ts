/**
 * Tests for update-plan command
 * Phase 1: Core update-plan Command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { updatePlan } from '../../lib/commands/update-plan.js';
import { createPlan } from '../../lib/commands/create-plan.js';

describe('update-plan command', () => {
  const testDir = path.join(process.cwd(), 'test-fixtures', 'update-plan-test');
  const username = 'test-user';

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(path.join(testDir, '.aiknowsys', 'plans'), { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Status transitions', () => {
    it('updates status: PLANNED → ACTIVE', async () => {
      // Create a plan
      const created = await createPlan({
        title: 'Test Plan',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Initially plan should be PLANNED
      let content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "PLANNED"');

      // Update to ACTIVE
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: PLANNED → ACTIVE');

      // Verify frontmatter updated
      content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "ACTIVE"');
      expect(content).toMatch(/started: "\d{4}-\d{2}-\d{2}"/); // Started date added

      // Verify active pointer updated
      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);
      const pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('🎯 ACTIVE');
      expect(pointerContent).toContain('Test Plan');

      // Verify sync-plans ran (CURRENT_PLAN.md should exist and contain plan)
      const indexPath = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      expect(indexContent).toContain('Test Plan');
      expect(indexContent).toContain(username);
    });

    it('updates status: ACTIVE → COMPLETE', async () => {
      // Create and activate a plan
      const created = await createPlan({
        title: 'Complete Me',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Complete the plan
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'COMPLETE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: ACTIVE → COMPLETE');

      // Verify frontmatter updated
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "COMPLETE"');
      expect(content).toMatch(/completed: "\d{4}-\d{2}-\d{2}"/); // Completed date added

      // Verify active pointer cleared (set to "None")
      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);
      const pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('**Currently Working On:** None');
      expect(pointerContent).toContain('✅ COMPLETE');

      // Verify sync-plans ran
      const indexPath = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      expect(indexContent).toContain('*No active plan*');
    });

    it('updates status: ACTIVE → PAUSED', async () => {
      // Create and activate a plan
      const created = await createPlan({
        title: 'Pause Me',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Pause the plan
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'PAUSED',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: ACTIVE → PAUSED');

      // Verify frontmatter updated
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "PAUSED"');

      // Verify active pointer STILL points to plan (not cleared)
      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);
      const pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('Pause Me');
      expect(pointerContent).toContain('🔄 PAUSED');

      // Verify sync-plans ran
      const indexPath = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
      expect(await fs.access(indexPath).then(() => true, () => false)).toBe(true);
    });

    it('updates status: PAUSED → ACTIVE', async () => {
      // Create, activate, then pause a plan
      const created = await createPlan({
        title: 'Resume Me',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'PAUSED',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Resume (PAUSED → ACTIVE)
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: PAUSED → ACTIVE');

      // Verify frontmatter updated
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "ACTIVE"');

      // Verify active pointer updated
      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);
      const pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('🎯 ACTIVE');
      expect(pointerContent).toContain('Resume Me');
    });

    it('updates status: * → CANCELLED', async () => {
      // Create and activate a plan
      const created = await createPlan({
        title: 'Cancel Me',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Cancel the plan
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'CANCELLED',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: ACTIVE → CANCELLED');

      // Verify frontmatter updated
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "CANCELLED"');
      expect(content).toMatch(/completed: "\d{4}-\d{2}-\d{2}"/); // Completed date added (cancelled uses completed field)

      // Verify active pointer cleared
      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);
      const pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('**Currently Working On:** None');
      expect(pointerContent).toContain('❌ CANCELLED');
    });
  });

  describe('Auto-detect and validation', () => {
    it('auto-detects plan ID from active pointer', async () => {
      // Create and activate a plan
      const created = await createPlan({
        title: 'Auto Detect',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Activate (creates pointer)
      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: testDir,
        _silent: true
      });

      // Update without specifying planId (should auto-detect)
      const result = await updatePlan({
        setStatus: 'PAUSED',
        targetDir: testDir,
        author: username, // Need to specify author for auto-detection
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.planId).toBe(created.planId);

      // Verify status changed
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "PAUSED"');
    });

    it('throws error when plan not found', async () => {
      await expect(updatePlan({
        planId: 'PLAN_nonexistent',
        setStatus: 'ACTIVE',
        targetDir: testDir,
        _silent: true
      })).rejects.toThrow(/Plan not found/);
    });

    it('throws error for invalid status value', async () => {
      const created = await createPlan({
        title: 'Invalid Status',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      await expect(updatePlan({
        planId: created.planId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStatus: 'INVALID' as any,
        targetDir: testDir,
        _silent: true
      })).rejects.toThrow(/Invalid status/);
    });

    it('throws error when no active plan and ID omitted', async () => {
      await expect(updatePlan({
        setStatus: 'ACTIVE',
        targetDir: testDir,
        author: username,
        _silent: true
      })).rejects.toThrow(/No active plan found/);
    });
  });

  describe('Auto-sync verification', () => {
    it('automatically runs sync-plans after status change', async () => {
      const created = await createPlan({
        title: 'Auto Sync Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Activate plan
      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: testDir,
        _silent: true
      });

      // Verify CURRENT_PLAN.md was created and contains plan
      const indexPath = path.join(testDir, '.aiknowsys', 'CURRENT_PLAN.md');
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      
      expect(indexContent).toContain('Current Team Plans');
      expect(indexContent).toContain('Auto Sync Test');
      expect(indexContent).toContain(username);
    });
  });

  describe('Timestamp management', () => {
    it('adds started date when transitioning to ACTIVE', async () => {
      const created = await createPlan({
        title: 'Started Date Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      const date = new Date().toISOString().split('T')[0];

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: testDir,
        _silent: true
      });

      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain(`started: "${date}"`);
    });

    it('adds completed date when transitioning to COMPLETE', async () => {
      const created = await createPlan({
        title: 'Completed Date Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      const date = new Date().toISOString().split('T')[0];

      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: testDir,
        _silent: true
      });

      await updatePlan({
        planId: created.planId,
        setStatus: 'COMPLETE',
        targetDir: testDir,
        _silent: true
      });

      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain(`completed: "${date}"`);
    });

    it('adds completed date when transitioning to CANCELLED', async () => {
      const created = await createPlan({
        title: 'Cancelled Date Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      const date = new Date().toISOString().split('T')[0];

      await updatePlan({
        planId: created.planId,
        setStatus: 'CANCELLED',
        targetDir: testDir,
        _silent: true
      });

      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain(`completed: "${date}"`);
    });
  });

  describe('Active pointer updates', () => {
    it('updates active pointer with correct status emoji', async () => {
      const created = await createPlan({
        title: 'Emoji Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      const pointerPath = path.join(testDir, '.aiknowsys', 'plans', `active-${username}.md`);

      //  ACTIVE → 🎯
      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });
      let pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('🎯 ACTIVE');

      // PAUSED → 🔄
      await updatePlan({
        planId: created.planId,
        setStatus: 'PAUSED',
        author: username,
        targetDir: testDir,
        _silent: true
      });
      pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('🔄 PAUSED');

      // COMPLETE → ✅
      await updatePlan({
        planId: created.planId,
        setStatus: 'COMPLETE',
        author: username,
        targetDir: testDir,
        _silent: true
      });
      pointerContent = await fs.readFile(pointerPath, 'utf-8');
      expect(pointerContent).toContain('✅ COMPLETE');
    });
  });

  describe('Progress append', () => {
    it('appends to existing ## Progress section', async () => {
      const created = await createPlan({
        title: 'Progress Test',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Activate plan
      await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Add progress note
      const date = new Date().toISOString().split('T')[0];
      const result = await updatePlan({
        planId: created.planId,
        append: 'Phase 1 complete',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Added progress note');

      // Verify content
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('## Progress');
      expect(content).toContain(`**${date}:** Phase 1 complete`);
    });

    it('creates ## Progress section if missing', async () => {
      const created = await createPlan({
        title: 'No Progress Section',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Remove ## Progress section from plan (simulate old plan format)
      let content = await fs.readFile(created.filePath, 'utf-8');
      content = content.replace(/## Progress[\s\S]*?(?=##|$)/, '');
      await fs.writeFile(created.filePath, content, 'utf-8');

      // Add progress note
      const date = new Date().toISOString().split('T')[0];
      const result = await updatePlan({
        planId: created.planId,
        append: 'Started implementation',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);

      // Verify ## Progress section was created
      content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('## Progress');
      expect(content).toContain(`**${date}:** Started implementation`);
    });

    it('appends from file', async () => {
      const created = await createPlan({
        title: 'Append From File',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Create temp file with progress notes
      const tempFile = path.join(testDir, 'progress-notes.md');
      await fs.writeFile(tempFile, '- Completed Phase 1\n- Started Phase 2\n', 'utf-8');

      // Append from file
      const result = await updatePlan({
        planId: created.planId,
        appendFile: tempFile,
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);

      // Verify content
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('## Progress');
      expect(content).toContain('- Completed Phase 1');
      expect(content).toContain('- Started Phase 2');
    });

    it('appends with inline content', async () => {
      const created = await createPlan({
        title: 'Inline Content',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Append inline content
      const result = await updatePlan({
        planId: created.planId,
        append: 'All tests passing (14/14)',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);

      // Verify content
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('All tests passing (14/14)');
    });

    it('combines status change + progress append', async () => {
      const created = await createPlan({
        title: 'Combined Update',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      // Update status and add progress in one call
      const result = await updatePlan({
        planId: created.planId,
        setStatus: 'ACTIVE',
        append: 'Activated plan and started work',
        author: username,
        targetDir: testDir,
        _silent: true
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Status: PLANNED → ACTIVE');
      expect(result.changes).toContain('Added progress note');

      // Verify frontmatter updated
      const content = await fs.readFile(created.filePath, 'utf-8');
      expect(content).toContain('status: "ACTIVE"');

      // Verify progress added
      expect(content).toContain('Activated plan and started work');
    });
  });
});
