/**
 * TDD Tests for createPlanCore (Pure Business Logic)
 * 
 * Phase 2 Batch 1: Mutation Commands
 * Written FIRST following strict TDD workflow (RED → GREEN → REFACTOR)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createPlanCore } from '../../lib/core/create-plan.js';

describe('createPlanCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-plan-${Date.now()}`);

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
    it('should create a new plan file with proper structure', async () => {
      const result = await createPlanCore({
        title: 'Test Plan Implementation',
        author: 'test-user',
        topics: ['testing', 'core'],
        targetDir: TEST_DIR
      });

      // Verify return structure
      expect(result.created).toBe(true);
      expect(result.planId).toMatch(/^PLAN_test_plan_implementation$/);
      expect(result.filePath).toContain('.aiknowsys/PLAN_test_plan_implementation.md');
      expect(result.pointerPath).toContain('.aiknowsys/plans/active-test-user.md');

      // Verify file was created
      expect(existsSync(result.filePath)).toBe(true);
      expect(existsSync(result.pointerPath)).toBe(true);
    });

    it('should return created=false if plan already exists', async () => {
      // Create plan first time
      const first = await createPlanCore({
        title: 'Duplicate Plan',
        targetDir: TEST_DIR
      });

      expect(first.created).toBe(true);

      // Try to create same plan again
      const second = await createPlanCore({
        title: 'Duplicate Plan',
        targetDir: TEST_DIR
      });

      expect(second.created).toBe(false);
      expect(second.planId).toBe(first.planId);
    });

    it('should handle missing topics gracefully', async () => {
      const result = await createPlanCore({
        title: 'Plan Without Topics',
        targetDir: TEST_DIR
      });

      expect(result.created).toBe(true);
      expect(result.planId).toMatch(/^PLAN_plan_without_topics$/);
    });

    it('should throw error for invalid title (< 3 chars)', async () => {
      await expect(
        createPlanCore({
          title: 'ab',
          targetDir: TEST_DIR
        })
      ).rejects.toThrow(/title must be at least 3 characters/i);
    });

    it('should NOT log anything (pure function)', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const consoleInfoSpy = vi.spyOn(console, 'info');

      await createPlanCore({
        title: 'Silent Plan Test',
        targetDir: TEST_DIR
      });

      // Pure function should NOT have side effects (no console output)
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should update context index after creation', async () => {
      await createPlanCore({
        title: 'Index Update Test',
        topics: ['indexing'],
        targetDir: TEST_DIR
      });

      // Verify context index was updated
      const indexPath = resolve(TEST_DIR, '.aiknowsys', 'context-index.json');
      expect(existsSync(indexPath)).toBe(true);

      // Read and verify index contains plans array
      const { readFile } = await import('fs/promises');
      const indexContent = await readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);

      expect(index.plans).toBeDefined();
      expect(Array.isArray(index.plans)).toBe(true);
      expect(index.plans.length).toBeGreaterThan(0);
    });

    it('should use auto-detected author if not provided', async () => {
      const result = await createPlanCore({
        title: 'Auto Author Test',
        targetDir: TEST_DIR
        // author omitted - should auto-detect
      });

      expect(result.created).toBe(true);
      expect(result.pointerPath).toMatch(/active-[a-z0-9_-]+\.md$/);
    });

    it('should generate correct plan ID from title', async () => {
      const testCases = [
        { title: 'Simple Plan', expected: 'PLAN_simple_plan' },
        { title: 'Multi Word Plan Title', expected: 'PLAN_multi_word_plan_title' },
        { title: 'Plan-With-Dashes', expected: 'PLAN_plan_with_dashes' }
      ];

      for (const { title, expected } of testCases) {
        const result = await createPlanCore({
          title,
          targetDir: `${TEST_DIR}-${Date.now()}`
        });

        expect(result.planId).toBe(expected);
      }
    });
  });
});
