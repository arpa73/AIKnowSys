/**
 * TDD Tests for syncPlansCore (Pure Business Logic)
 * 
 * Phase 2 Batch 1: Architectural Fix - Extract syncPlans to lib/core
 * Tests written to maintain TDD compliance for extracted logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { syncPlansCore } from '../../lib/core/sync-plans.js';

describe('syncPlansCore (Pure Business Logic)', () => {
  const TEST_DIR = resolve(process.cwd(), `test-tmp-sync-plans-${Date.now()}`);

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

  describe('Architectural Refactor - Pure Function Tests', () => {
    it('should generate empty index when no plans exist', async () => {
      const result = await syncPlansCore({ targetDir: TEST_DIR });

      expect(result.success).toBe(true);
      expect(result.planCount).toBe(0);
      expect(result.outputPath).toContain('CURRENT_PLAN.md');

      // Verify file was created
      expect(existsSync(result.outputPath)).toBe(true);

      // Verify content
      const { readFile } = await import('fs/promises');
      const content = await readFile(result.outputPath, 'utf-8');
      expect(content).toContain('No active plans found');
      expect(content).toContain('Developer Count:** 0');
    });

    it('should sync single developer plan', async () => {
      // Create plans directory and active pointer
      const plansDir = resolve(TEST_DIR, '.aiknowsys', 'plans');
      await mkdir(plansDir, { recursive: true });

      const pointerContent = `# Active Plan: test-user

**Currently Working On:** [Test Plan](../PLAN_test.md)  
**Status:** 🎯 ACTIVE  
**Last Updated:** 2026-02-10

---
`;

      await writeFile(resolve(plansDir, 'active-test-user.md'), pointerContent, 'utf-8');

      // Run sync
      const result = await syncPlansCore({ targetDir: TEST_DIR });

      expect(result.success).toBe(true);
      expect(result.planCount).toBe(1);
      expect(result.developers).toBeDefined();
      expect(result.developers?.length).toBe(1);
      expect(result.developers?.[0].username).toBe('test-user');
      expect(result.developers?.[0].plan).toContain('Test Plan');
    });

    it('should sync multiple developer plans', async () => {
      // Create plans directory
      const plansDir = resolve(TEST_DIR, '.aiknowsys', 'plans');
      await mkdir(plansDir, { recursive: true });

      // Create multiple active pointers
      const users = ['alice', 'bob', 'charlie'];
      for (const user of users) {
        const pointerContent = `# Active Plan: ${user}

**Currently Working On:** [${user} Plan](../PLAN_${user}.md)  
**Status:** 🎯 ACTIVE  
**Last Updated:** 2026-02-10
`;
        await writeFile(resolve(plansDir, `active-${user}.md`), pointerContent, 'utf-8');
      }

      // Run sync
      const result = await syncPlansCore({ targetDir: TEST_DIR });

      expect(result.success).toBe(true);
      expect(result.planCount).toBe(3);
      expect(result.developers?.length).toBe(3);

      // Verify CURRENT_PLAN.md was created
      expect(existsSync(result.outputPath)).toBe(true);

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.outputPath, 'utf-8');
      expect(content).toContain('alice');
      expect(content).toContain('bob');
      expect(content).toContain('charlie');
      expect(content).toContain('Developer Count:** 3');
    });

    it('should handle relative path normalization', async () => {
      // Create plan pointer with relative path
      const plansDir = resolve(TEST_DIR, '.aiknowsys', 'plans');
      await mkdir(plansDir, { recursive: true });

      const pointerContent = `# Active Plan: test-user

**Currently Working On:** [Plan](../PLAN_test.md)  
**Status:** 🎯 ACTIVE  
**Last Updated:** 2026-02-10
`;

      await writeFile(resolve(plansDir, 'active-test-user.md'), pointerContent, 'utf-8');

      const result = await syncPlansCore({ targetDir: TEST_DIR });

      expect(result.success).toBe(true);
      
      // Verify path was normalized (../PLAN_test.md → PLAN_test.md)
      const { readFile } = await import('fs/promises');
      const content = await readFile(result.outputPath, 'utf-8');
      expect(content).toContain('](PLAN_test.md)');
      expect(content).not.toContain('](../PLAN_test.md)');
    });

    it('should handle developers with no active plan', async () => {
      const plansDir = resolve(TEST_DIR, '.aiknowsys', 'plans');
      await mkdir(plansDir, { recursive: true });

      const pointerContent = `# Active Plan: test-user

**Currently Working On:** None  
**Status:** 📋 PLANNED  
**Last Updated:** 2026-02-10
`;

      await writeFile(resolve(plansDir, 'active-test-user.md'), pointerContent, 'utf-8');

      const result = await syncPlansCore({ targetDir: TEST_DIR });

      expect(result.success).toBe(true);
      expect(result.planCount).toBe(1);
      expect(result.developers?.[0].plan).toBe('None');

      const { readFile } = await import('fs/promises');
      const content = await readFile(result.outputPath, 'utf-8');
      expect(content).toContain('*No active plan*');
    });
  });
});
