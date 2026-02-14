/**
 * TDD Tests for updatePlanCore (Pure Business Logic)
 * 
 * Phase 2 Batch 1: Mutation Commands
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { updatePlanCore } from '../../lib/core/update-plan.js';
import { createPlanCore } from '../../lib/core/create-plan.js';

describe('updatePlanCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-update-plan-${Date.now()}`);

  beforeEach(async () => {
    // Clean slate for each test
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('🔴 RED Phase - These tests should FAIL initially', () => {
    it('should update plan status', async () => {
      // Create a plan first
      const created = await createPlanCore({
        title: 'Test Plan Status',
        author: 'test-user',
        targetDir: TEST_DIR
      });

      // Update status
      const result = await updatePlanCore({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('Status'))).toBe(true);
      expect(result.changes?.some(c => /PLANNED.*ACTIVE/.test(c))).toBe(true);
    });

    it('should append progress notes', async () => {
      // Create a plan first
      const created = await createPlanCore({
        title: 'Progress Test Plan',
        targetDir: TEST_DIR
      });

      // Append progress
      const result = await updatePlanCore({
        planId: created.planId,
        append: 'Phase 1 complete',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes).toContain('Added progress note');

      // Verify content was appended
      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('Phase 1 complete');
      expect(content).toContain('## Progress');
    });

    it('should auto-detect plan from active pointer', async () => {
      // Create a plan (which sets it as active)
      const created = await createPlanCore({
        title: 'Auto Detect Plan',
        author: 'test-auto',
        targetDir: TEST_DIR
      });

      // Update without specifying planId (should auto-detect)
      const result = await updatePlanCore({
        author: 'test-auto',
        append: 'Auto-detected update',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.planId).toBe(created.planId);
    });

    it('should throw error for invalid planId', async () => {
      await expect(
        updatePlanCore({
          planId: 'PLAN_nonexistent',
          setStatus: 'ACTIVE',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/Plan not found/i);
    });

    it('should throw error for invalid status', async () => {
      const created = await createPlanCore({
        title: 'Invalid Status Test',
        targetDir: TEST_DIR
      });

      await expect(
        updatePlanCore({
          planId: created.planId,
          setStatus: 'INVALID_STATUS' as any,
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/Invalid status/i);
    });

    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const created = await createPlanCore({
        title: 'Silent Update Test',
        targetDir: TEST_DIR
      });

      await updatePlanCore({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: TEST_DIR
      });

      // Pure function should NOT have side effects (no console output)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should update context index after modification', async () => {
      const created = await createPlanCore({
        title: 'Index Test Plan',
        targetDir: TEST_DIR
      });

      await updatePlanCore({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: TEST_DIR
      });

      // Verify context index was updated
      const indexPath = resolve(TEST_DIR, '.aiknowsys', 'context-index.json');
      expect(existsSync(indexPath)).toBe(true);

      const indexContent = await readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      expect(index.plans).toBeDefined();
      expect(Array.isArray(index.plans)).toBe(true);
    });

    it('should support multiple status transitions', async () => {
      const created = await createPlanCore({
        title: 'Status Lifecycle Plan',
        targetDir: TEST_DIR
      });

      // PLANNED → ACTIVE
      const activated = await updatePlanCore({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: TEST_DIR
      });
      expect(activated.updated).toBe(true);

      // ACTIVE → PAUSED
      const paused = await updatePlanCore({
        planId: created.planId,
        setStatus: 'PAUSED',
        targetDir: TEST_DIR
      });
      expect(paused.updated).toBe(true);

      // PAUSED → ACTIVE
      const resumed = await updatePlanCore({
        planId: created.planId,
        setStatus: 'ACTIVE',
        targetDir: TEST_DIR
      });
      expect(resumed.updated).toBe(true);

      // ACTIVE → COMPLETE
      const completed = await updatePlanCore({
        planId: created.planId,
        setStatus: 'COMPLETE',
        targetDir: TEST_DIR
      });
      expect(completed.updated).toBe(true);
    });

    it('should combine status update and progress append', async () => {
      const created = await createPlanCore({
        title: 'Combined Update Plan',
        targetDir: TEST_DIR
      });

      const result = await updatePlanCore({
        planId: created.planId,
        setStatus: 'COMPLETE',
        append: 'All features implemented and tested',
        targetDir: TEST_DIR
      });

      expect(result.updated).toBe(true);
      expect(result.changes?.some(c => c.includes('Status'))).toBe(true);
      expect(result.changes).toContain('Added progress note');

      const content = await readFile(result.filePath, 'utf-8');
      expect(content).toContain('All features implemented');
    });
  });
});
